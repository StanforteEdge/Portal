# Workflow API Reference

## Base URL
All API endpoints are prefixed with `/api/v1/workflow/`

## Authentication
All endpoints require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Workflow Management

#### List Workflows
```http
GET /workflows
```

**Query Parameters:**
- `entity_type` - Filter by entity type
- `is_active` - Filter by active status
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Document Approval",
      "description": "Standard document approval workflow",
      "entity_type": "document",
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 1,
    "per_page": 20
  }
}
```

#### Get Workflow
```http
GET /workflows/{id}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Document Approval",
    "description": "Standard document approval workflow",
    "entity_type": "document",
    "is_active": true,
    "steps": [
      {
        "id": 1,
        "name": "Draft",
        "step_type": "start",
        "order_num": 1,
        "is_initial_step": true,
        "is_final_step": false,
        "config": {}
      },
      {
        "id": 2,
        "name": "Review",
        "step_type": "approval",
        "order_num": 2,
        "is_initial_step": false,
        "is_final_step": false,
        "config": {
          "require_all_approvers": true
        },
        "approvers": [
          {
            "id": 1,
            "approver_type": "role",
            "approver_id": 2,
            "is_required": true
          }
        ]
      }
    ],
    "transitions": [
      {
        "id": 1,
        "from_step_id": 1,
        "to_step_id": 2,
        "name": "Submit for Review",
        "conditions": [],
        "actions": []
      }
    ]
  }
}
```

### Workflow Instances

#### Start Workflow
```http
POST /workflows/{workflow_id}/instances
```

**Request Body:**
```json
{
  "entity_type": "document",
  "entity_id": 123,
  "context": {
    "initiated_by": 1,
    "comment": "Starting document review"
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "workflow_id": 1,
    "entity_type": "document",
    "entity_id": 123,
    "current_step_id": 2,
    "status": "in_progress",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

#### Transition Workflow
```http
POST /workflow-instances/{instance_id}/transition
```

**Request Body:**
```json
{
  "transition_id": 1,
  "comment": "Approving the document",
  "context": {
    "approved_by": 2,
    "approved_at": "2023-01-02T00:00:00Z"
  }
}
```

### Integration with Request System

The Request System uses these endpoints internally. Here's the mapping:

| Request System Concept | Workflow API |
|------------------------|--------------|
| Request Type | Workflow Definition |
| Approval Flow | Workflow Steps & Transitions |
| Request Status | Workflow Instance State |
| Approvers | Workflow Step Approvers |
| Request Comments | Workflow History Entries |

Example of how the Request System might start a workflow:

```php
// In RequestService.php
public function createRequest(array $data) {
    // ... validation and setup ...
    
    // Start workflow
    $workflowResponse = $workflowService->startWorkflow(
        workflowId: $requestType->workflow_id,
        entityType: 'request',
        entityId: $request->id,
        context: [
            'initiated_by' => $user->id,
            'amount' => $data['amount'] ?? null
        ]
    );
    
    // Update request with workflow instance ID
    $request->workflow_instance_id = $workflowResponse['data']['id'];
    $request->save();
    
    return $request;
}
```

## Webhooks

You can subscribe to workflow events via webhooks. Configure webhook endpoints in the admin interface.

**Example Payload:**
```json
{
  "event": "workflow.step.changed",
  "data": {
    "workflow_instance_id": 1,
    "from_step": {"id": 1, "name": "Draft"},
    "to_step": {"id": 2, "name": "Review"},
    "entity": {
      "type": "document",
      "id": 123
    },
    "performed_by": 1,
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```
