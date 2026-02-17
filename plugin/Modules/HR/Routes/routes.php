<?php

use App\Modules\HR\Controllers\Employee\EmployeeController;
use App\Core\Auth\Middleware\AuthMiddleware;

/**
 * HR Employee Management Routes
 */
add_action('rest_api_init', function () {

    // Get Profiles for employee assignment
    register_rest_route('api/v1', '/hr/profiles', [
        'methods' => 'GET',
        'callback' => [EmployeeController::class, 'getProfiles'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);
    // Get employees list
    register_rest_route('api/v1', '/hr/employees', [
        'methods' => 'GET',
        'callback' => [EmployeeController::class, 'index'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Get a single employee
    register_rest_route('api/v1', '/hr/employees/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => [EmployeeController::class, 'show'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Create an employee
    register_rest_route('api/v1', '/hr/employees', [
        'methods' => 'POST',
        'callback' => [EmployeeController::class, 'store'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Update an employee
    register_rest_route('api/v1', '/hr/employees/(?P<id>\d+)', [
        'methods' => 'PUT',
        'callback' => [EmployeeController::class, 'update'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Delete an employee
    register_rest_route('api/v1', '/hr/employees/(?P<id>\d+)', [
        'methods' => 'DELETE',
        'callback' => [EmployeeController::class, 'destroy'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Update employment status
    register_rest_route('api/v1', '/hr/employees/(?P<id>\d+)/status', [
        'methods' => 'PUT',
        'callback' => [EmployeeController::class, 'updateStatus'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);

    // Get employee contacts
    register_rest_route('api/v1', '/hr/employees/(?P<id>\d+)/contacts', [
        'methods' => 'GET',
        'callback' => [EmployeeController::class, 'getContacts'],
        'permission_callback' => [AuthMiddleware::class, 'authenticate']
    ]);
});
