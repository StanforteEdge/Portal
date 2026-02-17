<?php
/**
 * Notification Template module REST API routes
 * 
 * This file registers all REST API endpoints for the Notification Template system.
 * All routes use the 'api/v1' namespace and require authentication.
 */
use App\Core\Notification\Controllers\TemplateController;
use App\Core\Auth\Middleware\AuthMiddleware;

add_action('rest_api_init', function() {
    // Get template by ID
    register_rest_route('api/v1', '/templates/(?P<id>[a-f0-9\-]{36})', [
        'methods' => 'GET',
        'callback' => [TemplateController::class, 'get'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_templates']),
        'tags' => ['Templates'],
        'summary' => 'Get a template by ID',
        'description' => 'Retrieves a template by its unique identifier.',
        'args' => [
            'id' => [
                'required' => true,
                'description' => 'The ID of the template to retrieve',
                'type' => 'string'
            ]
        ]
    ]);

    // List templates
    register_rest_route('api/v1', '/templates', [
        'methods' => 'GET',
        'callback' => [TemplateController::class, 'list'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_templates']),
        'tags' => ['Templates'],
        'summary' => 'List all templates',
        'description' => 'Retrieves a list of templates with optional filtering.',
        'request_body' => [
            'description' => 'Optional filters for the list of templates',
            'required' => false,
            'type' => 'object',
            'properties' => [
                'template_type' => [
                    'description' => 'Filter by template type',
                    'type' => 'string'
                ],
                'language' => [
                    'description' => 'Filter by language code',
                    'type' => 'string'
                ],
                'active_only' => [
                    'description' => 'Only return active templates',
                    'type' => 'boolean'
                ]
            ]
        ],
        'args' => [
            'template_type' => [
                'required' => false,
                'description' => 'Filter by template type',
                'type' => 'string',
                'default' => 'account'
            ],
            'language' => [
                'required' => false,
                'description' => 'Filter by language code',
                'type' => 'string',
                'default' => 'en'
            ],
            'active_only' => [
                'required' => false,
                'description' => 'Only return active templates',
                'type' => 'boolean',
                'default' => true
            ]
        ]
    ]);

    // Create template
    register_rest_route('api/v1', '/templates', [
        'methods' => 'POST',
        'callback' => [TemplateController::class, 'create'],
        'permission_callback' => AuthMiddleware::requirePermissions(['create_templates']),
        'tags' => ['Templates'],
        'summary' => 'Create a new template',
        'description' => 'Creates a new notification template.'
    ]);

    // Update template
    register_rest_route('api/v1', '/templates/(?P<id>[a-f0-9\-]{36})', [
        'methods' => 'PUT',
        'callback' => [TemplateController::class, 'update'],
        'permission_callback' => AuthMiddleware::requirePermissions(['edit_templates']),
        'tags' => ['Templates'],
        'summary' => 'Update a template',
        'description' => 'Updates an existing template.'
    ]);

    // Delete template
    register_rest_route('api/v1', '/templates/(?P<id>[a-f0-9\-]{36})', [
        'methods' => 'DELETE',
        'callback' => [TemplateController::class, 'delete'],
        'permission_callback' => AuthMiddleware::requirePermissions(['delete_templates']),
        'tags' => ['Templates'],
        'summary' => 'Delete a template',
        'description' => 'Deletes a template by its ID.'
    ]);

    // Render template
    register_rest_route('api/v1', '/templates/render', [
        'methods' => 'POST',
        'callback' => [TemplateController::class, 'render'],
        'permission_callback' => AuthMiddleware::requirePermissions(['render_templates']),
        'tags' => ['Templates'],
        'summary' => 'Render a template',
        'description' => 'Renders a template with the provided data.'
    ]);
});
