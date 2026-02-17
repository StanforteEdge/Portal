<?php

namespace App\Utils;

class SwaggerGenerator
{
  private static $spec = [
    'openapi' => '3.0.0',
    'info' => [
      'title' => 'Stanforte Edge Portal API',
      'description' => 'REST API for Stanfort Edge Portal with custom RBAC',
      'version' => '1.0.0',
      'contact' => [
        'name' => 'Stanfort Edge',
        'email' => 'dev@stanforteedge.com'
      ]
    ],
    'servers' => [],
    'paths' => [],
    'components' => [
      'securitySchemes' => [
        'bearerAuth' => [
          'type' => 'http',
          'scheme' => 'bearer',
          'bearerFormat' => 'JWT'
        ]
      ],
      'schemas' => []
    ],
    'security' => [
      ['bearerAuth' => []]
    ]
  ];

  public static function generateSpec()
  {
    // Set server URL dynamically
    self::$spec['servers'] = [
      [
        'url' => home_url('/wp-json/api/v1'),
        'description' => 'Production server'
      ]
    ];

    // Auto-discover endpoints and generate documentation
    $endpoints = \App\Utils\EndpointDiscovery::discoverEndpoints();
    $paths = \App\Utils\EndpointDiscovery::generatePathsFromEndpoints($endpoints);

    // Use auto-discovered paths
    self::$spec['paths'] = $paths;

    // Add schemas to the spec
    self::addSchemas();

    return self::$spec;
  }

  public static function addSchemas()
  {
    // Ensure components exists and is an object
    if (!isset(self::$spec['components'])) {
      self::$spec['components'] = [];
    }

    self::$spec['components']['schemas'] = [
      'User' => [
        'type' => 'object',
        'properties' => [
          'id' => ['type' => 'integer'],
          'email' => ['type' => 'string', 'format' => 'email'],
          'first_name' => ['type' => 'string'],
          'last_name' => ['type' => 'string'],
          'roles' => ['type' => 'array', 'items' => ['type' => 'string']],
          'created_at' => ['type' => 'string', 'format' => 'date-time']
        ]
      ],
      'CreateUser' => [
        'type' => 'object',
        'required' => ['email', 'password', 'first_name', 'last_name'],
        'properties' => [
          'email' => ['type' => 'string', 'format' => 'email'],
          'password' => ['type' => 'string', 'minLength' => 8],
          'first_name' => ['type' => 'string'],
          'last_name' => ['type' => 'string']
        ]
      ],
      'UpdateUser' => [
        'type' => 'object',
        'properties' => [
          'first_name' => ['type' => 'string'],
          'last_name' => ['type' => 'string'],
          'bio' => ['type' => 'string']
        ]
      ],
      'CreateRole' => [
        'type' => 'object',
        'required' => ['name', 'display_name'],
        'properties' => [
          'name' => ['type' => 'string'],
          'display_name' => ['type' => 'string'],
          'description' => ['type' => 'string']
        ]
      ],
      'CreatePermission' => [
        'type' => 'object',
        'required' => ['name', 'display_name'],
        'properties' => [
          'name' => ['type' => 'string'],
          'display_name' => ['type' => 'string'],
          'description' => ['type' => 'string']
        ]
      ]
    ];
  }

  public static function serveSwaggerUI()
  {
    $swagger_ui_url = 'https://unpkg.com/swagger-ui-dist@4.5.0';

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Stanfort Edge API Documentation</title>
  <link rel="stylesheet" type="text/css" href="$swagger_ui_url/swagger-ui.css" />
  <link rel="icon" type="image/png" href="$swagger_ui_url/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="$swagger_ui_url/favicon-16x16.png" sizes="16x16" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .custom-token-section { 
      padding: 15px 20px; 
      background: #f8f8f8; 
      border-bottom: 1px solid #ddd; 
      display: none; /* Hidden by default */
    }
    .custom-token-section input { 
      padding: 8px 12px; 
      margin-right: 10px; 
      width: 400px; 
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    .custom-token-section button { 
      padding: 8px 16px; 
      background: #4990e2; 
      color: white; 
      border: none; 
      border-radius: 4px; 
      cursor: pointer;
      font-size: 14px;
    }
    .custom-token-section button:hover { 
      background: #3a7bc8; 
    }
    .token-status {
      margin-left: 15px;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
    }
    .success { color: #28a745; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="custom-token-section">
    <input type="text" id="jwt-token" placeholder="Paste your JWT token here" />
    <button onclick="setToken()">Set Token</button>
    <span id="token-status" class="token-status"></span>
  </div>
  <div id="swagger-ui"></div>
  <script src="$swagger_ui_url/swagger-ui-bundle.js"></script>
  <script src="$swagger_ui_url/swagger-ui-standalone-preset.js"></script>
  <script>
    // Initialize Swagger UI when the page loads
    window.onload = function() {
      // Initialize Swagger UI
      window.ui = SwaggerUIBundle({
        url: window.location.origin + '/wp-json/api/v1/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        // Enable authorization persistence
        persistAuthorization: true,
        
        onComplete: function() {
          console.log('Swagger UI initialization complete');
          
          // Check if we have a token in localStorage from previous custom implementation
          const oldToken = localStorage.getItem('jwt_token');
          if (oldToken) {
            // Migrate old token to Swagger UI's auth system
            window.ui.authActions.authorize({
              bearerAuth: {
                value: oldToken
              }
            });
            // Remove the old token storage
            localStorage.removeItem('jwt_token');
          }
        }
      });
    };
  </script>
</body>
</html>
HTML;

    return $html;
  }
}