<?php
namespace App\Core\Document\Models;

use App\Utils\BaseModel;

class Document extends BaseModel
{
    protected $table = 'sta_documents';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'title',
        'slug',
        'category_id',
        'department_id',
        'summary',
        'content',
        'content_type',
        'external_url',
        'status',
        'version',
        'tags',
        'metadata',
        'created_by',
        'reviewed_by',
        'published_by',
        'published_at',
        'created_at',
        'updated_at'
    ];
    
    protected $casts = [
        'tags' => 'json',
        'metadata' => 'json',
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Create a new document
     * 
     * @param array $data Document data
     * @return int|false Insert ID or false on failure
     */
    public function create($data)
    {
        return $this->db->insert(
            $this->table,
            $data
        );
    }

    /**
     * Update document by ID
     * 
     * @param string $id Document ID
     * @param array $data Update data
     * @return int|false Number of rows updated or false on failure
     */
    public function update($id, $data)
    {
        return $this->db->update(
            $this->table,
            $data,
            ['id' => $id],
            null,
            ['%s']
        );
    }

    /**
     * Get document by ID
     * 
     * @param string $id Document ID
     * @return object|null Document object or null if not found
     */
    public function findById($id)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE id = %s",
                $id
            )
        );
    }

    /**
     * Get document by slug
     * 
     * @param string $slug Document slug
     * @return object|null Document object or null if not found
     */
    public function findBySlug($slug)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE slug = %s",
                $slug
            )
        );
    }

    /**
     * Get all documents with optional filters
     * 
     * @param array $filters Optional filters (status, category_id, created_by, etc.)
     * @param int $limit Optional limit
     * @param int $offset Optional offset
     * @return array Array of document objects
     */
    public function getDocuments($filters = [], $limit = null, $offset = 0)
    {
        // Use BaseModel query builder for simple filters
        $query = new static();
        if (!empty($filters['status'])) {
            $query = $query->where('status', $filters['status']);
        }
        if (!empty($filters['category_id'])) {
            $query = $query->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['created_by'])) {
            $query = $query->where('created_by', (int)$filters['created_by']);
        }
        if (!empty($filters['department_id'])) {
            $query = $query->where('department_id', $filters['department_id']);
        }

        if ($limit !== null) {
            $query = $query->limit((int)$limit)->offset((int)$offset);
        }

        return $query->orderBy('created_at', 'DESC')->get();
    }

    /**
     * Search documents by query
     * 
     * @param string $query Search query
     * @param array $filters Additional filters
     * @param int $limit Optional limit
     * @param int $offset Optional offset
     * @return array Array of document objects
     */
    public function searchDocuments($query, $filters = [], $limit = null, $offset = 0)
    {
        $where_conditions = [];
        $where_values = [];

        // Full-text search
        if (!empty($query)) {
            $where_conditions[] = "MATCH(title, summary, content) AGAINST(%s IN NATURAL LANGUAGE MODE)";
            $where_values[] = $query;
        }

        // Additional filters
        if (!empty($filters['status'])) {
            $where_conditions[] = "status = %s";
            $where_values[] = $filters['status'];
        }

        if (!empty($filters['category_id'])) {
            $where_conditions[] = "category_id = %s";
            $where_values[] = $filters['category_id'];
        }

        if (!empty($filters['tags'])) {
            $tags = is_array($filters['tags']) ? $filters['tags'] : [$filters['tags']];
            foreach ($tags as $tag) {
                $where_conditions[] = "JSON_CONTAINS(tags, %s)";
                $where_values[] = json_encode($tag);
            }
        }

        $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        $limit_clause = $limit ? "LIMIT $limit OFFSET $offset" : '';

        $sql = "SELECT * FROM {$this->table} $where_clause ORDER BY created_at DESC $limit_clause";

        if (!empty($where_values)) {
            $sql = $this->db->prepare($sql, ...$where_values);
        }

        return $this->db->get_results($sql);
    }

    /**
     * Delete document by ID
     * 
     * @param string $id Document ID
     * @return int|false Number of rows deleted or false on failure
     */
    public function delete($id)
    {
        return $this->db->delete(
            $this->table,
            ['id' => $id],
            ['%s']
        );
    }

    /**
     * Get document count with optional filters
     * 
     * @param array $filters Optional filters
     * @return int Document count
     */
    public function getDocumentCount($filters = [])
    {
        // Use BaseModel query builder to count with filters
        $query = new static();
        if (!empty($filters['status'])) {
            $query = $query->where('status', $filters['status']);
        }
        if (!empty($filters['category_id'])) {
            $query = $query->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['created_by'])) {
            $query = $query->where('created_by', (int)$filters['created_by']);
        }
        if (!empty($filters['department_id'])) {
            $query = $query->where('department_id', $filters['department_id']);
        }
        return (int)$query->count();
    }
}
