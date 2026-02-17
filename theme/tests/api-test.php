<?php

/**
 * API Endpoint Test Script
 * 
 * This script tests the REST API endpoints for the Auth and User modules.
 * Run this script in the browser to test the endpoints.
 * Updated to work with the refactored User model that extends BaseModel.
 */

// Set up headers for JSON response
header('Content-Type: application/json');

// Base URL for the API
$base_url = 'https://staff.stanforteedge.com/wp-json/api/v1';

// Test results container
$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'base_url' => $base_url,
    'endpoints' => []
];

/**
 * Helper function to make API requests
 * 
 * @param string $url The endpoint URL
 * @param string $method HTTP method (GET, POST, DELETE, PATCH)
 * @param array $data Request data
 * @param array $headers Request headers
 * @return array Response data
 */
function make_request($url, $method = 'GET', $data = [], $headers = [])
{
    static $cookie_jar = null;

    // Create a cookie jar file if it doesn't exist
    if ($cookie_jar === null) {
        $cookie_jar = tempnam(sys_get_temp_dir(), 'cookie');
    }

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    // Cookie handling for session persistence
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie_jar); // Read cookies from file
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie_jar);  // Write cookies to file

    // Always set Content-Type header for JSON data
    $default_headers = ['Content-Type: application/json'];
    $all_headers = !empty($headers) ? array_merge($default_headers, $headers) : $default_headers;
    curl_setopt($ch, CURLOPT_HTTPHEADER, $all_headers);

    if (!empty($data) && ($method === 'POST' || $method === 'PUT')) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    // Add timeout to prevent hanging on server errors
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    // Parse response if possible
    $parsed_response = null;
    if ($response !== false) {
        $parsed_response = json_decode($response, true);
        // If JSON parsing failed but we have a response, include the raw response
        if ($parsed_response === null && $response) {
            // Check if it's an HTML error page (like 500 errors)
            if (strpos($response, '<!DOCTYPE html>') !== false || strpos($response, '<html') !== false) {
                $parsed_response = [
                    'error' => 'Server returned HTML instead of JSON',
                    'html_response' => substr($response, 0, 500) . '...' // Truncate long HTML responses
                ];
            } else {
                $parsed_response = ['raw_response' => $response];
            }
        }
    }

    return [
        'status_code' => $http_code,
        'response' => $parsed_response,
        'error' => $error,
        'success' => ($http_code >= 200 && $http_code < 300 && !$error)
    ];
}

/**
 * Test an endpoint and record the result
 * 
 * @param string $name Endpoint name
 * @param string $endpoint Endpoint path
 * @param string $method HTTP method
 * @param array $data Request data
 * @param array $headers Request headers
 * @return array Test result
 */
function test_endpoint($name, $endpoint, $method = 'GET', $data = [], $headers = [])
{
    global $base_url, $results;

    $url = $base_url . $endpoint;
    $start_time = microtime(true);
    $response = make_request($url, $method, $data, $headers);
    $end_time = microtime(true);

    $result = [
        'name' => $name,
        'url' => $url,
        'method' => $method,
        'status_code' => $response['status_code'],
        'response_time' => round(($end_time - $start_time) * 1000, 2) . 'ms',
        'success' => $response['success'],
        'error' => $response['error']
    ];

    // Handle different types of responses
    if ($result['success']) {
        $result['response'] = $response['response'];
        $result['response_summary'] = 'Success - Response received';
    } else {
        // Check for different error types
        if (!empty($response['error'])) {
            // cURL error
            $result['response'] = 'Connection Error: ' . $response['error'];
        } else if (isset($response['response']['error'])) {
            // API returned error message
            $result['response'] = 'API Error: ' . $response['response']['error'];
        } else if (isset($response['response']['html_response'])) {
            // Server returned HTML instead of JSON (like 500 errors)
            $result['response'] = 'Server Error: HTML response received';
            // Store a snippet of the HTML for debugging
            $result['html_snippet'] = substr($response['response']['html_response'], 0, 200);
        } else {
            // Unknown error
            $result['response'] = $response['response'] ?? [];
            $result['response_summary'] = 'Unknown Error: Status code ' . $response['status_code'];
        }
    }

    $results['endpoints'][] = $result;
    return $result;
}

$auth_status_result = test_endpoint(
    'Auth Status',
    '/auth/status',
    'GET'
);

// Test login endpoint
$login_result = test_endpoint(
    'Login',
    '/auth/login',
    'POST',
    [
        'username' => 'test_user',
        'password' => 'test_password'
    ]
);

// Test create user endpoint (requires admin privileges)
$create_user_result = test_endpoint(
    'Create User',
    '/user',
    'POST',
    [
        'username' => 'new_test_user_' . time(),
        'email' => 'test_' . time() . '@example.com',
        'password' => 'secure_password_' . time(),
        'first_name' => 'Test',
        'last_name' => 'User',
        'role' => 'subscriber'
    ]
);

// Test list roles endpoint
$list_roles_result = test_endpoint(
    'List Roles',
    '/admin/user-roles',
    'GET'
    // No token needed - uses WordPress cookies
);

// Test assign role endpoint
$assign_role_result = test_endpoint(
    'Assign Role',
    '/admin/user-role',
    'POST',
    [
        'user_id' => 1,
        'role' => 'editor'
    ]
    // No token needed - uses WordPress cookies
);

// Test remove role endpoint
$remove_role_result = test_endpoint(
    'Remove Role',
    '/admin/user-role',
    'DELETE',
    [
        'user_id' => 1,
        'role' => 'editor'
    ]
    // No token needed - uses WordPress cookies
);

// Test create user endpoint
$create_user_result = test_endpoint(
    'Create User',
    '/admin/create-user',
    'POST',
    [
        'username' => 'another_test_user_' . time(),
        'email' => 'another_' . time() . '@example.com',
        'password' => 'secure_password',
        'first_name' => 'Another',
        'last_name' => 'Test',
        'role' => 'subscriber'
    ]
    // No token needed - uses WordPress cookies
);

// Test /me GET (current user profile)
$me_get_result = test_endpoint(
    '/me (GET current user profile)',
    '/me',
    'GET'
);

// Test /me PATCH (update current user profile)
$me_patch_result = test_endpoint(
    '/me (PATCH update current user profile)',
    '/me',
    'PATCH',
    [
        // Example update fields (adjust as needed)
        'first_name' => 'UpdatedFirst',
        'last_name' => 'UpdatedLast',
        'bio' => 'Updated bio via test'
    ]
);

// Test /user GET (admin: list all users)
$user_list_result = test_endpoint(
    '/user (GET list all users, admin only)',
    '/user',
    'GET'
);

// Test /user POST (admin: create user)
$user_create_result = test_endpoint(
    '/user (POST create user, admin only)',
    '/user',
    'POST',
    [
        'username' => 'apitestuser_' . time(),
        'email' => 'apitestuser_' . time() . '@example.com',
        'password' => 'secure_password_' . time(),
        'first_name' => 'API',
        'last_name' => 'Test',
        'role' => 'subscriber',
        'status' => 'active'
    ]
);

// Test /user/{id} GET (admin: get user by ID)
// With refactored API, the user ID might be in a different location in the response
$user_id = 1; // Default fallback
if (isset($user_create_result['response']['id'])) {
    $user_id = $user_create_result['response']['id'];
} elseif (isset($user_create_result['response']['user_id'])) {
    $user_id = $user_create_result['response']['user_id'];
} elseif (isset($user_create_result['response']['data']['id'])) {
    $user_id = $user_create_result['response']['data']['id'];
} elseif (isset($user_create_result['response']['data']['user_id'])) {
    $user_id = $user_create_result['response']['data']['user_id'];
}
$user_get_result = test_endpoint(
    "/user/{id} (GET user by ID, admin only)",
    "/user/{$user_id}",
    'GET'
);

// Test /user/{id} PATCH (admin: update user by ID)
$user_patch_result = test_endpoint(
    "/user/{id} (PATCH update user, admin only)",
    "/user/{$user_id}",
    'PATCH',
    [
        'bio' => 'Updated by admin test',
        'status' => 'inactive'
    ]
);

// Test /user/{id} DELETE (admin: delete user by ID)
$user_delete_result = test_endpoint(
    "/user/{id} (DELETE user, admin only)",
    "/user/{$user_id}",
    'DELETE'
);

// Test permission checks (try /user endpoints as non-admin, if possible)
// (Assumes the script can be run as a non-admin session for negative tests)

// Test user search endpoint (admin only)
$user_search_result = test_endpoint(
    '/user/search (GET search users, admin only)',
    '/user/search',
    'GET',
    [
        'query' => 'test',
        'page' => 1,
        'per_page' => 10
    ]
);

// Output results
echo json_encode($results, JSON_PRETTY_PRINT);
