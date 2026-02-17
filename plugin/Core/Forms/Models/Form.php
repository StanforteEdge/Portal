<?php

namespace App\Core\Forms\Models;

use App\Utils\BaseModel;

/**
 * Form Model
 * 
 * Represents a reusable form template (e.g., IT Audit, Leave Request Form)
 */
class Form extends BaseModel
{
    protected $table = 'sta_forms';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'name',
        'description',
        'module',
        'storage_type', // 'default', 'custom'
        'target_table', // Name of custom table
        'column_mapping', // JSON mapping of form fields to table columns
        'is_recurring',
        'recurrence_pattern',
        'workflow_enabled',
        'workflow_statuses',
        'created_by_profile_id',
        'is_active',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'is_recurring' => 'boolean',
        'workflow_enabled' => 'boolean',
        'is_active' => 'boolean',
        'recurrence_pattern' => 'array',
        'workflow_statuses' => 'array',
        'column_mapping' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get form fields
     * 
     * @return array Array of FormField objects
     */
    public function getFields()
    {
        $formField = new FormField();
        return $formField->where('form_id', $this->id)
            ->orderBy('display_order', 'ASC')
            ->get();
    }

    /**
     * Get form submissions
     * 
     * @return array Array of FormSubmission objects
     */
    public function getSubmissions()
    {
        $submission = new FormSubmission();
        return $submission->where('form_id', $this->id)
            ->orderBy('submitted_at', 'DESC')
            ->get();
    }

    /**
     * Get form assignments
     * 
     * @return array Array of FormAssignment objects
     */
    public function getAssignments()
    {
        $assignment = new FormAssignment();
        return $assignment->where('form_id', $this->id)->get();
    }

    /**
     * Check if form is workflow-enabled (tickets, etc.)
     * 
     * @return bool
     */
    public function isWorkflowEnabled()
    {
        return $this->workflow_enabled === true || $this->workflow_enabled === 1;
    }

    /**
     * Get active forms
     * 
     * @return array
     */
    public static function getActive()
    {
        $instance = new static();
        return $instance->where('is_active', true)->get();
    }

    /**
     * Get forms by module
     * 
     * @param string $module Module name (finance, hr, admin, general)
     * @return array
     */
    public static function getByModule($module)
    {
        $instance = new static();
        return $instance->where('module', $module)
            ->where('is_active', true)
            ->get();
    }

    /**
     * Get recurring forms
     * 
     * @return array
     */
    public static function getRecurring()
    {
        $instance = new static();
        return $instance->where('is_recurring', true)
            ->where('is_active', true)
            ->get();
    }
    /**
     * Get count of published forms
     * 
     * @return int
     */
    public static function getPublishedCount()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_forms';
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE is_active = 1");
    }
}
