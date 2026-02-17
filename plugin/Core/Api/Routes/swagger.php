<?php
// Swagger/OpenAPI documentation routes
use App\Core\Api\Controllers\SwaggerController;

add_action('rest_api_init', function () {
    // Swagger UI interface
    register_rest_route('api/v1', '/docs', [
        'methods' => 'GET',
        'callback' => [SwaggerController::class, 'swaggerUI'],
        'permission_callback' => '__return_true', // Public access for docs
    ]);

    // OpenAPI JSON specification
    register_rest_route('api/v1', '/swagger.json', [
        'methods' => 'GET',
        'callback' => [SwaggerController::class, 'swaggerJson'],
        'permission_callback' => '__return_true', // Public access for spec
    ]);

    // API health check
    register_rest_route('api/v1', '/health', [
        'methods' => 'GET',
        'callback' => [SwaggerController::class, 'healthCheck'],
        'permission_callback' => '__return_true', // Public access for health
    ]);
});
