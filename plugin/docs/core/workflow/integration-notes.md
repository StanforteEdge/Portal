# Workflow Integration Notes

## Integration with Request System

The Workflow System is tightly integrated with the Request System to handle approval flows. Here's how they work together:

### Key Integration Points

1. **Request Types**
   - Each request type can have an associated workflow
   - The workflow defines the approval process for that request type

2. **Status Management**
   - Workflow step transitions automatically update request status
   - Request status is synchronized with the current workflow step

3. **Approval Handling**
   - Request approvals are processed through the workflow engine
   - Approvers are determined by the workflow definition

## API Integration

### Starting a Workflow

```php
// Example: Starting a workflow for a request
$workflowService = new WorkflowService();
$instance = $workflowService->startWorkflow(
    'request_approval',  // Workflow name
    'request',           // Entity type
    $requestId,          // Entity ID
    $initiatorId         // User who initiated the workflow
);
```

### Handling Workflow Actions

```php
// Example: Approving a workflow step
$result = $workflowService->processTransition(
    $workflowInstanceId,
    'approve',           // Action
    $currentUserId,      // User performing the action
    [                    // Additional data
        'comment' => 'Looks good',
        'metadata' => ['ip' => $_SERVER['REMOTE_ADDR']]
    ]
);
```

## Event System

The workflow system triggers events that other systems can listen for:

```php
// Example: Listening for workflow events
add_action('workflow_transition', function($transitionData) {
    // $transitionData contains:
    // - instance_id
    // - from_step
    // - to_step
    // - action
    // - performed_by
    // - metadata
});

add_action('workflow_completed', function($instanceId) {
    // Handle workflow completion
});
```

## Custom Step Handlers

You can create custom step handlers by implementing the `WorkflowStepHandler` interface:

```php
class CustomApprovalHandler implements WorkflowStepHandler 
{
    public function handle(WorkflowInstance $instance, array $data = [])
    {
        // Custom logic for this step
        return [
            'success' => true,
            'next_step' => 'next_step_name'
        ];
    }
}

// Register the handler
WorkflowStepHandlerRegistry::register('custom_approval', new CustomApprovalHandler());
```

## Performance Considerations

1. **Caching**
   - Workflow definitions are cached for performance
   - Use the `workflow_definition_updated` hook to clear cache when needed

2. **Batch Processing**
   - For bulk operations, use the batch processing methods
   - Example: `$workflowService->processBatch($batchData)`

## Security

- All workflow actions are subject to permission checks
- Use the `workflow_can_transition` filter to implement custom access control
- Audit all workflow transitions using the `workflow_history` table

## Troubleshooting

### Common Issues

1. **Workflow Stuck**
   - Check the `workflow_history` table for the last action
   - Verify that all required approvers have taken action

2. **Missing Approvers**
   - Ensure the workflow definition includes valid approvers
   - Check that approvers have the required permissions

3. **Transition Errors**
   - Verify that all required fields are provided
   - Check the workflow definition for validation rules
