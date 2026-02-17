<?php
namespace App\Core\Document\Models;

use App\Utils\BaseModel;

class DocumentTag extends BaseModel
{
    protected $table = 'sta_document_tags';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'name',
        'created_at'
    ];
    
    protected $casts = [
        'created_at' => 'datetime'
    ];

    /**
     * Create a new document tag
     * 
     * @param array $data Tag data
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
     * Update tag by ID
     * 
     * @param string $id Tag ID
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
     * Get tag by ID
     * 
     * @param string $id Tag ID
     * @return object|null Tag object or null if not found
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
     * Get tag by name
     * 
     * @param string $name Tag name
     * @return object|null Tag object or null if not found
     */
    public function findByName($name)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE name = %s",
                $name
            )
        );
    }

    /**
     * Get all tags
     * 
     * @param int $limit Optional limit
     * @param int $offset Optional offset
     * @return array Array of tag objects
     */
    public function getAllTags($limit = null, $offset = 0)
    {
        $limit_clause = $limit ? "LIMIT $limit OFFSET $offset" : '';
        $sql = "SELECT * FROM {$this->table} ORDER BY name ASC $limit_clause";
        
        return $this->db->get_results($sql);
    }

    /**
     * Search tags by name
     * 
     * @param string $query Search query
     * @param int $limit Optional limit
     * @return array Array of tag objects
     */
    public function searchTags($query, $limit = 10)
    {
        return $this->db->get_results(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE name LIKE %s ORDER BY name ASC LIMIT %d",
                '%' . $this->db->esc_like($query) . '%',
                $limit
            )
        );
    }

    /**
     * Check if tag name exists
     * 
     * @param string $name Tag name
     * @param string $exclude_id Optional tag ID to exclude from check
     * @return bool True if name exists, false otherwise
     */
    public function nameExists($name, $exclude_id = null)
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE name = %s";
        $params = [$name];

        if ($exclude_id) {
            $sql .= " AND id != %s";
            $params[] = $exclude_id;
        }

        $count = $this->db->get_var(
            $this->db->prepare($sql, ...$params)
        );

        return $count > 0;
    }

    /**
     * Delete tag by ID
     * 
     * @param string $id Tag ID
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
     * Get popular tags (most used in documents)
     * 
     * @param int $limit Number of tags to return
     * @return array Array of tag names with usage count
     */
    public function getPopularTags($limit = 10)
    {
        global $wpdb;
        
        $sql = "
            SELECT 
                tag_value.value as name,
                COUNT(*) as usage_count
            FROM {$wpdb->prefix}sta_documents d
            CROSS JOIN JSON_TABLE(d.tags, '$[*]' COLUMNS (value VARCHAR(255) PATH '$')) AS tag_value
            WHERE d.tags IS NOT NULL
            GROUP BY tag_value.value
            ORDER BY usage_count DESC, tag_value.value ASC
            LIMIT %d
        ";

        return $this->db->get_results(
            $this->db->prepare($sql, $limit)
        );
    }
}
