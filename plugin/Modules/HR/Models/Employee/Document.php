<?php

namespace App\Modules\HR\Models\Employee;

use App\Utils\BaseModel;

class Document extends BaseModel
{
    protected $table = 'staff_documents';

    protected $fillable = [
        'employee_id',
        'category_id',
        'title',
        'file_path',
        'mime_type',
        'size',
        'status',
        'expiry_date'
    ];

    /**
     * Get document upload directory
     */
    public static function getUploadDir()
    {
        $upload_dir = wp_upload_dir();
        $base_dir = $upload_dir['basedir'] . '/stanfort/employee/documents';

        if (!file_exists($base_dir)) {
            wp_mkdir_p($base_dir);
        }

        return $base_dir;
    }

    /**
     * Handle file upload
     */
    public function upload($file, $employee_id, $data = [])
    {
        // Validate file
        $allowed_types = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
        $file_type = wp_check_filetype($file['name']);

        if (!in_array(strtolower($file_type['ext']), $allowed_types)) {
            return new \WP_Error('invalid_file_type', 'Invalid file type. Allowed types: ' . implode(', ', $allowed_types));
        }

        // Generate unique filename
        $filename = uniqid() . '-' . sanitize_file_name($file['name']);
        $upload_dir = self::getUploadDir();
        $file_path = $upload_dir . '/' . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $file_path)) {
            return new \WP_Error('upload_failed', 'Failed to upload file');
        }

        // Create document record
        $document_data = array_merge($data, [
            'employee_id' => $employee_id,
            'file_path' => str_replace(wp_upload_dir()['basedir'], '', $file_path),
            'mime_type' => $file_type['type'],
            'size' => $file['size'],
            'status' => 'active'
        ]);

        return $this->create($document_data);
    }

    /**
     * Get document URL
     */
    public function getUrl($document_id)
    {
        $document = $this->find($document_id);
        if (!$document) {
            return false;
        }

        $upload_dir = wp_upload_dir();
        return $upload_dir['baseurl'] . $document->file_path;
    }

    /**
     * Get employee documents
     */
    public function getEmployeeDocuments($employee_id)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT d.*, c.name as category_name
            FROM {$this->table} d
            LEFT JOIN {$this->wpdb->prefix}document_categories c ON d.category_id = c.id
            WHERE d.employee_id = %d
            ORDER BY d.created_at DESC
        ", $employee_id));
    }

    /**
     * Get employee documents by category
     */
    public function getByCategory($employee_id, $category_id)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT d.*, c.name as category_name
            FROM {$this->table} d
            LEFT JOIN {$this->wpdb->prefix}document_categories c ON d.category_id = c.id
            WHERE d.employee_id = %d
            AND d.category_id = %d
            ORDER BY d.created_at DESC
        ", $employee_id, $category_id));
    }

    /**
     * Get expired documents
     */
    public function getExpired($employee_id = null)
    {
        $query = "
            SELECT d.*, c.name as category_name,
                   e.first_name, e.last_name, e.employee_id as emp_id
            FROM {$this->table} d
            LEFT JOIN {$this->wpdb->prefix}document_categories c ON d.category_id = c.id
            LEFT JOIN {$this->wpdb->prefix}staff_profiles e ON d.employee_id = e.id
            WHERE d.expiry_date < CURDATE()
        ";

        if ($employee_id) {
            $query .= $this->wpdb->prepare(" AND d.employee_id = %d", $employee_id);
        }

        $query .= " ORDER BY d.expiry_date ASC";

        return $this->wpdb->get_results($query);
    }

    /**
     * Check if employee has required documents
     */
    public function hasRequiredDocuments($employee_id)
    {
        $required_categories = $this->wpdb->get_col("
            SELECT id FROM {$this->wpdb->prefix}document_categories 
            WHERE is_required = 1
        ");

        if (empty($required_categories)) {
            return true;
        }

        foreach ($required_categories as $category_id) {
            $has_document = $this->wpdb->get_var($this->wpdb->prepare("
                SELECT COUNT(*) 
                FROM {$this->table}
                WHERE employee_id = %d
                AND category_id = %d
                AND (expiry_date IS NULL OR expiry_date > CURDATE())
                AND status = 'active'
            ", $employee_id, $category_id));

            if (!$has_document) {
                return false;
            }
        }

        return true;
    }

    /**
     * Delete document and its file
     */
    public function deleteWithFile($document_id)
    {
        $document = $this->find($document_id);
        if (!$document) {
            return false;
        }

        // Delete physical file
        $file_path = wp_upload_dir()['basedir'] . $document->file_path;
        if (file_exists($file_path)) {
            unlink($file_path);
        }

        // Delete record
        return $this->delete($document_id);
    }
}
