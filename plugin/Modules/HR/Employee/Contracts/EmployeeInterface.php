<?php

namespace App\Employee\Contracts;

interface EmployeeInterface {
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function find($id);
    public function findWithDetails($id);
    public function getAll();
    public function getAllWithDetails();
    public function getByDepartment($departmentId);
    public function search($query);
}
