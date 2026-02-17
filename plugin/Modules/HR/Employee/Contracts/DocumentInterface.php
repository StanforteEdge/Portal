<?php

namespace App\Employee\Contracts;

interface DocumentInterface {
    public function upload($file, $employeeId, array $data = []);
    public function update($id, array $data);
    public function delete($id);
    public function find($id);
    public function getUrl($id);
    public function getEmployeeDocuments($employeeId);
    public function getByCategory($employeeId, $categoryId);
    public function getExpired($employeeId = null);
    public function hasRequiredDocuments($employeeId);
    public function getMissingRequiredDocuments($employeeId);
}
