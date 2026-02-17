<?php

namespace App\Modules\HR\Services\Employee;

use App\Core\Services\BaseService;
use App\Modules\HR\Models\Employee\Skill;
use App\Modules\HR\Services\Employee\EmployeeService;

class SkillService extends BaseService implements SkillInterface
{
    public function __construct()
    {
        $this->model = new Skill();
    }

    /**
     * Create new skill
     */
    public function create(array $data)
    {
        // Validate required fields
        $required = ['employee_id', 'name', 'category'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \Exception("$field is required");
            }
        }

        // Validate category
        $validCategories = ['technical', 'soft_skill', 'language', 'certification'];
        if (!in_array($data['category'], $validCategories)) {
            throw new \Exception("Invalid category. Must be one of: " . implode(', ', $validCategories));
        }

        // Validate proficiency level if provided
        if (!empty($data['proficiency_level'])) {
            $validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
            if (!in_array($data['proficiency_level'], $validLevels)) {
                throw new \Exception("Invalid proficiency level. Must be one of: " . implode(', ', $validLevels));
            }
        }

        // Check if skill already exists for this employee
        $existing = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->model->getTable()} 
             WHERE employee_id = %d AND name = %s",
            $data['employee_id'],
            $data['name']
        ));

        if ($existing) {
            throw new \Exception("This skill is already added for this employee");
        }

        return $this->model->create($data);
    }

    /**
     * Update skill
     */
    public function update($id, array $data)
    {
        $skill = $this->find($id);
        if (!$skill) {
            throw new \Exception("Skill not found");
        }

        // Validate category if provided
        if (!empty($data['category'])) {
            $validCategories = ['technical', 'soft_skill', 'language', 'certification'];
            if (!in_array($data['category'], $validCategories)) {
                throw new \Exception("Invalid category. Must be one of: " . implode(', ', $validCategories));
            }
        }

        // Validate proficiency level if provided
        if (!empty($data['proficiency_level'])) {
            $validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
            if (!in_array($data['proficiency_level'], $validLevels)) {
                throw new \Exception("Invalid proficiency level. Must be one of: " . implode(', ', $validLevels));
            }
        }

        return $this->model->update($id, $data);
    }

    /**
     * Delete skill
     */
    public function delete($id)
    {
        $skill = $this->find($id);
        if (!$skill) {
            throw new \Exception("Skill not found");
        }

        return $this->model->delete($id);
    }

    /**
     * Find skill by ID
     */
    public function find($id)
    {
        return $this->model->find($id);
    }

    /**
     * Get employee skills
     */
    public function getEmployeeSkills($employeeId)
    {
        return $this->model->getEmployeeSkills($employeeId);
    }

    /**
     * Get skills by category
     */
    public function getByCategory($employeeId, $category)
    {
        // Validate category
        $validCategories = ['technical', 'soft_skill', 'language', 'certification'];
        if (!in_array($category, $validCategories)) {
            throw new \Exception("Invalid category. Must be one of: " . implode(', ', $validCategories));
        }

        return $this->model->getByCategory($employeeId, $category);
    }

    /**
     * Get employees by skill
     */
    public function getEmployeesBySkill($skillName)
    {
        if (empty($skillName)) {
            throw new \Exception("Skill name is required");
        }

        return $this->model->getEmployeesBySkill($skillName);
    }

    /**
     * Verify skill
     */
    public function verifySkill($skillId, $verifierId)
    {
        $skill = $this->find($skillId);
        if (!$skill) {
            throw new \Exception("Skill not found");
        }

        // Check if verifier exists and has permission
        $verifier = (new EmployeeService())->find($verifierId);
        if (!$verifier) {
            throw new \Exception("Verifier not found");
        }

        // Prevent self-verification
        if ($skill->employee_id == $verifierId) {
            throw new \Exception("Cannot verify own skill");
        }

        return $this->model->verifySkill($skillId, $verifierId);
    }

    /**
     * Get skill statistics
     */
    public function getStats()
    {
        return $this->model->getStats();
    }
}
