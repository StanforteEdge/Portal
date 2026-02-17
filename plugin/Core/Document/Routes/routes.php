<?php

/**
 * Document Library REST API Routes
 * 
 * This file registers all REST API endpoints for the Document Library feature.
 * All routes use the 'api/v1' namespace and require appropriate permissions.
 */

use App\Core\Document\Controllers\DocumentController;
use App\Core\Auth\Middleware\AuthMiddleware;

// ==================== DOCUMENT ROUTES ====================

// REST API endpoints for admin RBAC management
add_action('rest_api_init', function () {

    // List documents with filtering and pagination
    register_rest_route('api/v1', '/documents', [
        'methods' => 'GET',
        'callback' => [DocumentController::class, 'listDocuments'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents']),
        'args' => [
            'page' => [
                'default' => 1,
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0;
                }
            ],
            'per_page' => [
                'default' => 10,
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0 && $param <= 100;
                }
            ],
            'status' => [
                'validate_callback' => function ($param) {
                    return in_array($param, ['draft', 'review', 'published', 'rejected', 'archived']);
                },
                'description' => 'Document status',
                'example' => 'draft'
            ],
            'category_id' => [
                'validate_callback' => function ($param) {
                    return is_string($param) && !empty($param);
                },
                'description' => 'Document category ID',
                'example' => '1'
            ],
            'department_id' => [
                'validate_callback' => function ($param) {
                    return is_string($param) && !empty($param);
                }
            ],
            'created_by' => [
                'validate_callback' => function ($param) {
                    return is_string($param) && !empty($param);
                }
            ]
            ],
        'tags' => ['Document'],
        'summary' => 'List all documents',
        'description' => 'List all documents',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'page' => [
                                'type' => 'integer',
                                'description' => 'Page number',
                                'example' => 1
                            ],
                            'per_page' => [
                                'type' => 'integer',
                                'description' => 'Number of documents per page',
                                'example' => 10
                            ],
                            'status' => [
                                'type' => 'string',
                                'description' => 'Document status',
                                'example' => 'draft'
                            ],
                            'category_id' => [
                                'type' => 'string',
                                'description' => 'Document category ID',
                                'example' => '1'
                            ],
                            'department_id' => [
                                'type' => 'string',
                                'description' => 'Document department ID',
                                'example' => '1'
                            ],
                            'created_by' => [
                                'type' => 'string',
                                'description' => 'Document created by',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Search documents
    register_rest_route('api/v1', '/documents/search', [
        'methods' => 'GET',
        'callback' => [DocumentController::class, 'searchDocuments'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents']),
        'args' => [
            'query' => [
                'required' => false,
                'validate_callback' => function ($param) {
                    return is_string($param);
                }
            ],
            'page' => [
                'default' => 1,
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0;
                }
            ],
            'per_page' => [
                'default' => 10,
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0 && $param <= 100;
                }
            ],
            'status' => [
                'validate_callback' => function ($param) {
                    return in_array($param, ['draft', 'review', 'published', 'rejected', 'archived']);
                }
            ],
            'category_id' => [
                'validate_callback' => function ($param) {
                    return is_string($param) && !empty($param);
                }
            ],
            'tags' => [
                'validate_callback' => function ($param) {
                    return is_string($param);
                }
            ],
            'created_by' => [
                'validate_callback' => function ($param) {
                    return is_string($param) && !empty($param);
                }
            ]
            ],
        'tags' => ['Document'],
        'summary' => 'Search documents',
        'description' => 'Search documents',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'query' => [
                                'type' => 'string',
                                'description' => 'Search query',
                                'example' => 'document'
                            ],
                            'page' => [
                                'type' => 'integer',
                                'description' => 'Page number',
                                'example' => 1
                            ],
                            'per_page' => [
                                'type' => 'integer',
                                'description' => 'Number of documents per page',
                                'example' => 10
                            ],
                            'status' => [
                                'type' => 'string',
                                'description' => 'Document status',
                                'example' => 'draft'
                            ],
                            'category_id' => [
                                'type' => 'string',
                                'description' => 'Document category ID',
                                'example' => '1'
                            ],
                            'tags' => [
                                'type' => 'string',
                                'description' => 'Document tags',
                                'example' => 'tag1,tag2'
                            ],
                            'created_by' => [
                                'type' => 'string',
                                'description' => 'Document created by',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Create new document
    register_rest_route('api/v1', '/documents', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'createDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['create_documents']),
        'tags' => ['Document'],
        'summary' => 'Create new document',
        'description' => 'Create new document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'title' => [
                                'type' => 'string',
                                'description' => 'Document title',
                                'example' => 'Document Title'
                            ],
                            'content' => [
                                'type' => 'string',
                                'description' => 'Document content',
                                'example' => 'Document Content'
                            ],
                            'category_id' => [
                                'type' => 'string',
                                'description' => 'Document category ID',
                                'example' => '1'
                            ],
                            'department_id' => [
                                'type' => 'string',
                                'description' => 'Document department ID',
                                'example' => '1'
                            ],
                            'tags' => [
                                'type' => 'string',
                                'description' => 'Document tags',
                                'example' => 'tag1,tag2'
                            ],
                            'status' => [
                                'type' => 'string',
                                'description' => 'Document status',
                                'example' => 'draft'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get specific document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})', [
        'methods' => 'GET',
        'callback' => [DocumentController::class, 'getDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents']),
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
            ],
        'tags' => ['Document'],
        'summary' => 'Get specific document',
        'description' => 'Get specific document',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Update document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})', [
        'methods' => 'PUT',
        'callback' => [DocumentController::class, 'updateDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
            ],
        'tags' => ['Document'],
        'summary' => 'Update document',
        'description' => 'Update document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ],
                            'title' => [
                                'type' => 'string',
                                'description' => 'Document title',
                                'example' => 'Document Title'
                            ],
                            'content' => [
                                'type' => 'string',
                                'description' => 'Document content',
                                'example' => 'Document Content'
                            ],
                            'category_id' => [
                                'type' => 'string',
                                'description' => 'Document category ID',
                                'example' => '1'
                            ],
                            'department_id' => [
                                'type' => 'string',
                                'description' => 'Document department ID',
                                'example' => '1'
                            ],
                            'tags' => [
                                'type' => 'string',
                                'description' => 'Document tags',
                                'example' => 'tag1,tag2'
                            ],
                            'status' => [
                                'type' => 'string',
                                'description' => 'Document status',
                                'example' => 'draft'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Delete document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})', [
        'methods' => 'DELETE',
        'callback' => [DocumentController::class, 'deleteDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
            ],
        'tags' => ['Document'],
        'summary' => 'Delete document',
        'description' => 'Delete document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // ==================== DOCUMENT WORKFLOW ROUTES ====================

    // Submit document for review
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/submit', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'submitForReview'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'tags' => ['Document'],
        'summary' => 'Submit document for review',
        'description' => 'Submit document for review',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Approve document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/approve', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'approveDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['publish_documents']),
        'tags' => ['Document'],
        'summary' => 'Approve document',
        'description' => 'Approve document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Reject document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/reject', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'rejectDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['publish_documents']),
        'tags' => ['Document'],
        'summary' => 'Reject document',
        'description' => 'Reject document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Archive document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/archive', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'archiveDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'tags' => ['Document'],
        'summary' => 'Archive document',
        'description' => 'Archive document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Restore archived document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/restore', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'restoreDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'tags' => ['Document'],
        'summary' => 'Restore archived document',
        'description' => 'Restore archived document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // ==================== DOCUMENT VERSION ROUTES ====================

    // Get document versions
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/versions', [
        'methods' => 'GET',
        'callback' => [DocumentController::class, 'getDocumentVersions'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents']),
        'tags' => ['Document'],
        'summary' => 'Get document versions',
        'description' => 'Get document versions',
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Get specific document version
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/versions/(?P<version>\d+)', [
        'methods' => 'GET',
        'callback' => [DocumentController::class, 'getDocumentVersion'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents']),
        'tags' => ['Document'],
        'summary' => 'Get document version',
        'description' => 'Get document version',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ],
                            'version' => [
                                'type' => 'integer',
                                'description' => 'Document version',
                                'example' => 1
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ],
            'version' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0;
                }
            ]
        ]
    ]);

    // Rollback document to previous version
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/rollback/(?P<version>\d+)', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'rollbackDocument'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'tags' => ['Document'],
        'summary' => 'Rollback document to previous version',
        'description' => 'Rollback document to previous version',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ],
                            'version' => [
                                'type' => 'integer',
                                'description' => 'Document version',
                                'example' => 1
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ],
            'version' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0;
                }
            ]
        ]
    ]);

    // ==================== DOCUMENT ATTACHMENT ROUTES ====================

    // Get document attachments
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/attachments', [
        'methods' => 'GET',
        'callback' => [DocumentController::class, 'getDocumentAttachments'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents']),
        'tags' => ['Document'],
        'summary' => 'Get document attachments',
        'description' => 'Get document attachments',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Add attachment to document
    register_rest_route('api/v1', '/documents/(?P<id>[a-f0-9\-]{36})/attachments', [
        'methods' => 'POST',
        'callback' => [DocumentController::class, 'addDocumentAttachment'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'tags' => ['Document'],
        'summary' => 'Add attachment to document',
        'description' => 'Add attachment to document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ],
                            'attachment' => [
                                'type' => 'string',
                                'description' => 'Attachment ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Remove attachment from document
    register_rest_route('api/v1', '/documents/attachments/(?P<attachment_id>[a-f0-9\-]{36})', [
        'methods' => 'DELETE',
        'callback' => [DocumentController::class, 'removeDocumentAttachment'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_documents']),
        'tags' => ['Document'],
        'summary' => 'Remove attachment from document',
        'description' => 'Remove attachment from document',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'attachment_id' => [
                                'type' => 'string',
                                'description' => 'Attachment ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'attachment_id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // ==================== DOCUMENT TAXONOMY ENDPOINTS ====================

    // Get document categories
    register_rest_route('api/v1', '/documents/categories', [
        'methods' => 'GET',
        'tags' => ['Document'],
        'summary' => 'Get document categories',
        'description' => 'Get document categories', 
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'callback' => [DocumentController::class, 'getDocumentCategories'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents'])
    ]);

    // Get document departments
    register_rest_route('api/v1', '/documents/departments', [
        'methods' => 'GET',
        'tags' => ['Document'],
        'summary' => 'Get document departments',
        'description' => 'Get document departments',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Document ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'callback' => [DocumentController::class, 'getDocumentDepartments'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents'])
    ]);

    // Get taxonomy term by ID
    register_rest_route('api/v1', '/documents/taxonomy/terms/(?P<id>[a-f0-9\-]{36})', [
        'methods' => 'GET',
        'callback' => [DocumentController::class, 'getTaxonomyTerm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_documents']),
        'tags' => ['Document'],
        'summary' => 'Get taxonomy term by ID',
        'description' => 'Get taxonomy term by ID',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Taxonomy term ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        'args' => [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param) {
                    return preg_match('/^[a-f0-9\-]{36}$/', $param);
                }
            ]
        ]
    ]);

    // Note: Tag routes have been moved to the Taxonomy core module
});
