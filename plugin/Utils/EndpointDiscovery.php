<?php

namespace App\Utils;

class EndpointDiscovery
{
    /**
     * Automatically discover all registered REST API routes
     */
    public static function discoverEndpoints()
    {
        global $wp_rest_server;
        
        if (!$wp_rest_server) {
            // error_log('[EndpointDiscovery] ERROR: wp_rest_server is not available');
            return [];
        }
        
        // Get all registered routes
        $routes = $wp_rest_server->get_routes();
        
        $api_routes = [];
        $processed_count = 0;
        $skipped_count = 0;
        
        foreach ($routes as $route => $handlers) {
            // Only include our API namespace routes
            if (strpos($route, '/api/v1/') === 0) {
                $clean_route = str_replace('/api/v1', '', $route);
                // Skip empty routes
                if (empty($clean_route) || $clean_route === '/') {
                    $skipped_count++;
                    continue;
                }
                foreach ($handlers as $handler_index => $handler) {
                    $methods = isset($handler['methods']) ? $handler['methods'] : [];
                    // Convert WP_REST_Server method constants to strings
                    $method_names = [];
                    // Handle both array and bitmask formats
                    if (is_array($methods)) {
                        // WordPress stores methods as keys, not values (e.g., ['GET' => 1, 'POST' => 1])
                        $method_names = array_keys($methods);
                    } else {
                        // Handle bitmask format
                        if ($methods & \WP_REST_Server::READABLE) {
                            $method_names[] = 'GET';
                        }
                        if ($methods & \WP_REST_Server::CREATABLE) {
                            $method_names[] = 'POST';
                        }
                        if ($methods & \WP_REST_Server::EDITABLE) {
                            $method_names[] = 'PUT';
                        }
                        if ($methods & \WP_REST_Server::DELETABLE) {
                            $method_names[] = 'DELETE';
                        }
                    }
                    foreach ($method_names as $method) {
                        // Ensure method is a valid HTTP method string
                        if (!is_string($method) || empty($method)) {
                            continue;
                        }
                        // Convert to uppercase and validate
                        $method = strtoupper(trim($method));
                        $valid_methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
                        
                        if (!in_array($method, $valid_methods)) {
                            continue;
                        }
                        
                        // Get route options which contain our custom metadata
                        $route_options = [];
                        if (function_exists('rest_get_server')) {
                            $server = rest_get_server();
                            $routes = $server->get_routes();
                            if (isset($routes[$route])) {
                                foreach ($routes[$route] as $route_handler) {
                                    if (isset($route_handler['methods'][$method])) {
                                        $route_options = [
                                            'summary' => $route_handler['summary'] ?? null,
                                            'description' => $route_handler['description'] ?? null,
                                            'request_body' => $route_handler['request_body'] ?? null,
                                            'tags' => $route_handler['tags'] ?? null,
                                            'args' => $route_handler['args'] ?? []
                                        ];
                                        break;
                                    }
                                }
                            }
                        }

                        $endpoint = [
                            'path' => $clean_route,
                            'method' => $method,
                            'callback' => $handler['callback'] ?? null,
                            'args' => $handler['args'] ?? [],
                            'permission_callback' => $handler['permission_callback'] ?? null,
                            'route' => array_merge([
                                'path' => $clean_route,
                                'methods' => [$method],
                                'callback' => $handler['callback'] ?? null,
                                'permission_callback' => $handler['permission_callback'] ?? null,
                                'args' => $handler['args'] ?? []
                            ], $route_options)
                        ];
                        
                        $api_routes[] = $endpoint;
                        $processed_count++;
                    }
                }
            } else {
                // error_log('[EndpointDiscovery] Skipping route (not /api/v1/): ' . $route);
                $skipped_count++;
            }
        }
        
        return $api_routes;
    }

    /**
     * Generate OpenAPI paths from discovered endpoints
     */
    public static function generatePathsFromEndpoints($endpoints)
    {
        
        $paths = new \stdClass();
        $generated_count = 0;
        $skipped_count = 0;
        
        foreach ($endpoints as $index => $endpoint) {
            
            $path = $endpoint['path'];
            $method = strtolower($endpoint['method']);
            
            // Convert WordPress regex patterns to OpenAPI format
            $openapi_path = self::convertToOpenAPIPath($path);
            
            // Skip invalid paths
            if (empty($openapi_path) || $openapi_path === '/' || strlen($openapi_path) < 2) {
                $skipped_count++;
                continue;
            }
            
            // Initialize path if not exists
            if (!isset($paths->{$openapi_path})) {
                $paths->{$openapi_path} = new \stdClass();
                
                // Add path-level parameters for paths with parameters
                $path_parameters = self::extractPathParameters($openapi_path);
                if (!empty($path_parameters)) {
                    $paths->{$openapi_path}->parameters = $path_parameters;
                }
            }
            
            // Debug: Log endpoint structure
            $log_data = [
                'path' => $endpoint['path'] ?? 'N/A',
                'method' => $endpoint['method'] ?? 'N/A',
                'has_route' => isset($endpoint['route']) ? 'Yes' : 'No',
                'route_keys' => isset($endpoint['route']) ? implode(', ', array_keys($endpoint['route'])) : 'N/A'
            ];
            // error_log('Endpoint structure: ' . json_encode($log_data, JSON_PRETTY_PRINT));
            
            // Generate operation object
            $operation = self::generateOperation($endpoint);
            
            $paths->{$openapi_path}->{$method} = $operation;
            $generated_count++;
        }
        
        
        return $paths;
    }

    /**
     * Convert WordPress URL pattern to OpenAPI path format
     */
    private static function convertToOpenAPIPath($path)
    {
        // Convert WordPress regex patterns to OpenAPI format
        $path = preg_replace('/\(\?P<([^>]+)>[^)]+\)/', '{\1}', $path);
        return $path;
    }
    
    /**
     * Extract path parameters from URL pattern
     * 
     * @param string $path The URL path
     * @return array Array of parameter definitions
     */
    private static function extractPathParameters($path)
    {
        $parameters = [];
        preg_match_all('/\{([^\}]+)\}/', $path, $matches);
        
        if (!empty($matches[1])) {
            foreach ($matches[1] as $param) {
                $parameters[] = [
                    'name' => $param,
                    'in' => 'path',
                    'required' => true,
                    'schema' => [
                        'type' => 'string'
                    ],
                    'description' => 'Resource identifier for ' . $param
                ];
            }
        }
        
        return $parameters;
    }

    /**
     * Generate OpenAPI operation object for an endpoint
     */
    private static function generateOperation($endpoint)
    {
        $path = $endpoint['path'] ?? '';
        $method = strtoupper($endpoint['method'] ?? 'GET');
        $route = $endpoint['route'] ?? [];
        
        // Get tags from route definition or use default
        $tags = self::getRouteTags($route);
        
        // Get summary and description from route or use defaults
        $summary = $route['summary'] ?? self::generateSummary($path, $method);
        $description = $route['description'] ?? self::generateDescription($path, $method);
        
        $operation = [
            'tags' => $tags,
            'summary' => $summary,
            'description' => $description,
            'responses' => self::generateResponses($method)
        ];

        // Only add security if the endpoint requires authentication
        if (self::requiresAuth($endpoint)) {
            // Operation-level security references a scheme defined under components.securitySchemes
            $operation['security'] = [
                ['bearerAuth' => []]
            ];
        }
        
        // Add parameters for all requests
        $parameters = self::generateParameters($endpoint);
        if (!empty($parameters)) {
            $operation['parameters'] = $parameters;
        }
        
        // Handle request body for POST/PUT/PATCH requests
        if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
            if (!empty($route['request_body'])) {
                $requestBody = $route['request_body'];
                
                // If it's already in the correct format with content, use it as-is
                if (isset($requestBody['content'])) {
                    $operation['requestBody'] = $requestBody;
                } 
                // Handle the case where request_body is the schema directly
                else {
                    $operation['requestBody'] = [
                        'required' => $requestBody['required'] ?? true,
                        'description' => $requestBody['description'] ?? 'Request body',
                        'content' => [
                            'application/json' => [
                                'schema' => $requestBody['schema'] ?? $requestBody,
                                'examples' => $requestBody['examples'] ?? []
                            ]
                        ]
                    ];
                }
            } else {
                // If no request_body is provided, create a default one
                $operation['requestBody'] = [
                    'required' => true,
                    'description' => 'Request body',
                    'content' => [
                        'application/json' => [
                            'schema' => [
                                'type' => 'object',
                                'properties' => (object)[]
                            ]
                        ]
                    ]
                ];
            }
        }
        
        return $operation;
    }

    /**
     * Get tags from route definition
     * 
     * @param array $route The route definition array
     * @return array Array of tags (defaults to ['API'] if not specified)
     */
    private static function getRouteTags($route)
    {
        return isset($route['tags']) ? (array) $route['tags'] : ['API'];
    }

    /**
     * Generate summary from path and method
     */
    private static function generateSummary($path, $method)
    {
        $action = '';
        switch ($method) {
            case 'GET':
                $action = strpos($path, '/{') !== false ? 'Get' : 'List';
                break;
            case 'POST':
                $action = 'Create';
                break;
            case 'PUT':
            case 'PATCH':
                $action = 'Update';
                break;
            case 'DELETE':
                $action = 'Delete';
                break;
        }
        
        $resource = self::getResourceFromPath($path);
        return $action . ' ' . $resource;
    }

    /**
     * Generate description from path and method
     */
    private static function generateDescription($path, $method)
    {
        $resource = self::getResourceFromPath($path);
        $action = strtolower($method);
        
        return "Endpoint to {$action} {$resource}";
    }

    /**
     * Extract resource name from path
     */
    private static function getResourceFromPath($path)
    {
        // Remove parameters and get the main resource
        $clean_path = preg_replace('/\/\{[^}]+\}/', '', $path);
        $parts = array_filter(explode('/', $clean_path));
        
        if (empty($parts)) return 'resource';
        
        $resource = end($parts);
        return ucfirst(str_replace(['-', '_'], ' ', $resource));
    }

    /**
     * Check if endpoint requires authentication
     */
    private static function requiresAuth($endpoint)
    {
        $callback = $endpoint['permission_callback'];
        
        // If it's our AuthMiddleware, it requires auth
        if (is_array($callback) && isset($callback[0]) && 
            (strpos($callback[0], 'AuthMiddleware') !== false || 
             strpos($callback[0], 'authenticate') !== false)) {
            return true;
        }
        
        // If it's __return_true, it's public
        if ($callback === '__return_true') {
            return false;
        }
        
        // Default to requiring auth for admin endpoints
        return strpos($endpoint['path'], '/admin/') === 0;
    }

    /**
     * Generate standard responses
     */
    private static function generateResponses($method)
    {
        $responses = [
            '400' => ['description' => 'Bad Request'],
            '500' => ['description' => 'Internal Server Error']
        ];
        
        switch ($method) {
            case 'GET':
                $responses['200'] = ['description' => 'Success'];
                $responses['404'] = ['description' => 'Not Found'];
                break;
            case 'POST':
                $responses['201'] = ['description' => 'Created'];
                break;
            case 'PUT':
            case 'PATCH':
                $responses['200'] = ['description' => 'Updated'];
                $responses['404'] = ['description' => 'Not Found'];
                break;
            case 'DELETE':
                $responses['200'] = ['description' => 'Deleted'];
                $responses['404'] = ['description' => 'Not Found'];
                break;
        }
        
        return $responses;
    }

    /**
     * Generate parameters for the endpoint based on HTTP method
     * 
     * @param array $endpoint The endpoint definition
     * @return array Array of OpenAPI parameter definitions
     */
    private static function generateParameters($endpoint)
    {
        $parameters = [];
        $path = $endpoint['path'];
        $method = strtoupper($endpoint['method']);
        $route = $endpoint['route'] ?? [];
        
        // 1. Always add path parameters from URL pattern
        preg_match_all('/\{([^\}]+)\}/', $path, $matches);
        if (!empty($matches[1])) {
            foreach ($matches[1] as $param) {
                $parameters[] = [
                    'name' => $param,
                    'in' => 'path',
                    'required' => true,
                    'schema' => ['type' => 'string'],
                    'description' => 'Resource identifier'
                ];
            }
        }

        // 2. Handle parameters based on HTTP method
        switch ($method) {
            case 'GET':
                // For GET requests, use args as query parameters
                if (!empty($route['args'])) {
                    foreach ($route['args'] as $param => $args) {
                        $paramDef = [
                            'name' => $param,
                            'in' => 'query',
                            'required' => $args['required'] ?? false,
                            'description' => $args['description'] ?? '',
                            'schema' => [
                                'type' => $args['type'] ?? 'string',
                            ]
                        ];
                        
                        // Add optional fields if they exist
                        foreach (['format', 'default', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'enum'] as $field) {
                            if (isset($args[$field])) {
                                $paramDef['schema'][$field] = $args[$field];
                            }
                        }
                        
                        $parameters[] = $paramDef;
                    }
                }
                break;
                
            case 'POST':
            case 'PUT':
            case 'PATCH':
                // For write operations, ignore args - they should be in request_body
                // Only path parameters are included here
                break;
                
            default:
                // For other methods, only include path parameters
                break;
        }
        
        return $parameters;
    }

    /**
     * Generate request body for POST/PUT/PATCH with examples
     * 
     * @param string $path The endpoint path
     * @param string $method The HTTP method
     * @param array $route The route registration data (optional)
     * @return array The OpenAPI request body schema
     */
    private static function generateRequestBody($path, $method, $route = null)
    {
        // Check if the route has a request_body defined
        if (isset($route['request_body'])) {
            return $route['request_body'];
        }
        
        // Fallback to a basic schema if no request_body is provided
        return [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            // No default properties - should be defined in route registration
                        ]
                    ]
                ]
            ]
        ];
    }
}
