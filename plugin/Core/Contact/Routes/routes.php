<?php

use App\Core\Contact\Controllers\ContactController;
use App\Core\Auth\Middleware\AuthMiddleware;

/**
 * Contact Routes
 * 
 * Generic contact management endpoints
 */
add_action('rest_api_init', function () {
    // Get contacts for an entity
    register_rest_route('api/v1', '/contacts', [
        'methods' => 'GET',
        'callback' => [ContactController::class, 'index'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Get a single contact
    register_rest_route('api/v1', '/contacts/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => [ContactController::class, 'show'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Create a contact
    register_rest_route('api/v1', '/contacts', [
        'methods' => 'POST',
        'callback' => [ContactController::class, 'store'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Update a contact
    register_rest_route('api/v1', '/contacts/(?P<id>\d+)', [
        'methods' => 'PUT',
        'callback' => [ContactController::class, 'update'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Delete a contact
    register_rest_route('api/v1', '/contacts/(?P<id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [ContactController::class, 'destroy'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Set contact as primary
    register_rest_route('api/v1', '/contacts/(?P<id>\d+)/set-primary', [
        'methods' => 'PUT',
        'callback' => [ContactController::class, 'setPrimary'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);
});
