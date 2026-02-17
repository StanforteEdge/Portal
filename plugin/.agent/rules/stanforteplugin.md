---
trigger: manual
---

1. The Models must follow the style and structure of existing Models, and should extend BaseModel, and use BaseModel methods more with little direct sml except needed. 

2. Controllers should focus on request and response, and when current user is needed, it should be gotten from the __auth_user in the request. And should use the right method for response as specified in the BaseController.

3. Services should focus on business logic, no throwing errors, or direct sql. Just do bussiness logic, and return the result.

4. Routes Definition should follow existing patterns with the appropriate authentication and permission. and tags, summary, description, and request_body, and args.

5. Migration files are in /Database/Migrations with the /Database/MigrationRunner.php powering the migration. Every new migration file should follow the numbering and follow the latest.

6. Any additional file should be communicated before being created.

7. There must be consistency in code structure and style.

8. No redundant and duplicated logic across all features and modules.

9. Modules should not duplicate core features. they should only use core features.

10. You must check any called method exists, before using it.