<?php

namespace App\Employee\Contracts;

interface EducationInterface {
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function find($id);
    public function getEmployeeEducation($employeeId);
    public function getByDegree($employeeId, $degree);
    public function getEmployeesByField($field);
    public function getHighestEducation($employeeId);
    public function getStats();
}
