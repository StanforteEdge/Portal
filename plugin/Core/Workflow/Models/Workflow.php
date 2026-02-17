<?php

namespace App\Core\Workflow\Models;

use App\Utils\BaseModel;
use App\Core\Workflow\Models\WorkflowStep;
use App\Core\Workflow\Models\WorkflowInstance;

/**
 * Class Workflow
 * 
 * Represents a workflow definition in the system.
 */
class Workflow extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_workflows';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'name',
        'description',
        'entity_type',
        'is_active',
        'config',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the steps for the workflow.
     *
     * @return array Array of WorkflowStep objects
     */
    public function getSteps()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->where('workflow_id', $this->id)->orderBy('order', 'asc')->get();
    }

    /**
     * Get the initial step of the workflow.
     *
     * @return object|null WorkflowStep object or null
     */
    public function getInitialStep()
    {
        $stepModel = new WorkflowStep();
        return $stepModel->where('workflow_id', $this->id)
                        ->where('is_initial', true)
                        ->first();
    }

    /**
     * Get all workflow instances for this workflow.
     *
     * @return array Array of WorkflowInstance objects
     */
    public function getInstances()
    {
        $instanceModel = new WorkflowInstance();
        return $instanceModel->where('workflow_id', $this->id)->get();
    }

    /**
     * Get active workflows.
     *
     * @return array Array of active Workflow objects
     */
    public function getActive()
    {
        return $this->where('is_active', true)->get();
    }

    /**
     * Get workflows for a specific entity type.
     *
     * @param string $entityType
     * @return array Array of Workflow objects
     */
    public function getByEntityType($entityType)
    {
        return $this->where('entity_type', $entityType)->get();
    }

    /**
     * Check if the workflow has a specific step.
     *
     * @param int|string $stepId
     * @return bool
     */
    public function hasStep($stepId)
    {
        $stepModel = new WorkflowStep();
        $step = $stepModel->where('workflow_id', $this->id)
                         ->where('id', $stepId)
                         ->first();
        return $step !== null;
    }

    /**
     * Get a step by its name.
     *
     * @param string $name
     * @return object|null WorkflowStep object or null
     */
    public function getStepByName($name)
    {
        $stepModel = new WorkflowStep();
        return $stepModel->where('workflow_id', $this->id)
                        ->where('name', $name)
                        ->first();
    }

    /**
     * Get the next step in sequence.
     *
     * @param object $currentStep Current WorkflowStep object
     * @return object|null WorkflowStep object or null
     */
    public function getNextStep($currentStep)
    {
        $stepModel = new WorkflowStep();
        return $stepModel->where('workflow_id', $this->id)
                        ->where('order', '>', $currentStep->order)
                        ->orderBy('order', 'asc')
                        ->first();
    }

    /**
     * Get the previous step in sequence.
     *
     * @param object $currentStep Current WorkflowStep object
     * @return object|null WorkflowStep object or null
     */
    public function getPreviousStep($currentStep)
    {
        $stepModel = new WorkflowStep();
        return $stepModel->where('workflow_id', $this->id)
                        ->where('order', '<', $currentStep->order)
                        ->orderBy('order', 'desc')
                        ->first();
    }
}
