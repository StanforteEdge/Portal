<?php

/**
 * Taxonomy API Routes
 * 
 * This file defines all the REST API routes for the Taxonomy core feature.
 */

use App\Core\Taxonomy\Controllers\TaxonomyController;
use App\Core\Taxonomy\Controllers\TagController;
use App\Core\Auth\Middleware\AuthMiddleware;

// Register all routes inside the rest_api_init hook to ensure WordPress is fully loaded
add_action('rest_api_init', function () {

    // ==================== TAXONOMY ROUTES ====================

    // List all taxonomies
    register_rest_route('api/v1', '/taxonomies', [
        [
            'methods' => 'GET',
            'callback' => [TaxonomyController::class, 'listTaxonomies'],
            'permission_callback' => AuthMiddleware::requirePermissions(['view_taxonomies']),
            'tags' => ['Taxonomy'],
            'summary' => 'List all taxonomies',
            'description' => 'List all taxonomies',
            'request_body' => [
                'required' => false,
                'content' => [
                    'application/json' => [
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'search' => [
                                    'type' => 'string',
                                    'description' => 'Search term',
                                    'example' => 'example'
                                ],
                                'page' => [
                                    'type' => 'integer',
                                    'description' => 'Page number',
                                    'example' => 1
                                ],
                                'limit' => [
                                    'type' => 'integer',
                                    'description' => 'Number of items per page',
                                    'example' => 10
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ],
        // Create new taxonomy
        [
            'methods' => 'POST',
            'callback' => [TaxonomyController::class, 'createTaxonomy'],
            'permission_callback' => AuthMiddleware::requirePermissions(['manage_taxonomies']),
            'args' => [
                'name' => [
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Taxonomy name',
                    'example' => 'example'
                ],
            ],
            'tags' => ['Taxonomy'],
            'summary' => 'Create new taxonomy',
            'description' => 'Create new taxonomy',
            'request_body' => [
                'required' => true,
                'content' => [
                    'application/json' => [
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'name' => [
                                    'type' => 'string',
                                    'description' => 'Taxonomy name',
                                    'example' => 'example'
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get taxonomy by ID
    register_rest_route('api/v1', '/taxonomies/(?P<id>[a-zA-Z0-9-]+)', [
        // Get taxonomy by ID
        [
            'methods' => 'GET',
            'callback' => [TaxonomyController::class, 'getTaxonomy'],
            'permission_callback' => AuthMiddleware::requirePermissions(['view_taxonomies']),
            'tags' => ['Taxonomy'],
            'summary' => 'Get taxonomy by ID',
            'description' => 'Get taxonomy by ID',
            'request_body' => [
                'required' => false,
                'content' => [
                    'application/json' => [
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'id' => [
                                    'type' => 'string',
                                    'description' => 'Taxonomy ID',
                                    'example' => '1'
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ],
        // Update taxonomy
        [
            'methods' => 'PUT',
            'callback' => [TaxonomyController::class, 'updateTaxonomy'],
            'permission_callback' => AuthMiddleware::requirePermissions(['manage_taxonomies']),
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Taxonomy ID',
                    'example' => '1'
                ],
            ],
            'tags' => ['Taxonomy'],
            'summary' => 'Update taxonomy',
            'description' => 'Update taxonomy',
            'request_body' => [
                'required' => true,
                'content' => [
                    'application/json' => [
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'name' => [
                                    'type' => 'string',
                                    'description' => 'Taxonomy name',
                                    'example' => 'example'
                                ]
                            ]
                        ]
                    ]
                ]
            ],
        ],
        // Delete taxonomy
        [
            'methods' => 'DELETE',
            'callback' => [TaxonomyController::class, 'deleteTaxonomy'],
            'permission_callback' => AuthMiddleware::requirePermissions(['manage_taxonomies']),
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Taxonomy ID',
                    'example' => '1'
                ],
            ],
            'tags' => ['Taxonomy'],
            'summary' => 'Delete taxonomy',
            'description' => 'Delete taxonomy',
            'request_body' => [
                'required' => true,
                'content' => [
                    'application/json' => [
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'id' => [
                                    'type' => 'string',
                                    'description' => 'Taxonomy ID',
                                    'example' => '1'
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]

    ]);

    // ==================== TAXONOMY TERM ROUTES ====================

    // List terms for a taxonomy
    register_rest_route('api/v1', '/taxonomies/(?P<taxonomy_id>[a-zA-Z0-9-]+)/terms', [
        'methods' => 'GET',
        'callback' => [TaxonomyController::class, 'listTerms'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_taxonomies']),
        'args' => [
            'taxonomy_id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Taxonomy ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'List terms for a taxonomy',
        'description' => 'List terms for a taxonomy',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'taxonomy_id' => [
                                'type' => 'string',
                                'description' => 'Taxonomy ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get term tree for a taxonomy
    register_rest_route('api/v1', '/taxonomies/(?P<taxonomy_id>[a-zA-Z0-9-]+)/tree', [
        'methods' => 'GET',
        'callback' => [TaxonomyController::class, 'getTermTree'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_taxonomies']),
        'args' => [
            'taxonomy_id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Taxonomy ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Get term tree for a taxonomy',
        'description' => 'Get term tree for a taxonomy',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'taxonomy_id' => [
                                'type' => 'string',
                                'description' => 'Taxonomy ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Create new term
    register_rest_route('api/v1', '/taxonomy/terms', [
        'methods' => 'POST',
        'callback' => [TaxonomyController::class, 'createTerm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_taxonomies']),
        'args' => [
            'taxonomy_id' => [
                'required' => true,
                'type' => ['string', 'integer'],
                'description' => 'Taxonomy ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Create new term',
        'description' => 'Create new term',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'taxonomy_id' => [
                                'type' => ['string', 'integer'],
                                'description' => 'Taxonomy ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]

    ]);

    // Get term by ID
    register_rest_route('api/v1', '/taxonomy/terms/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'GET',
        'callback' => [TaxonomyController::class, 'getTerm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_taxonomies']),
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Term ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Get term by ID',
        'description' => 'Get term by ID',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Term ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Update term
    register_rest_route('api/v1', '/taxonomy/terms/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'PUT',
        'callback' => [TaxonomyController::class, 'updateTerm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_taxonomies']),
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Term ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Update term',
        'description' => 'Update term',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Term ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Delete term
    register_rest_route('api/v1', '/taxonomy/terms/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => [TaxonomyController::class, 'deleteTerm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_taxonomies']),
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Term ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Delete term',
        'description' => 'Delete term',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Term ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get child terms
    register_rest_route('api/v1', '/taxonomy/terms/(?P<parent_id>[a-zA-Z0-9-]+)/children', [
        'methods' => 'GET',
        'callback' => [TaxonomyController::class, 'getChildTerms'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_taxonomies']),
        'args' => [
            'parent_id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Parent term ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Get child terms',
        'description' => 'Get child terms',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'parent_id' => [
                                'type' => 'string',
                                'description' => 'Parent term ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // ==================== TAG ROUTES ====================

    // List all tags
    register_rest_route('api/v1', '/tags', [
        'methods' => 'GET',
        'callback' => [TagController::class, 'listTags'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_tags']),
        'tags' => ['Taxonomy'],
        'summary' => 'List all tags',
        'description' => 'List all tags',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => []
                    ]
                ]
            ]
        ]
    ]);

    // Get popular tags
    register_rest_route('api/v1', '/tags/popular', [
        'methods' => 'GET',
        'callback' => [TagController::class, 'getPopularTags'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_tags']),
        'tags' => ['Taxonomy'],
        'summary' => 'Get popular tags',
        'description' => 'Get popular tags',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => []
                    ]
                ]
            ]
        ]
    ]);

    // Search tags
    register_rest_route('api/v1', '/tags/search', [
        'methods' => 'GET',
        'callback' => [TagController::class, 'searchTags'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_tags']),
        'args' => [
            'search' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Search query',
                'example' => 'example'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Search tags',
        'description' => 'Search tags',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => []
                    ]
                ]
            ]
        ]
    ]);

    // Get tag by ID
    register_rest_route('api/v1', '/tags/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'GET',
        'callback' => [TagController::class, 'getTag'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_tags']),
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Tag ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Get tag by ID',
        'description' => 'Get tag by ID',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Tag ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Create new tag
    register_rest_route('api/v1', '/tags', [
        'methods' => 'POST',
        'callback' => [TagController::class, 'createTag'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_tags']),
        'args' => [
            'name' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Tag name',
                'example' => 'example'
            ],
            'slug' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Tag slug',
                'example' => 'example'
            ],
            'description' => [
                'required' => false,
                'type' => 'string',
                'description' => 'Tag description',
                'example' => 'example'
            ],
            'parent_id' => [
                'required' => false,
                'type' => 'string',
                'description' => 'Parent tag ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Create new tag',
        'description' => 'Create new tag',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => [
                                'type' => 'string',
                                'description' => 'Tag name',
                                'example' => 'example'
                            ],
                            'slug' => [
                                'type' => 'string',
                                'description' => 'Tag slug',
                                'example' => 'example'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Tag description',
                                'example' => 'example'
                            ],
                            'parent_id' => [
                                'type' => 'string',
                                'description' => 'Parent tag ID',
                                'example' => '1'
                            ],
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Update tag
    register_rest_route('api/v1', '/tags/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'PUT',
        'callback' => [TagController::class, 'updateTag'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_tags']),
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Tag ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Update tag',
        'description' => 'Update tag',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Tag ID',
                                'example' => '1'
                            ],
                            'name' => [
                                'type' => 'string',
                                'description' => 'Tag name',
                                'example' => 'example'
                            ],
                            'slug' => [
                                'type' => 'string',
                                'description' => 'Tag slug',
                                'example' => 'example'
                            ],
                            'description' => [
                                'type' => 'string',
                                'description' => 'Tag description',
                                'example' => 'example'
                            ],
                            'parent_id' => [
                                'type' => 'string',
                                'description' => 'Parent tag ID',
                                'example' => '1'
                            ],
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Delete tag
    register_rest_route('api/v1', '/tags/(?P<id>[a-zA-Z0-9-]+)', [
        'methods' => 'DELETE',
        'callback' => [TagController::class, 'deleteTag'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_tags']),
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Tag ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Delete tag',
        'description' => 'Delete tag',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'description' => 'Tag ID',
                                'example' => '1'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Tag an object
    register_rest_route('api/v1', '/tags/tag-object', [
        'methods' => 'POST',
        'callback' => [TagController::class, 'tagObject'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_tags']),
        'args' => [
            'object_type' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Object type',
                'example' => 'post'
            ],
            'object_id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Object ID',
                'example' => '1'
            ],
            'tag_id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Tag ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Tag an object',
        'description' => 'Tag an object',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'object_type' => [
                                'type' => 'string',
                                'description' => 'Object type',
                                'example' => 'post'
                            ],
                            'object_id' => [
                                'type' => 'string',
                                'description' => 'Object ID',
                                'example' => '1'
                            ],
                            'tag_id' => [
                                'type' => 'string',
                                'description' => 'Tag ID',
                                'example' => '1'
                            ],
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Untag an object
    register_rest_route('api/v1', '/tags/untag-object', [
        'methods' => 'POST',
        'callback' => [TagController::class, 'untagObject'],
        'permission_callback' => AuthMiddleware::requirePermissions(['manage_tags']),
        'args' => [
            'object_type' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Object type',
                'example' => 'post'
            ],
            'object_id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Object ID',
                'example' => '1'
            ],
            'tag_id' => [
                'required' => true,
                'type' => 'string',
                'description' => 'Tag ID',
                'example' => '1'
            ],
        ],
        'tags' => ['Taxonomy'],
        'summary' => 'Untag an object',
        'description' => 'Untag an object',
        'request_body' => [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'object_type' => [
                                'type' => 'string',
                                'description' => 'Object type',
                                'example' => 'post'
                            ],
                            'object_id' => [
                                'type' => 'string',
                                'description' => 'Object ID',
                                'example' => '1'
                            ],
                            'tag_id' => [
                                'type' => 'string',
                                'description' => 'Tag ID',
                                'example' => '1'
                            ],
                        ]
                    ]
                ]
            ]
        ]
    ]);

    // Get object tags
    register_rest_route('api/v1', '/tags/object/(?P<object_type>[a-zA-Z0-9_-]+)/(?P<object_id>[a-zA-Z0-9-]+)', [
        'methods' => 'GET',
        'callback' => [TagController::class, 'getObjectTags'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_tags']),
        'tags' => ['Taxonomy'],
        'summary' => 'Get object tags',
        'description' => 'Get object tags',
        'request_body' => [
            'required' => false,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'object_type' => [
                                'type' => 'string',
                                'description' => 'Object type',
                                'example' => 'post'
                            ],
                            'object_id' => [
                                'type' => 'string',
                                'description' => 'Object ID',
                                'example' => '1'
                            ],
                        ]
                    ]
                ]
            ]
        ]
    ]);
});
