<?php

namespace App\Core\Forms\Models;

use App\Utils\BaseModel;

/**
 * FormSubmission Model
 * 
 * Represents a completed form submission
 */
class FormSubmission extends BaseModel
{
    protected $table = 'sta_form_submissions';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'form_id',
        'submission_number',
        'submitted_by_profile_id',
        'organization_id',
        'status',
        'assigned_to_profile_id',
        'resolved_at',
        'resolution_notes',
        'submitted_at',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'submitted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the form this submission belongs to
     * 
     * @return object|null
     */
    public function getForm()
    {
        $form = new Form();
        return $form->find($this->form_id);
    }

    /**
     * Get submission data (EAV)
     * 
     * @return array Array of FormSubmissionData objects
     */
    public function getData()
    {
        $data = new FormSubmissionData();
        return $data->where('submission_id', $this->id)->get();
    }

    /**
     * Get submission data as key-value array
     * 
     * @return array
     */
    public function getDataArray()
    {
        $data = $this->getData();
        $result = [];

        foreach ($data as $item) {
            // Determine which value column to use
            $value = null;
            if ($item->value_text !== null) {
                $value = $item->value_text;
            } elseif ($item->value_number !== null) {
                $value = $item->value_number;
            } elseif ($item->value_date !== null) {
                $value = $item->value_date;
            } elseif ($item->value_datetime !== null) {
                $value = $item->value_datetime;
            } elseif ($item->value_file_url !== null) {
                $value = $item->value_file_url;
            }

            $result[$item->field_key] = $value;
        }

        return $result;
    }

    /**
     * Get submission history
     * 
     * @return array
     */
    public function getHistory()
    {
        $history = new FormSubmissionHistory();
        return $history->where('submission_id', $this->id)
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Get submissions by form
     * 
     * @param string $formId
     * @return array
     */
    public static function getByForm($formId)
    {
        $instance = new static();
        return $instance->where('form_id', $formId)
            ->orderBy('submitted_at', 'DESC')
            ->get();
    }

    /**
     * Get submissions by user
     * 
     * @param int $profileId
     * @return array
     */
    public static function getByUser($profileId)
    {
        $instance = new static();
        return $instance->where('submitted_by_profile_id', $profileId)
            ->orderBy('submitted_at', 'DESC')
            ->get();
    }

    /**
     * Get submissions by status
     * 
     * @param string $status
     * @return array
     */
    public static function getByStatus($status)
    {
        $instance = new static();
        return $instance->where('status', $status)
            ->orderBy('submitted_at', 'DESC')
            ->get();
    }
    /**
     * Get submission count by user
     * 
     * @param int $userId WP User ID
     * @return int
     */
    public static function getCountByUser($userId)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_form_submissions';
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE submitted_by_profile_id = %d",
            $userId
        ));
    }
}
