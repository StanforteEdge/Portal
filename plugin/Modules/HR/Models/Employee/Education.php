<?php

namespace App\Modules\HR\Models\Employee;

use App\Utils\BaseModel;

class Education extends BaseModel
{
    protected $table = 'staff_education';

    protected $fillable = [
        'employee_id',
        'institution',
        'degree',
        'field_of_study',
        'start_date',
        'end_date',
        'grade',
        'activities',
        'description',
        'is_verified',
        'document_id'  // Reference to uploaded certificate/degree
    ];

    /**
     * Get employee education records
     */
    public function getEmployeeEducation($employeeId)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT e.*, d.title as document_title
            FROM {$this->table} e
            LEFT JOIN {$this->wpdb->prefix}staff_documents d ON e.document_id = d.id
            WHERE e.employee_id = %d
            ORDER BY e.end_date DESC, e.start_date DESC
        ", $employeeId));
    }

    /**
     * Get education by degree type
     */
    public function getByDegree($employeeId, $degree)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT e.*, d.title as document_title
            FROM {$this->table} e
            LEFT JOIN {$this->wpdb->prefix}staff_documents d ON e.document_id = d.id
            WHERE e.employee_id = %d AND e.degree = %s
            ORDER BY e.end_date DESC
        ", $employeeId, $degree));
    }

    /**
     * Get employees by field of study
     */
    public function getEmployeesByField($field)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT e.*, p.first_name, p.last_name, p.employee_id as emp_id
            FROM {$this->table} e
            JOIN {$this->wpdb->prefix}staff_profiles p ON e.employee_id = p.id
            WHERE e.field_of_study LIKE %s
            ORDER BY e.end_date DESC, p.first_name, p.last_name
        ", '%' . $this->wpdb->esc_like($field) . '%'));
    }

    /**
     * Get highest education level for employee
     */
    public function getHighestEducation($employeeId)
    {
        // Order of education levels from highest to lowest
        $educationLevels = [
            'Ph.D.',
            'Master',
            'Bachelor',
            'Associate',
            'Diploma',
            'Certificate'
        ];

        $degrees = $this->wpdb->get_col($this->wpdb->prepare("
            SELECT DISTINCT degree
            FROM {$this->table}
            WHERE employee_id = %d
        ", $employeeId));

        if (empty($degrees)) {
            return null;
        }

        foreach ($educationLevels as $level) {
            foreach ($degrees as $degree) {
                if (stripos($degree, $level) !== false) {
                    return $this->wpdb->get_row($this->wpdb->prepare("
                        SELECT e.*, d.title as document_title
                        FROM {$this->table} e
                        LEFT JOIN {$this->wpdb->prefix}staff_documents d ON e.document_id = d.id
                        WHERE e.employee_id = %d AND e.degree LIKE %s
                        ORDER BY e.end_date DESC
                        LIMIT 1
                    ", $employeeId, '%' . $level . '%'));
                }
            }
        }

        // If no match found, return the most recent education
        return $this->wpdb->get_row($this->wpdb->prepare("
            SELECT e.*, d.title as document_title
            FROM {$this->table} e
            LEFT JOIN {$this->wpdb->prefix}staff_documents d ON e.document_id = d.id
            WHERE e.employee_id = %d
            ORDER BY e.end_date DESC
            LIMIT 1
        ", $employeeId));
    }

    /**
     * Get education statistics
     */
    public function getStats()
    {
        return [
            'degree_distribution' => $this->wpdb->get_results("
                SELECT degree, COUNT(*) as count
                FROM {$this->table}
                GROUP BY degree
                ORDER BY count DESC
            "),
            'field_distribution' => $this->wpdb->get_results("
                SELECT field_of_study, COUNT(*) as count
                FROM {$this->table}
                GROUP BY field_of_study
                ORDER BY count DESC
                LIMIT 10
            "),
            'institution_distribution' => $this->wpdb->get_results("
                SELECT institution, COUNT(*) as count
                FROM {$this->table}
                GROUP BY institution
                ORDER BY count DESC
                LIMIT 10
            ")
        ];
    }
}
