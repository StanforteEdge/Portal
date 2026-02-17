<?php

namespace App\Core\Forms\Models;

use App\Utils\BaseModel;

/**
 * FormSubmissionData Model (EAV)
 * 
 * Stores actual form field values with type-specific columns for performance
 */
class FormSubmissionData extends BaseModel
{
    protected $table = 'sta_form_submission_data';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'submission_id',
        'field_id',
        'field_key',
        'value_text',
        'value_number',
        'value_date',
        'value_datetime',
        'value_file_url',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'value_number' => 'decimal:4',
        'value_date' => 'date',
        'value_datetime' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the submission this data belongs to
     * 
     * @return object|null
     */
    public function getSubmission()
    {
        $submission = new FormSubmission();
        return $submission->find($this->submission_id);
    }

    /**
     * Get the field definition
     * 
     * @return object|null
     */
    public function getField()
    {
        $field = new FormField();
        return $field->find($this->field_id);
    }

    /**
     * Get data by submission ID
     * 
     * @param string $submissionId
     * @return array
     */
    public static function getBySubmission($submissionId)
    {
        $instance = new static();
        return $instance->where('submission_id', $submissionId)->get();
    }

    /**
     * Get value based on type (convenience method)
     * 
     * @return mixed
     */
    public function getValue()
    {
        if ($this->value_text !== null)
            return $this->value_text;
        if ($this->value_number !== null)
            return $this->value_number;
        if ($this->value_datetime !== null)
            return $this->value_datetime;
        if ($this->value_date !== null)
            return $this->value_date;
        if ($this->value_file_url !== null)
            return $this->value_file_url;
        return null;
    }

    /**
     * Query by field key and value (for searches)
     * 
     * @param string $fieldKey
     * @param mixed $value
     * @param string $operator (=, >, <, >=, <=, LIKE)
     * @return array
     */
    public static function searchByField($fieldKey, $value, $operator = '=')
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_form_submission_data';

        // Determine column based on value type
        $column = null;
        if (is_numeric($value)) {
            $column = 'value_number';
        } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            $column = 'value_date';
        } else {
            $column = 'value_text';
        }

        $sql = $wpdb->prepare(
            "SELECT * FROM {$table} WHERE field_key = %s AND {$column} {$operator} %s",
            $fieldKey,
            $value
        );

        return $wpdb->get_results($sql);
    }
}
