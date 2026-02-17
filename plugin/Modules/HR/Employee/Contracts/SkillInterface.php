<?php

namespace App\Employee\Contracts;

interface SkillInterface {
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function find($id);
    public function getEmployeeSkills($employeeId);
    public function getByCategory($employeeId, $category);
    public function getEmployeesBySkill($skillName);
    public function verifySkill($skillId, $verifierId);
    public function getStats();
}
