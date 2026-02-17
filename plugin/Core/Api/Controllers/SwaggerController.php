<?php

namespace App\Core\Api\Controllers;

use App\Utils\SwaggerGenerator;
use WP_REST_Request;
use WP_REST_Response;

class SwaggerController
{
    /**
     * Serve Swagger UI interface
     */
    public static function swaggerUI(WP_REST_Request $request)
    {
        $html = SwaggerGenerator::serveSwaggerUI();
        
        // Set proper headers for HTML response
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }

    /**
     * Serve OpenAPI JSON specification
     */
    public static function swaggerJson(WP_REST_Request $request)
    {
        $spec = SwaggerGenerator::generateSpec();
        
        return new WP_REST_Response($spec, 200);
    }

    /**
     * Get API health status with auto-discovered endpoints
     */
    public static function healthCheck(WP_REST_Request $request)
    {
        // Auto-discover all API endpoints
        $endpoints = \App\Utils\EndpointDiscovery::discoverEndpoints();
        $endpoint_list = [];
        
        foreach ($endpoints as $endpoint) {
            $key = strtolower($endpoint['method']) . '_' . str_replace(['/', '{', '}'], ['_', '', ''], $endpoint['path']);
            $endpoint_list[$key] = home_url('/wp-json/api/v1' . $endpoint['path']);
        }
        
        return new WP_REST_Response([
            'status' => 'healthy',
            'version' => '1.0.0',
            'timestamp' => current_time('mysql'),
            'total_endpoints' => count($endpoints),
            'documentation' => [
                'swagger_ui' => home_url('/wp-json/api/v1/docs'),
                'swagger_json' => home_url('/wp-json/api/v1/swagger.json')
            ],
            'endpoints' => $endpoint_list
        ], 200);
    }
}
