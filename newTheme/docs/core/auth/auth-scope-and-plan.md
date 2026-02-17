# Auth Scope and Plan

## Scope

The scope of building the theme auth pages includes:

- Creating auth pages based on the plugin's auth APIs.
- Using JWT for authentication, storing tokens in localStorage.
- Keeping theme focused on frontend, consuming plugin APIs.
- Avoiding duplicates, reusing existing CSS.
- Using Source folder for inspiration.
- Supporting login, logout, change-password, and potentially forgot-password if API is added.

## Plan

1. **Review plugin auth APIs**: Completed. Available endpoints: `/auth/login` (POST), `/auth/status` (GET), `/auth/logout` (POST), `/auth/change-password` (POST), `/auth/refresh` (POST).

2. **Review current theme auth structure**: Completed. Login page exists in `templates/pages/auth/login.php`, has JWT integration but param mismatch.

3. **Check Source folder**: Completed. Contains HTML templates for login with dark/light themes.

4. **Plan auth pages**: Completed. Main page: login. Others: logout (handled in login), change-password (separate page needed), forgot-password (needs API).

5. **Implement login**: In progress. Fix param mismatch (send "email" instead of "username").

6. **Safest approach**: Use localStorage for JWT, ensure HTTPS, short expiry, clear on logout.

7. **Modify**: Fix the login page param.

8. **Future**: Add forgot-password API in plugin, then implement page.
