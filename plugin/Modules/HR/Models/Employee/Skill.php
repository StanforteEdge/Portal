<?php

namespace App\Modules\HR\Models\Employee;

use App\Utils\BaseModel;

class Skill extends BaseModel
{
    protected $table = 'staff_skills';

    protected $fillable = [
        'employee_id',
        'name',
        'category',  // technical, soft_skill, language, certification
        'proficiency_level', // beginner, intermediate, advanced, expert
        'years_of_experience',
        'description',
        'is_verified',
        'verified_by',
        'verified_at'
    ];

    /**
     * Get employee skills
     */
    public function getEmployeeSkills($employeeId)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT s.*, 
                   CASE WHEN s.is_verified = 1 
                        THEN CONCAT(v.first_name, ' ', v.last_name) 
                        ELSE NULL 
                   END as verifier_name
            FROM {$this->table} s
            LEFT JOIN {$this->wpdb->prefix}staff_profiles v ON s.verified_by = v.id
            WHERE s.employee_id = %d
            ORDER BY s.category, s.name
        ", $employeeId));
    }

    /**
     * Get skills by category
     */
    public function getByCategory($employeeId, $category)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT * FROM {$this->table}
            WHERE employee_id = %d AND category = %s
            ORDER BY name
        ", $employeeId, $category));
    }

    /**
     * Get employees by skill
     */
    public function getEmployeesBySkill($skillName)
    {
        return $this->wpdb->get_results($this->wpdb->prepare("
            SELECT s.*, e.first_name, e.last_name, e.employee_id as emp_id
            FROM {$this->table} s
            JOIN {$this->wpdb->prefix}staff_profiles e ON s.employee_id = e.id
            WHERE s.name LIKE %s
            ORDER BY s.proficiency_level DESC, e.first_name, e.last_name
        ", '%' . $this->wpdb->esc_like($skillName) . '%'));
    }

    /**
     * Verify skill
     */
    public function verifySkill($skillId, $verifierId)
    {
        return $this->update($skillId, [
            'is_verified' => 1,
            'verified_by' => $verifierId,
            'verified_at' => current_time('mysql')
        ]);
    }

    /**
     * Get skill statistics
     */
    public function getStats()
    {
        return [
            'total' => $this->wpdb->get_var("SELECT COUNT(DISTINCT name) FROM {$this->table}"),
            'by_category' => $this->wpdb->get_results("
                SELECT category, COUNT(DISTINCT name) as count
                FROM {$this->table}
                GROUP BY category
                ORDER BY count DESC
            "),
            'most_common' => $this->wpdb->get_results("
                SELECT name, COUNT(*) as count
                FROM {$this->table}
                GROUP BY name
                ORDER BY count DESC
                LIMIT 10
            ")
        ];
    }
}
