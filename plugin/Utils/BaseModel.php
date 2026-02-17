<?php

namespace App\Utils;

use WP_Error;

abstract class BaseModel
{
    /**
     * @var string Database table name (without prefix)
     */
    protected $table;

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';

    /**
     * @var array Fillable fields for mass assignment
     */
    protected $fillable = [];

    /**
     * @var array Hidden fields that should not be included in results
     */
    protected $hidden = [];

    /**
     * @var bool Whether to automatically manage created_at/updated_at timestamps
     */
    protected $timestamps = true;

    /**
     * @var \wpdb WordPress database instance
     */
    protected $db;

    /**
     * @var array Model attributes
     */
    protected $attributes = [];

    /**
     * @var array Query builder state
     */
    protected $query = [
        'where' => [],
        'orWhere' => [],
        'orderBy' => [],
        'limit' => null,
        'offset' => null,
        'withTrashed' => false
    ];

    /**
     * BaseModel constructor.
     */
    public function __construct($data = [])
    {
        global $wpdb;
        $this->db = $wpdb;
        $this->table = $wpdb->prefix . $this->table;

        if (!empty($data)) {
            $this->fill($data);
        }
    }

    /**
     * Fill the model with data
     */
    public function fill($data)
    {
        if (is_object($data)) {
            $data = (array) $data;
        }

        $data = $this->reverseCastAttributes($data);
        $this->attributes = $data;
        return $this;
    }

    /**
     * Get an attribute value
     */
    public function __get($key)
    {
        return isset($this->attributes[$key]) ? $this->attributes[$key] : null;
    }

    /**
     * Set an attribute value
     */
    public function __set($key, $value)
    {
        $this->attributes[$key] = $value;
    }

    /**
     * Check if an attribute exists
     */
    public function __isset($key)
    {
        return isset($this->attributes[$key]);
    }

    /**
     * Convert the model to an array
     * 
     * @return array
     */
    public function toArray()
    {
        return $this->attributes;
    }

    /**
     * Find a record by primary key
     * 
     * @param int|string $id
     * @return static|null
     */
    public function find($id)
    {
        return $this->where($this->primaryKey, $id)->firstOrModel();
    }

    /**
     * Find a record by ID (static method)
     */
    public static function findById($id)
    {
        $instance = new static();
        return $instance->find($id);
    }

    /**
     * Find a record by column value
     * 
     * @param string $column
     * @param mixed $value
     * @return object|null
     */
    public function findBy($column, $value)
    {
        return $this->where($column, $value)->first();
    }

    /**
     * Get the first record matching the query
     * 
     * @return object|null Raw database result
     */
    public function first()
    {
        $results = $this->limit(1)->get();
        return !empty($results) ? $results[0] : null;
    }

    /**
     * Get the first record as a model instance
     * 
     * @return static|null Model instance or null
     */
    public function firstOrModel()
    {
        $result = $this->first();
        if (!$result) {
            return null;
        }

        $model = new static();
        $model->fill((array) $result);
        return $model;
    }

    /**
     * Get all records
     * 
     * @param array $columns
     * @return array
     */
    public function all($columns = ['*'])
    {
        return $this->get($columns);
    }

    /**
     * Execute the query and get results
     * 
     * @param int|array $limitOrColumns
     * @return array
     */
    public function get($limitOrColumns = null)
    {
        $query = $this->buildQuery($limitOrColumns);

        $results = $this->db->get_results($query);

        if (defined('WP_DEBUG') && WP_DEBUG) {
            if ($this->db->last_error) {
                error_log('BaseModel::get - Database error: ' . $this->db->last_error);
            }
        }

        $this->resetQuery();

        // Return raw results without converting to model instances
        return $results;
    }

    /**
     * Get the results as model instances
     * 
     * @param int|array $limitOrColumns
     * @return static[]
     */
    public function getModels($limitOrColumns = null)
    {
        $results = $this->get($limitOrColumns);
        $models = [];

        foreach ($results as $result) {
            $model = new static();
            $model->fill((array) $result);
            $models[] = $model;
        }

        return $models;
    }

    /**
     * Paginate results
     * 
     * @param int $perPage
     * @param int $page
     * @param array $columns
     * @return array
     */
    public function paginate($perPage = 15, $page = null, $columns = ['*'])
    {
        $page = $page ?: (isset($_GET['page']) ? (int) $_GET['page'] : 1);
        $offset = ($page - 1) * $perPage;

        $results = $this->limit($perPage)
            ->offset($offset)
            ->get($columns);

        $total = $this->count();

        return [
            'data' => $results,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage)
        ];
    }

    /**
     * Count matching records
     * 
     * @return int
     */
    public function count()
    {
        $query = $this->buildQuery('COUNT(*) as count');
        $result = $this->db->get_var($query);
        $this->resetQuery();
        return (int) $result;
    }

    /**
     * Search across multiple columns
     * 
     * @param string $term
     * @param array $columns
     * @return $this
     */
    public function search($term, $columns = [])
    {
        if (empty($columns)) {
            $columns = $this->fillable;
        }

        $this->query['where'][] = function () use ($term, $columns) {
            $like = '%' . $this->db->esc_like($term) . '%';
            $conditions = [];
            $values = [];

            foreach ($columns as $column) {
                $conditions[] = "{$column} LIKE %s";
                $values[] = $like;
            }

            return [
                'sql' => '(' . implode(' OR ', $conditions) . ')',
                'values' => $values
            ];
        };

        return $this;
    }

    /**
     * Add a basic where clause
     * 
     * @param string $column
     * @param mixed $operator
     * @param mixed $value
     * @param string $boolean
     * @return $this
     */
    public function where($column, $operator = null, $value = null, $boolean = 'AND')
    {
        // If the column is an array, assume an array of where clauses
        if (is_array($column)) {
            return $this->addArrayOfWheres($column, $boolean);
        }

        // If the column is a closure, we'll assume the developer wants to add a nested where
        if ($column instanceof \Closure) {
            return $this->whereNested($column, $boolean);
        }

        // If only 2 arguments are passed, we'll assume the operator is an equals sign
        // and set the value to the second argument
        if (func_num_args() === 2) {
            $value = $operator;
            $operator = '=';
        }

        // If the operator is not a valid operator, we'll assume the developer wants to do an equals
        $operator = strtoupper($operator);
        if (!in_array($operator, ['=', '<', '>', '<=', '>=', '<>', '!=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL', 'BETWEEN', 'NOT BETWEEN'])) {
            $value = $operator;
            $operator = '=';
        }

        // Add the where clause to the query
        $this->query['where'][] = [
            'type' => 'basic',
            'column' => $column,
            'operator' => $operator,
            'value' => $value,
            'boolean' => $boolean
        ];

        return $this;
    }

    /**
     * Add an "or where" clause
     * 
     * @param string $column
     * @param mixed $operator
     * @param mixed $value
     * @return $this
     */
    public function orWhere($column, $operator = null, $value = null)
    {
        return $this->where($column, $operator, $value, 'OR');
    }

    /**
     * Add an "order by" clause
     * 
     * @param string $column
     * @param string $direction
     * @return $this
     */
    public function orderBy($column, $direction = 'asc')
    {
        $this->query['orderBy'][] = [
            'column' => $column,
            'direction' => strtolower($direction) === 'desc' ? 'DESC' : 'ASC'
        ];

        return $this;
    }

    /**
     * Set the "limit" value of the query
     * 
     * @param int $limit
     * @return $this
     */
    public function limit($limit)
    {
        $this->query['limit'] = (int) $limit;
        return $this;
    }

    /**
     * Set the "offset" value of the query
     * 
     * @param int $offset
     * @return $this
     */
    public function offset($offset)
    {
        $this->query['offset'] = (int) $offset;
        return $this;
    }

    /**
     * Include soft deleted records
     * 
     * @return $this
     */
    public function withTrashed()
    {
        $this->query['withTrashed'] = true;
        return $this;
    }

    /**
     * Create a new record
     * 
     * @param array $data
     * @return object|false
     */
    public function create(array $data)
    {
        $data = $this->filterFillable($data);
        $data = $this->castAttributes($data);

        if ($this->timestamps) {
            $now = current_time('mysql');
            $data['created_at'] = $now;
            $data['updated_at'] = $now;
        }

        $result = $this->db->insert($this->table, $data);

        if ($result === false) {
            return false;
        }

        // For UUID primary keys, use the provided ID; otherwise use insert_id
        $insertedId = !empty($data[$this->primaryKey]) ? $data[$this->primaryKey] : $this->db->insert_id;

        return $this->find($insertedId);
    }

    public function createMany(array $records)
    {
        if (empty($records)) {
            return [];
        }

        // Get column names from first record
        $columns = array_keys($records[0]);
        $columnList = '`' . implode('`,`', $columns) . '`';

        // Build placeholders and values
        $placeholders = [];
        $values = [];
        $currentTime = current_time('mysql');

        foreach ($records as $record) {
            $rowValues = [];
            foreach ($columns as $column) {
                $value = $record[$column] ?? null;

                // Handle special cases
                if ($column === 'created_at' && empty($value)) {
                    $value = $currentTime;
                }
                if ($column === 'updated_at' && empty($value)) {
                    $value = $currentTime;
                }
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value);
                }

                $rowValues[] = $value;
            }
            $placeholders[] = '(' . implode(',', array_fill(0, count($columns), '%s')) . ')';
            $values = array_merge($values, $rowValues);
        }

        $placeholderStr = implode(',', $placeholders);
        $query = "INSERT INTO {$this->table} ($columnList) VALUES $placeholderStr";

        // Prepare and execute the query
        $prepared = $this->db->prepare($query, $values);
        $result = $this->db->query($prepared);

        if ($result === false) {
            return false;
        }

        // Return inserted IDs
        $firstId = $this->db->insert_id;
        $insertedIds = [];
        for ($i = 0; $i < count($records); $i++) {
            $insertedIds[] = $firstId + $i;
        }

        return $insertedIds;
    }

    /**
     * Update a record
     */
    public function update($id, $data)
    {
        $data = $this->filterFillable($data);
        $data = $this->castAttributes($data);

        if ($this->timestamps) {
            $data['updated_at'] = current_time('mysql');
        }

        // Support composite primary keys if defined as an array
        if (is_array($this->primaryKey)) {
            $where = [];
            if (is_array($id)) {
                // If associative, use keys; if indexed, map in order
                if (array_keys($id) !== range(0, count($id) - 1)) {
                    // associative
                    foreach ($this->primaryKey as $pk) {
                        if (!array_key_exists($pk, $id))
                            continue;
                        $where[$pk] = $id[$pk];
                    }
                } else {
                    // indexed
                    foreach ($this->primaryKey as $idx => $pk) {
                        if (!isset($id[$idx]))
                            continue;
                        $where[$pk] = $id[$idx];
                    }
                }
            }

            if (!empty($where)) {
                $this->db->update($this->table, $data, $where);

                // Build a query to fetch the updated row
                $query = new static();
                foreach ($where as $col => $val) {
                    $query->where($col, $val);
                }
                return $query->first();
            }

            // If we cannot resolve a proper where, no-op
            return false;
        }

        $this->db->update(
            $this->table,
            $data,
            [$this->primaryKey => $id]
        );

        return $this->find($id);
    }

    /**
     * Delete a record by primary key
     */
    public function delete($id)
    {
        // Support composite primary keys if defined as an array
        if (is_array($this->primaryKey)) {
            $where = [];
            if (is_array($id)) {
                // If associative, use keys; if indexed, map in order
                if (array_keys($id) !== range(0, count($id) - 1)) {
                    foreach ($this->primaryKey as $pk) {
                        if (!array_key_exists($pk, $id))
                            continue;
                        $where[$pk] = $id[$pk];
                    }
                } else {
                    foreach ($this->primaryKey as $idx => $pk) {
                        if (!isset($id[$idx]))
                            continue;
                        $where[$pk] = $id[$idx];
                    }
                }
            }

            if (!empty($where)) {
                return $this->db->delete($this->table, $where);
            }

            return false;
        }

        return $this->db->delete(
            $this->table,
            [$this->primaryKey => $id]
        );
    }

    /**
     * Delete records by column value
     */
    public function deleteBy($column, $value)
    {
        $format = is_int($value) ? '%d' : '%s';
        return $this->db->delete(
            $this->table,
            [$column => $value],
            [$format]
        );
    }

    /**
     * Delete records matching where conditions
     */
    public function deleteWhere($conditions)
    {
        $formats = [];
        foreach ($conditions as $value) {
            $formats[] = is_int($value) ? '%d' : '%s';
        }

        return $this->db->delete(
            $this->table,
            $conditions,
            $formats
        );
    }

    /**
     * Build the SQL query from the query builder state
     * 
     * @param mixed $columns
     * @return string
     */
    protected function buildQuery($columns = null)
    {
        $select = is_array($columns) ? implode(', ', $columns) : ($columns ?: '*');
        $sql = "SELECT {$select} FROM {$this->table}";

        $where = $this->buildWhereClause();
        if ($where) {
            $sql .= ' WHERE ' . $where['sql'];
            $bindings = $where['bindings'];
        } else {
            $bindings = [];
        }

        if (!empty($this->query['orderBy'])) {
            $orderBy = [];
            foreach ($this->query['orderBy'] as $order) {
                $column = $this->quoteIdentifier($order['column']);
                $orderBy[] = "{$column} {$order['direction']}";
            }
            $orderClause = ' ORDER BY ' . implode(', ', $orderBy);
            $sql .= $orderClause;
        }

        if ($this->query['limit'] !== null) {
            $limitClause = ' LIMIT %d';
            $sql .= $limitClause;
            $bindings[] = $this->query['limit'];

            if ($this->query['offset'] !== null) {
                $offsetClause = ' OFFSET %d';
                $sql .= $offsetClause;
                $bindings[] = $this->query['offset'];
            }
        }

        if (!empty($bindings)) {
            $originalSql = $sql;
            $sql = $this->db->prepare($sql, $bindings);
        }

        return $sql;
    }

    /**
     * Build the WHERE clause from the query builder state
     * 
     * @return array
     */
    protected function buildWhereClause()
    {
        $wheres = [];
        $bindings = [];

        // Handle soft deletes if enabled and not explicitly including trashed
        if ($this->usesSoftDeletes() && !$this->query['withTrashed']) {
            $wheres[] = 'deleted_at IS NULL';
        }

        // Process where conditions
        foreach ($this->query['where'] as $i => $where) {
            // Handle Closure-based where (e.g., from search())
            if (is_callable($where)) {
                $result = $where();
                if (!empty($result['sql'])) {
                    $wheres[] = ($i > 0 || !empty($wheres) ? 'AND ' : '') . $result['sql'];
                    if (!empty($result['values'])) {
                        $bindings = array_merge($bindings, $result['values']);
                    }
                }
            } elseif ($where['type'] === 'basic') {
                $operator = strtoupper($where['operator']);
                $boolean = ($i > 0 || !empty($wheres)) ? $where['boolean'] . ' ' : '';
                $column = $this->quoteIdentifier($where['column']);

                if (in_array($operator, ['IS NULL', 'IS NOT NULL'])) {
                    $wheres[] = "{$boolean}{$column} {$operator}";
                } else {
                    $wheres[] = "{$boolean}{$column} {$operator} %s";
                    $bindings[] = $where['value'];
                }
            } elseif ($where['type'] === 'nested') {
                $nestedWhere = $where['query']->buildWhereClause();
                if (!empty($nestedWhere['sql'])) {
                    $wheres[] = ($i > 0 || !empty($wheres) ? 'AND ' : '') . '(' . $nestedWhere['sql'] . ')';
                    $bindings = array_merge($bindings, $nestedWhere['bindings']);
                }
            }
        }

        // Process orWhere conditions
        foreach ($this->query['orWhere'] as $i => $where) {
            if ($where['type'] === 'basic') {
                $column = $this->quoteIdentifier($where['column']);
                $wheres[] = 'OR ' . "{$column} {$where['operator']} %s";
                $bindings[] = $where['value'];
            }
        }

        if (empty($wheres)) {
            return [];
        }

        // Combine all conditions with spaces
        $sql = implode(' ', $wheres);

        return [
            'sql' => $sql,
            'bindings' => $bindings
        ];
    }

    /**
     * Quote an identifier to avoid reserved word conflicts.
     *
     * @param string $identifier
     * @return string
     */
    protected function quoteIdentifier($identifier)
    {
        if (!$identifier || strpos($identifier, '`') !== false) {
            return $identifier;
        }

        // Skip raw expressions / functions
        if (strpos($identifier, '(') !== false || strpos($identifier, ' ') !== false) {
            return $identifier;
        }

        if (strpos($identifier, '.') !== false) {
            $parts = explode('.', $identifier);
            $parts = array_map(function ($part) {
                return "`{$part}`";
            }, $parts);
            return implode('.', $parts);
        }

        return "`{$identifier}`";
    }

    /**
     * Reset the query builder state
     * 
     * @return void
     */
    protected function resetQuery()
    {
        $this->query = [
            'where' => [],
            'orWhere' => [],
            'orderBy' => [],
            'limit' => null,
            'offset' => null,
            'withTrashed' => false
        ];
    }

    /**
     * Check if the model uses soft deletes
     * 
     * @return bool
     */
    protected function usesSoftDeletes()
    {
        return property_exists($this, 'softDeletes') && $this->softDeletes === true;
    }

    /**
     * Filter fillable fields
     * 
     * @param array $data
     * @return array
     */
    protected function filterFillable(array $data)
    {
        if (empty($this->fillable)) {
            return $data;
        }

        return array_intersect_key($data, array_flip($this->fillable));
    }

    /**
     * Cast attributes to their native types for database storage
     * 
     * @param array $data
     * @return array
     */
    protected function castAttributes(array $data)
    {
        if (!property_exists($this, 'casts') || empty($this->casts)) {
            // Even if no casts are defined, we should handle arrays/objects
            // by converting them to JSON to prevent database errors
            foreach ($data as $key => $value) {
                if (is_array($value) || is_object($value)) {
                    $data[$key] = json_encode($value);
                }
            }
            return $data;
        }

        foreach ($data as $key => $value) {
            $type = $this->casts[$key] ?? null;

            if (is_array($value) || is_object($value)) {
                // If the value is an array/object and the cast is not explicitly JSON/array/object,
                // we still want to encode it to avoid DB errors, unless it's a null/empty value
                if (!$type || !in_array($type, ['array', 'json', 'object'])) {
                    $data[$key] = json_encode($value);
                }
            }

            if (!$type)
                continue;

            switch ($type) {
                case 'array':
                case 'json':
                case 'object':
                    $data[$key] = json_encode($value);
                    break;
                case 'boolean':
                case 'bool':
                    $data[$key] = $value ? 1 : 0;
                    break;
                case 'integer':
                case 'int':
                    $data[$key] = (int) $value;
                    break;
                case 'decimal:2':
                    $data[$key] = number_format((float) $value, 2, '.', '');
                    break;
                case 'datetime':
                    if ($value instanceof \DateTime) {
                        $data[$key] = $value->format('Y-m-d H:i:s');
                    }
                    break;
            }
        }

        return $data;
    }

    /**
     * Reverse cast attributes from database values to native types
     * 
     * @param array $data
     * @return array
     */
    protected function reverseCastAttributes(array $data)
    {
        if (!property_exists($this, 'casts') || empty($this->casts)) {
            return $data;
        }

        foreach ($data as $key => $value) {
            if (!isset($this->casts[$key]))
                continue;

            $type = $this->casts[$key];

            switch ($type) {
                case 'array':
                case 'json':
                    if (is_array($value)) {
                        $data[$key] = $value;
                        break;
                    }
                    $decoded = json_decode($value, true);
                    $data[$key] = json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
                    break;
                case 'object':
                    if (is_object($value)) {
                        $data[$key] = $value;
                        break;
                    }
                    $decoded = json_decode($value, false);
                    $data[$key] = json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
                    break;
                case 'boolean':
                case 'bool':
                    $data[$key] = (bool) $value;
                    break;
                case 'integer':
                case 'int':
                    $data[$key] = (int) $value;
                    break;
                case 'float':
                case 'decimal:2':
                    $data[$key] = (float) $value;
                    break;
                case 'datetime':
                    if ($value && is_string($value)) {
                        try {
                            $data[$key] = new \DateTime($value);
                        } catch (\Exception $e) {
                            // Keep as string if invalid
                        }
                    }
                    break;
            }
        }

        return $data;
    }

    /**
     * Get the format for each column
     * 
     * @param array $data
     * @return array
     */
    protected function getFormats(array $data)
    {
        $formats = [];

        foreach ($data as $key => $value) {
            if (is_int($value)) {
                $formats[] = '%d';
            } elseif (is_float($value)) {
                $formats[] = '%f';
            } else {
                $formats[] = '%s';
            }
        }

        return $formats;
    }

    /**
     * Add an array of where clauses
     * 
     * @param array $wheres
     * @param string $boolean
     * @return $this
     */
    protected function addArrayOfWheres(array $wheres, $boolean = 'AND')
    {
        foreach ($wheres as $key => $value) {
            if (is_numeric($key) && is_array($value)) {
                $this->where(...array_values($value));
            } else {
                $this->where($key, '=', $value, $boolean);
            }
        }

        return $this;
    }

    /**
     * Add a nested where statement to the query.
     *
     * @param  \Closure  $callback
     * @param  string  $boolean
     * @return $this
     */
    public function whereNested(\Closure $callback, $boolean = 'AND')
    {
        $nested = new static();

        // Execute the callback with the nested query instance
        call_user_func($callback, $nested);

        // If the nested query has no conditions, we can skip it
        if (empty($nested->query['where'])) {
            return $this;
        }

        // Add the nested where to the current query
        $this->query['where'][] = [
            'type' => 'nested',
            'query' => $nested,
            'boolean' => $boolean,
        ];

        return $this;
    }

    /**
     * Save the model (create or update based on whether it exists)
     *
     * @return object|false The saved model instance or false on failure
     */
    public function save()
    {
        $data = $this->filterFillable($this->attributes);

        // Check if this is a new record (doesn't have primary key or primary key is not set)
        $primaryKeyValue = $this->{$this->primaryKey};

        if (empty($primaryKeyValue)) {
            // Create new record
            if ($this->timestamps && !isset($data['created_at'])) {
                $data['created_at'] = current_time('mysql');
            }
            if ($this->timestamps && !isset($data['updated_at'])) {
                $data['updated_at'] = current_time('mysql');
            }
            return $this->create($data);
        } else {
            // Update existing record
            if ($this->timestamps) {
                $data['updated_at'] = current_time('mysql');
            }
            return $this->update($primaryKeyValue, $data);
        }
    }

    /**
     * Define a belongsTo relationship
     *
     * @param string $relatedModel The related model class
     * @param string $foreignKey The foreign key column name
     * @param string $ownerKey The owner key column name (default: 'id')
     * @return object|null The related model instance or null
     */
    public function belongsTo(string $relatedModel, string $foreignKey, string $ownerKey = 'id')
    {
        $foreignKeyValue = $this->{$foreignKey};

        if (!$foreignKeyValue) {
            return null;
        }

        // Instantiate the related model
        $relatedInstance = new $relatedModel();

        // Find the related record
        return $relatedInstance->find($foreignKeyValue);
    }
}
