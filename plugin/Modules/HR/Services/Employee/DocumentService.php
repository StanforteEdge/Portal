<?php

namespace App\Modules\HR\Services\Employee;

use App\Core\Services\BaseService;
use App\Modules\HR\Models\Employee\Document;
use App\Modules\HR\Services\Employee\EmployeeService;

class DocumentService extends BaseService implements DocumentInterface
{
    public function __construct()
    {
        $this->model = new Document();
    }

    /**
     * Upload new document
     */
    public function upload($file, $employeeId, array $data = [])
    {
        // Validate employee exists
        $employee = (new EmployeeService())->find($employeeId);
        if (!$employee) {
            throw new \Exception("Employee not found");
        }

        // Validate file
        if (!isset($file['tmp_name']) || !file_exists($file['tmp_name'])) {
            throw new \Exception("No file uploaded");
        }

        // Validate required fields
        if (empty($data['title'])) {
            throw new \Exception("Document title is required");
        }

        if (empty($data['category_id'])) {
            throw new \Exception("Document category is required");
        }

        return $this->model->upload($file, $employeeId, $data);
    }

    /**
     * Update document details
     */
    public function update($id, array $data)
    {
        $document = $this->find($id);
        if (!$document) {
            throw new \Exception("Document not found");
        }

        return $this->model->update($id, $data);
    }

    /**
     * Delete document
     */
    public function delete($id)
    {
        $document = $this->find($id);
        if (!$document) {
            throw new \Exception("Document not found");
        }

        return $this->model->deleteWithFile($id);
    }

    /**
     * Find document by ID
     */
    public function find($id)
    {
        return $this->model->find($id);
    }

    /**
     * Get document URL
     */
    public function getUrl($id)
    {
        return $this->model->getUrl($id);
    }

    /**
     * Get all documents for an employee
     */
    public function getEmployeeDocuments($employeeId)
    {
        return $this->model->getEmployeeDocuments($employeeId);
    }

    /**
     * Get employee documents by category
     */
    public function getByCategory($employeeId, $categoryId)
    {
        return $this->model->getByCategory($employeeId, $categoryId);
    }

    /**
     * Get expired documents
     */
    public function getExpired($employeeId = null)
    {
        return $this->model->getExpired($employeeId);
    }

    /**
     * Check if employee has all required documents
     */
    public function hasRequiredDocuments($employeeId)
    {
        return $this->model->hasRequiredDocuments($employeeId);
    }

    /**
     * Get list of missing required documents
     */
    public function getMissingRequiredDocuments($employeeId)
    {
        return $this->model->getMissingRequiredDocuments($employeeId);
    }

    /**
     * Get document statistics
     */
    public function getStats($employeeId = null)
    {
        global $wpdb;
        $table = $this->model->getTable();

        $where = "";
        $params = [];

        if ($employeeId) {
            $where = "WHERE d.employee_id = %d";
            $params[] = $employeeId;
        }

        $query = $wpdb->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN d.status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN d.expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN d.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon
            FROM $table d
            $where
        ", $params);

        $stats = $wpdb->get_row($query);

        // Get counts by category
        $query = $wpdb->prepare("
            SELECT 
                c.name as category,
                COUNT(*) as count
            FROM $table d
            JOIN {$wpdb->prefix}document_categories c ON d.category_id = c.id
            $where
            GROUP BY c.id
        ", $params);

        $stats->by_category = $wpdb->get_results($query);

        return $stats;
    }
}
