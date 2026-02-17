# Coding Standards for Auth Module

## Method Naming
- **Controllers**: Use camelCase for method names (e.g., `login()`, `createUser()`, `assignRole()`)
- **WordPress Hooks**: Use snake_case to maintain compatibility with WordPress core

## Class Imports
- Use backslash prefix for WordPress core classes:
  ```php
  use \WP_REST_Request;
  use \WP_REST_Response;
  use \WP_Error;
  ```

## Documentation
- Use full PHPDoc comments for all methods:
  ```php
  /**
   * Method description
   * 
   * @param WP_REST_Request $request Request object
   * @return WP_REST_Response Response object
   */
  ```

## Class Declaration
- Opening brace on new line:
  ```php
  class MyClass
  {
      // Methods and properties
  }
  ```

## Error Handling
- Use `is_wp_error()` to check for WordPress errors
- Return appropriate HTTP status codes based on error type
- Use consistent error response format:
  ```php
  return new \WP_REST_Response(['error' => $error_message], $status_code);
  ```

## REST API Responses
- Always return `\WP_REST_Response` objects from controller methods
- Include appropriate HTTP status codes (200, 201, 400, 401, 403, 404)
- Use consistent response format for success/error

## Service Methods
- Separate business logic into service classes
- Return raw data or `\WP_Error` objects from service methods
- Controllers handle converting to `\WP_REST_Response`

This hybrid approach balances modern PHP practices with WordPress conventions.
