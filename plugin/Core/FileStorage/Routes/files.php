<?php

namespace App\Core\FileStorage\Routes;

use App\Core\FileStorage\Controllers\FileStorageController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function () {

    // POST /files/upload - Upload file
    register_rest_route('api/v1', '/files/upload', [
        'methods' => 'POST',
        'callback' => [FileStorageController::class, 'upload'],
        'permission_callback' => AuthMiddleware::requirePermissions('upload_files'),
        'tags' => ['File Storage'],
        'summary' => 'Upload file',
        'description' => 'Upload a file and optionally link it to an entity (document, workflow, etc.)',
        'request_body' => [
            'required' => true,
            'content' => [
                'multipart/form-data' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'file' => [
                                'type' => 'string',
                                'format' => 'binary',
                                'description' => 'File to upload',
                                'example' => 'contract.pdf'
                            ],
                            'metadata' => [
                                'type' => 'object',
                                'description' => 'JSON metadata for the file (tags, description, etc.)',
                                'example' => '{"tags": ["important", "contract"], "description": "Q1 contract document"}'
                            ],
                            'linked_entity_type' => [
                                'type' => 'string',
                                'enum' => ['request', 'user', 'workflow', 'document', 'group'],
                                'description' => 'Type of entity to link file to',
                                'example' => 'document'
                            ],
                            'linked_entity_id' => [
                                'type' => 'string',
                                'description' => 'ID of entity to link file to',
                                'example' => 'doc-123-abc'
                            ]
                        ],
                        'required' => ['file']
                    ],
                    'examples' => [
                        'upload_with_link' => [
                            'summary' => 'Upload file with entity link',
                            'value' => [
                                'file' => 'contract.pdf',
                                'metadata' => '{"tags": ["legal", "contract"], "description": "2025 Service Agreement"}',
                                'linked_entity_type' => 'document',
                                'linked_entity_id' => 'doc-123-abc'
                            ]
                        ],
                        'simple_upload' => [
                            'summary' => 'Simple file upload',
                            'value' => [
                                'file' => 'receipt.pdf'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'file' => [
                'required' => true,
                'description' => 'File to upload',
                'type' => 'file',
                'validate_callback' => function ($param, $request, $key) {
                    return is_array($param) && isset($param['name']) && !empty($param['name']);
                }
            ],
            'metadata' => [
                'required' => false,
                'description' => 'JSON metadata for the file',
                'type' => 'object',
                'default' => null,
                'validate_callback' => function ($param, $request, $key) {
                    return $param === null || is_array($param);
                }
            ],
            'linked_entity_type' => [
                'required' => false,
                'description' => 'Type of entity to link file to (request, user, workflow, document, group)',
                'type' => 'string',
                'enum' => ['request', 'user', 'workflow', 'document', 'group'],
                'default' => null,
                'minLength' => 3,
                'maxLength' => 20,
                'validate_callback' => function ($param, $request, $key) {
                    if ($param === null) return true;
                    return in_array($param, ['request', 'user', 'workflow', 'document', 'group']);
                }
            ],
            'linked_entity_id' => [
                'required' => false,
                'description' => 'ID of entity to link file to',
                'type' => 'string',
                'default' => null,
                'minLength' => 1,
                'maxLength' => 50
            ]
        ]
    ]);

    // GET /files/{id} - Download file
    register_rest_route('api/v1', '/files/(?P<id>[a-f0-9-]+)', [
        'methods' => 'GET',
        'callback' => [FileStorageController::class, 'download'],
        'permission_callback' => AuthMiddleware::requirePermissions('view_files'),
        'tags' => ['File Storage'],
        'summary' => 'Download file',
        'description' => 'Download a file by its ID',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'File ID (UUID)',
                'type' => 'string',
                'format' => 'uuid',
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param) && preg_match('/^[a-f0-9-]+$/i', $param);
                }
            ]
        ]
    ]);

    // GET /files/{id}/info - Get file metadata
    register_rest_route('api/v1', '/files/(?P<id>[a-f0-9-]+)/info', [
        'methods' => 'GET',
        'callback' => [FileStorageController::class, 'getFile'],
        'permission_callback' => AuthMiddleware::requirePermissions('view_files'),
        'tags' => ['File Storage'],
        'summary' => 'Get file metadata',
        'description' => 'Retrieve metadata and information about a specific file',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'File ID (UUID)',
                'type' => 'string',
                'format' => 'uuid',
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param) && preg_match('/^[a-f0-9-]+$/i', $param);
                }
            ]
        ]
    ]);

    // GET /files/entity/{type}/{id} - Get files for an entity
    register_rest_route('api/v1', '/files/entity/(?P<entity_type>[a-z_]+)/(?P<entity_id>[a-zA-Z0-9_-]+)', [
        'methods' => 'GET',
        'callback' => [FileStorageController::class, 'getEntityFiles'],
        'permission_callback' => AuthMiddleware::requirePermissions('view_files'),
        'tags' => ['File Storage'],
        'summary' => 'Get files for entity',
        'description' => 'Retrieve all files linked to a specific entity (document, workflow, etc.)',
        'args' => [
            'entity_type' => [
                'required' => true,
                'description' => 'Entity type (request, user, workflow, group, document)',
                'type' => 'string',
                'enum' => ['request', 'user', 'workflow', 'document', 'group'],
                'minLength' => 3,
                'maxLength' => 20,
                'validate_callback' => function ($param, $request, $key) {
                    return in_array($param, ['request', 'user', 'workflow', 'document', 'group']);
                }
            ],
            'entity_id' => [
                'required' => true,
                'description' => 'Entity ID',
                'type' => 'string',
                'minLength' => 1,
                'maxLength' => 50
            ]
        ]
    ]);

    // DELETE /files/{id} - Delete file
    register_rest_route('api/v1', '/files/(?P<id>[a-f0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => [FileStorageController::class, 'delete'],
        'permission_callback' => AuthMiddleware::requirePermissions('delete_files'),
        'tags' => ['File Storage'],
        'summary' => 'Delete file',
        'description' => 'Soft delete a file (only file owner can delete)',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'File ID (UUID)',
                'type' => 'string',
                'format' => 'uuid',
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param) && preg_match('/^[a-f0-9-]+$/i', $param);
                }
            ]
        ]
    ]);

    // POST /files/{id}/archive - Archive file
    register_rest_route('api/v1', '/files/(?P<id>[a-f0-9-]+)/archive', [
        'methods' => 'POST',
        'callback' => [FileStorageController::class, 'archive'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_files'),
        'tags' => ['File Storage'],
        'summary' => 'Archive file',
        'description' => 'Archive a file (soft archive, only file owner can archive)',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'File ID (UUID)',
                'type' => 'string',
                'format' => 'uuid',
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param) && preg_match('/^[a-f0-9-]+$/i', $param);
                }
            ]
        ]
    ]);

    // POST /files/{id}/restore - Restore file
    register_rest_route('api/v1', '/files/(?P<id>[a-f0-9-]+)/restore', [
        'methods' => 'POST',
        'callback' => [FileStorageController::class, 'restore'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_files'),
        'tags' => ['File Storage'],
        'summary' => 'Restore file',
        'description' => 'Restore an archived file (only file owner can restore)',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'File ID (UUID)',
                'type' => 'string',
                'format' => 'uuid',
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param) && preg_match('/^[a-f0-9-]+$/i', $param);
                }
            ]
        ]
    ]);

    // POST /files/{id}/link - Link file to entity
    register_rest_route('api/v1', '/files/(?P<file_id>[a-f0-9-]+)/link', [
        'methods' => 'POST',
        'callback' => [FileStorageController::class, 'linkFile'],
        'permission_callback' => AuthMiddleware::requirePermissions('manage_files'),
        'tags' => ['File Storage'],
        'summary' => 'Link file to entity',
        'description' => 'Link an existing file to an entity (document, workflow, etc.)',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['entity_type', 'entity_id'],
                        'properties' => [
                            'entity_type' => [
                                'type' => 'string',
                                'enum' => ['request', 'user', 'workflow', 'document', 'group'],
                                'description' => 'Type of entity to link to',
                                'example' => 'workflow'
                            ],
                            'entity_id' => [
                                'type' => 'string',
                                'description' => 'ID of entity to link to',
                                'example' => 'wf-456-def'
                            ]
                        ]
                    ],
                    'examples' => [
                        'link_to_workflow' => [
                            'summary' => 'Link file to workflow',
                            'value' => [
                                'entity_type' => 'workflow',
                                'entity_id' => 'wf-456-def'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'file_id' => [
                'required' => true,
                'description' => 'File ID (UUID)',
                'type' => 'string',
                'format' => 'uuid',
                'validate_callback' => function ($param, $request, $key) {
                    return is_string($param) && !empty($param) && preg_match('/^[a-f0-9-]+$/i', $param);
                }
            ],
            'entity_type' => [
                'required' => true,
                'description' => 'Entity type to link to',
                'type' => 'string',
                'enum' => ['request', 'user', 'workflow', 'document', 'group'],
                'minLength' => 3,
                'maxLength' => 20,
                'validate_callback' => function ($param, $request, $key) {
                    return in_array($param, ['request', 'user', 'workflow', 'document', 'group']);
                }
            ],
            'entity_id' => [
                'required' => true,
                'description' => 'Entity ID to link to',
                'type' => 'string',
                'minLength' => 1,
                'maxLength' => 50
            ]
        ]
    ]);

});
