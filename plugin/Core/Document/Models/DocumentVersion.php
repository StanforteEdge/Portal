<?php
namespace App\Core\Document\Models;

use App\Utils\BaseModel;

class DocumentVersion extends BaseModel
{
    protected $table = 'sta_document_versions';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'document_id',
        'version',
        'content',
        'content_type',
        'external_url',
        'change_notes',
        'created_by',
        'created_at'
    ];
    
    protected $casts = [
        'created_at' => 'datetime'
    ];

    /**
     * Create a new document version
     * 
     * @param array $data Version data
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
     * Get version by ID
     * 
     * @param string $id Version ID
     * @return object|null Version object or null if not found
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
     * Get specific version of a document
     * 
     * @param string $document_id Document ID
     * @param string $version Version number
     * @return object|null Version object or null if not found
     */
    public function findByDocumentAndVersion($document_id, $version)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE document_id = %s AND version = %s",
                $document_id,
                $version
            )
        );
    }

    /**
     * Get all versions for a document
     * 
     * @param string $document_id Document ID
     * @return array Array of version objects ordered by creation date
     */
    public function getDocumentVersions($document_id)
    {
        return $this->db->get_results(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE document_id = %s ORDER BY created_at DESC",
                $document_id
            )
        );
    }

    /**
     * Get latest version for a document
     * 
     * @param string $document_id Document ID
     * @return object|null Latest version object or null if not found
     */
    public function getLatestVersion($document_id)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE document_id = %s ORDER BY created_at DESC LIMIT 1",
                $document_id
            )
        );
    }

    /**
     * Check if version exists for document
     * 
     * @param string $document_id Document ID
     * @param string $version Version number
     * @return bool True if version exists, false otherwise
     */
    public function versionExists($document_id, $version)
    {
        $count = $this->db->get_var(
            $this->db->prepare(
                "SELECT COUNT(*) FROM {$this->table} WHERE document_id = %s AND version = %s",
                $document_id,
                $version
            )
        );

        return $count > 0;
    }

    /**
     * Delete version by ID
     * 
     * @param string $id Version ID
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
     * Delete all versions for a document
     * 
     * @param string $document_id Document ID
     * @return int|false Number of rows deleted or false on failure
     */
    public function deleteDocumentVersions($document_id)
    {
        return $this->db->delete(
            $this->table,
            ['document_id' => $document_id],
            ['%s']
        );
    }

    /**
     * Get version count for a document
     * 
     * @param string $document_id Document ID
     * @return int Version count
     */
    public function getVersionCount($document_id)
    {
        return (int) $this->db->get_var(
            $this->db->prepare(
                "SELECT COUNT(*) FROM {$this->table} WHERE document_id = %s",
                $document_id
            )
        );
    }
}
