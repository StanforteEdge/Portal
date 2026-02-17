<?php

namespace App\Utils\Services;

abstract class BaseService {
    protected $model;

    /**
     * Get all records
     */
    public function all() {
        return $this->model->all();
    }

    /**
     * Find a record by ID
     */
    public function find($id) {
        return $this->model->find($id);
    }

    /**
     * Create a new record
     */
    public function create($data) {
        return $this->model->create($data);
    }

    /**
     * Update a record
     */
    public function update($id, $data) {
        return $this->model->update($id, $data);
    }

    /**
     * Delete a record
     */
    public function delete($id) {
        return $this->model->delete($id);
    }

    /**
     * Handle validation
     */
    protected function validate($data, $rules) {
        // Will implement validation logic
        return true;
    }

    /**
     * Handle business logic errors
     */
    protected function error($message) {
        throw new \Exception($message);
    }
}
