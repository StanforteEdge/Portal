<?php

namespace App\Core\Forms\Models;

use App\Utils\BaseModel;

/**
 * FormSubmissionHistory Model
 * 
 * Tracks all actions on form submissions (for workflow forms)
 */
class FormSubmissionHistory extends BaseModel
{
    protected $table = 'sta_form_submission_history';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'submission_id',
        'action_type',
        'performed_by_profile_id',
        'old_value',
        'new_value',
        'notes',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime'
    ];

    /**
     * Get the submission this history belongs to
     * 
     * @return object|null
     */
    public function getSubmission()
    {
        $submission = new FormSubmission();
        return $submission->find($this->submission_id);
    }

    /**
     * Get history by submission
     * 
     * @param string $submissionId
     * @return array
     */
    public static function getBySubmission($submissionId)
    {
        $instance = new static();
        return $instance->where('submission_id', $submissionId)
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Get history by action type
     * 
     * @param string $submissionId
     * @param string $actionType
     * @return array
     */
    public static function getByAction($submissionId, $actionType)
    {
        $instance = new static();
        return $instance->where('submission_id', $submissionId)
            ->where('action_type', $actionType)
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Log an action
     * 
     * @param string $submissionId
     * @param string $actionType
     * @param int $performedBy
     * @param array $data
     * @return mixed
     */
    public static function logAction($submissionId, $actionType, $performedBy, $data = [])
    {
        $instance = new static();
        return $instance->insert([
            'id' => wp_generate_uuid4(),
            'submission_id' => $submissionId,
            'action_type' => $actionType,
            'performed_by_profile_id' => $performedBy,
            'old_value' => $data['old_value'] ?? null,
            'new_value' => $data['new_value'] ?? null,
            'notes' => $data['notes'] ?? null
        ]);
    }
}
