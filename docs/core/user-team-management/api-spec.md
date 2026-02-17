# User & Team Management – API Specification

## 1. Team Management
- **POST /teams** – Create team
  - Request:
    ```json
    { "name": "Finance", "description": "Finance team" }
    ```
- **GET /teams** – List all teams
- **GET /teams/{id}** – Get team details
- **PUT /teams/{id}** – Update team
- **DELETE /teams/{id}** – Delete team

## 2. Team Membership
- **POST /teams/{id}/members** – Add user to team
  - Request:
    ```json
    { "user_id": "u1x2y3z4-...", "role": "member" }
    ```
- **GET /teams/{id}/members** – List team members
- **DELETE /teams/{id}/members/{user_id}** – Remove user from team

## 3. User Queries
- **GET /users/{id}/teams** – List teams for a user
- **GET /teams/{id}/leads** – List team leads

## 4. Hierarchy & Search
- **GET /teams/tree** – Get full team hierarchy/tree
- **GET /teams/search?name=...** – Search teams by name

## 5. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 404, "message": "Not Found" } }
  ```

---

For more, see technical spec and DB schema.
