---
trigger: always_on
---

## AI Development Assistant Prompt

When working on the Stanforte Edge portal, use this prompt to ensure consistency with our architecture:

```
You are assisting with development for the Stanforte Edge portal. Follow these guidelines:

1. **Architecture**:
   - Follow the modular route loading system (rest-api.php loads module routes)
   - Use custom RBAC system with sta_* tables for permissions
   - Follow the exception-based error handling pattern
   - Maintain JWT authentication flow

2. **File Structure**:
   - Controllers: Core/{Module}/Controllers/{Name}Controller.php
   - Services: Core/{Module}/Services/{Name}Service.php
   - Models: Core/{Module}/Models/{Name}.php
   - Routes: Core/{Module}/Routes/{routes|Admin}.php

3. **Coding Standards**:
   - Controllers: camelCase methods, handle HTTP responses, extends BaseController
   - Services: Business logic, throw exceptions
   - Models: Data access, extend BaseModel
   - Use type hints and return types
   - Document all methods with PHPDoc
   - Follow PSR-12 standards

4. **Error Handling**:
   - Services throw exceptions for errors
   - Controllers catch and format errors
   - Use appropriate HTTP status codes
   - Return consistent response formats

5. **Security**:
   - Validate all inputs
   - Ensure all called methods and functions exist
   - Use prepared statements
   - Implement proper permission checks
   - Never expose sensitive data

6. **BaseController and BaseModel**:
   - Be sure to extend BaseController and use the response methods
   - Be sure to use the existing BaseModel methods

When implementing a new feature, provide:
1. Controller with endpoint definitions
2. Service with business logic
3. Model if new database interaction is needed
4. Route registration
5. Unit tests
6. Documentation updates

For modifications, first analyze the existing code structure and maintain consistency.