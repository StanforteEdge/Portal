<?php

namespace App\Core\Forms\Models;

use App\Utils\BaseModel;

/**
 * FormField Model
 * 
 * Represents individual fields within a form
 */
class FormField extends BaseModel
{
    protected $table = 'sta_form_fields';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'form_id',
        'field_key',
        'field_label',
        'field_type',
        'field_options',
        'is_required',
        'validation_rules',
        'display_order',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'field_options' => 'array',
        'validation_rules' => 'array',
        'display_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the form this field belongs to
     * 
     * @return object|null Form object
     */
    public function getForm()
    {
        $form = new Form();
        return $form->find($this->form_id);
    }

    /**
     * Get fields by form ID
     * 
     * @param string $formId
     * @return array
     */
    public static function getByForm($formId)
    {
        $instance = new static();
        return $instance->where('form_id', $formId)
            ->orderBy('display_order', 'ASC')
            ->get();
    }

    /**
     * Find field by key within a form
     * 
     * @param string $formId
     * @param string $fieldKey
     * @return object|null
     */
    public static function findByKey($formId, $fieldKey)
    {
        $instance = new static();
        return $instance->where('form_id', $formId)
            ->where('field_key', $fieldKey)
            ->first();
    }
}
