<?php

namespace App\Core\Forms\Models;

use App\Utils\BaseModel;

/**
 * FormAssignment Model
 * 
 * Defines who should fill a form and who can view submissions
 */
class FormAssignment extends BaseModel
{
    protected $table = 'sta_form_assignments';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'form_id',
        'assigned_to_role',
        'assigned_to_profile_id',
        'assigned_to_department_id',
        'visibility_roles',
        'due_date',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'visibility_roles' => 'array',
        'due_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the form this assignment belongs to
     * 
     * @return object|null
     */
    public function getForm()
    {
        $form = new Form();
        return $form->find($this->form_id);
    }

    /**
     * Get assignments by form
     * 
     * @param string $formId
     * @return array
     */
    public static function getByForm($formId)
    {
        $instance = new static();
        return $instance->where('form_id', $formId)->get();
    }

    /**
     * Get forms assigned to a role
     * 
     * @param string $role
     * @return array
     */
    public static function getByRole($role)
    {
        $instance = new static();
        return $instance->where('assigned_to_role', $role)->get();
    }

    /**
     * Get forms assigned to a specific user
     * 
     * @param int $profileId
     * @return array
     */
    public static function getByProfile($profileId)
    {
        $instance = new static();
        return $instance->where('assigned_to_profile_id', $profileId)->get();
    }

    /**
     * Check if user can view submissions for this form
     * 
     * @param array $userRoles
     * @return bool
     */
    public function canView($userRoles)
    {
        if (!$this->visibility_roles) {
            return true; // No restriction
        }

        return !empty(array_intersect($userRoles, $this->visibility_roles));
    }
}
