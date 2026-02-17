<?php

use App\Core\Forms\Controllers\FormController;
use App\Core\Forms\Controllers\FormSubmissionController;
use App\Core\Auth\Middleware\AuthMiddleware;

/**
 * Forms API Routes
 * 
 * Register REST API endpoints for Forms system
 */
add_action('rest_api_init', function () {
    $namespace = 'api/v1';

    $formController = new FormController();
    $submissionController = new FormSubmissionController();

    // ==================== FORMS ====================

    // Get database tables (for custom storage)
    register_rest_route($namespace, '/forms/schema/tables', [
        'methods' => 'GET',
        'callback' => [$formController, 'getDatabaseTables'],
        'permission_callback' => AuthMiddleware::requirePermissions(['admin.manage_forms']),
        'tags' => ['Forms', 'Admin'],
        'summary' => 'List database tables',
        'description' => 'Get a list of available database tables for custom storage mapping'
    ]);

    // Get table columns (for custom storage)
    register_rest_route($namespace, '/forms/schema/tables/(?P<table>[a-zA-Z0-9_\-]+)/columns', [
        'methods' => 'GET',
        'callback' => [$formController, 'getTableColumns'],
        'permission_callback' => AuthMiddleware::requirePermissions(['admin.manage_forms']),
        'tags' => ['Forms', 'Admin'],
        'summary' => 'List table columns',
        'description' => 'Get columns for a selected table to map form fields'
    ]);

    // Get all forms
    register_rest_route($namespace, '/forms', [
        'methods' => 'GET',
        'callback' => [$formController, 'getForms'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_forms']),
        'tags' => ['Forms'],
        'summary' => 'Get all forms',
        'description' => 'Get all forms'
    ]);

    // Get single form
    register_rest_route($namespace, '/forms/(?P<id>[a-f0-9\-]+)', [
        'methods' => 'GET',
        'callback' => [$formController, 'getForm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_forms']),
        'tags' => ['Forms'],
        'summary' => 'Get single form',
        'description' => 'Get single form'
    ]);

    // Create form
    register_rest_route($namespace, '/forms', [
        'methods' => 'POST',
        'callback' => [$formController, 'createForm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['admin.manage_forms'])
    ]);

    // Update form
    register_rest_route($namespace, '/forms/(?P<id>[a-f0-9\-]+)', [
        'methods' => ['PUT', 'POST'],
        'callback' => [$formController, 'updateForm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['admin.manage_forms'])
    ]);

    // Delete form
    register_rest_route($namespace, '/forms/(?P<id>[a-f0-9\-]+)', [
        'methods' => 'DELETE',
        'callback' => [$formController, 'deleteForm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['admin.manage_forms'])
    ]);

    // Assign form
    register_rest_route($namespace, '/forms/(?P<id>[a-f0-9\-]+)/assign', [
        'methods' => 'POST',
        'callback' => [$formController, 'assignForm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['admin.manage_forms'])
    ]);

    // Get assigned forms
    register_rest_route($namespace, '/forms/assigned', [
        'methods' => 'GET',
        'callback' => [$formController, 'getAssignedForms'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_forms'])
    ]);

    // ==================== SUBMISSIONS ====================

    // Submit form
    register_rest_route($namespace, '/forms/(?P<id>[a-f0-9\-]+)/submit', [
        'methods' => 'POST',
        'callback' => [$submissionController, 'submitForm'],
        'permission_callback' => AuthMiddleware::requirePermissions(['submit_forms'])
    ]);

    // Get form submissions
    register_rest_route($namespace, '/forms/(?P<id>[a-f0-9\-]+)/submissions', [
        'methods' => 'GET',
        'callback' => [$submissionController, 'getSubmissions'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_forms'])
    ]);

    // Get single submission
    register_rest_route($namespace, '/submissions/(?P<id>[a-f0-9\-]+)', [
        'methods' => 'GET',
        'callback' => [$submissionController, 'getSubmission'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_forms'])
    ]);

    // Update submission status (workflow)
    register_rest_route($namespace, '/submissions/(?P<id>[a-f0-9\-]+)/status', [
        'methods' => ['PUT', 'POST'],
        'callback' => [$submissionController, 'updateStatus'],
        'permission_callback' => AuthMiddleware::requirePermissions(['submit_forms'])
    ]);

    // Assign submission (workflow)
    register_rest_route($namespace, '/submissions/(?P<id>[a-f0-9\-]+)/assign', [
        'methods' => ['PUT', 'POST'],
        'callback' => [$submissionController, 'assignSubmission'],
        'permission_callback' => AuthMiddleware::requirePermissions(['submit_forms'])
    ]);

    // Resolve submission (workflow)
    register_rest_route($namespace, '/submissions/(?P<id>[a-f0-9\-]+)/resolve', [
        'methods' => ['PUT', 'POST'],
        'callback' => [$submissionController, 'resolveSubmission'],
        'permission_callback' => AuthMiddleware::requirePermissions(['submit_forms'])
    ]);

    // Get my submissions
    register_rest_route($namespace, '/submissions/my', [
        'methods' => 'GET',
        'callback' => [$submissionController, 'getMySubmissions'],
        'permission_callback' => AuthMiddleware::requirePermissions(['view_forms'])
    ]);
});
