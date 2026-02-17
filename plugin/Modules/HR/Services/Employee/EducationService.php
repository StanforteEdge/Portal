<?php

namespace App\Modules\HR\Services\Employee;

use App\Core\Services\BaseService;
use App\Modules\HR\Models\Employee\Education;
use App\Modules\HR\Services\Employee\DocumentService;

class EducationService extends BaseService implements EducationInterface
{
    public function __construct()
    {
        $this->model = new Education();
    }

    /**
     * Create new education record
     */
    public function create(array $data)
    {
        // Validate required fields
        $required = ['employee_id', 'institution', 'degree', 'field_of_study', 'start_date'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \Exception("$field is required");
            }
        }

        // Validate dates
        if (!strtotime($data['start_date'])) {
            throw new \Exception("Invalid start date");
        }

        if (!empty($data['end_date'])) {
            if (!strtotime($data['end_date'])) {
                throw new \Exception("Invalid end date");
            }

            if (strtotime($data['end_date']) < strtotime($data['start_date'])) {
                throw new \Exception("End date cannot be before start date");
            }
        }

        // Validate document if provided
        if (!empty($data['document_id'])) {
            $document = (new DocumentService())->find($data['document_id']);
            if (!$document || $document->employee_id != $data['employee_id']) {
                throw new \Exception("Invalid document");
            }
        }

        return $this->model->create($data);
    }

    /**
     * Update education record
     */
    public function update($id, array $data)
    {
        $education = $this->find($id);
        if (!$education) {
            throw new \Exception("Education record not found");
        }

        // Validate dates if provided
        if (!empty($data['start_date'])) {
            if (!strtotime($data['start_date'])) {
                throw new \Exception("Invalid start date");
            }
        }

        if (!empty($data['end_date'])) {
            if (!strtotime($data['end_date'])) {
                throw new \Exception("Invalid end date");
            }

            $startDate = !empty($data['start_date']) ? $data['start_date'] : $education->start_date;
            if (strtotime($data['end_date']) < strtotime($startDate)) {
                throw new \Exception("End date cannot be before start date");
            }
        }

        // Validate document if provided
        if (!empty($data['document_id'])) {
            $document = (new DocumentService())->find($data['document_id']);
            if (!$document || $document->employee_id != $education->employee_id) {
                throw new \Exception("Invalid document");
            }
        }

        return $this->model->update($id, $data);
    }

    /**
     * Delete education record
     */
    public function delete($id)
    {
        $education = $this->find($id);
        if (!$education) {
            throw new \Exception("Education record not found");
        }

        return $this->model->delete($id);
    }

    /**
     * Find education record by ID
     */
    public function find($id)
    {
        return $this->model->find($id);
    }

    /**
     * Get employee education records
     */
    public function getEmployeeEducation($employeeId)
    {
        return $this->model->getEmployeeEducation($employeeId);
    }

    /**
     * Get education by degree type
     */
    public function getByDegree($employeeId, $degree)
    {
        if (empty($degree)) {
            throw new \Exception("Degree type is required");
        }

        return $this->model->getByDegree($employeeId, $degree);
    }

    /**
     * Get employees by field of study
     */
    public function getEmployeesByField($field)
    {
        if (empty($field)) {
            throw new \Exception("Field of study is required");
        }

        return $this->model->getEmployeesByField($field);
    }

    /**
     * Get highest education level for employee
     */
    public function getHighestEducation($employeeId)
    {
        return $this->model->getHighestEducation($employeeId);
    }

    /**
     * Get education statistics
     */
    public function getStats()
    {
        return $this->model->getStats();
    }

    /**
     * Attach document to education record
     */
    public function attachDocument($educationId, $documentId)
    {
        $education = $this->find($educationId);
        if (!$education) {
            throw new \Exception("Education record not found");
        }

        $document = (new DocumentService())->find($documentId);
        if (!$document || $document->employee_id != $education->employee_id) {
            throw new \Exception("Invalid document");
        }

        return $this->model->update($educationId, ['document_id' => $documentId]);
    }
}
