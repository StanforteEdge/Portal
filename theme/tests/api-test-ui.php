<?php
/**
 * Template Name: API Test UI
 * Description: A browser-friendly interface for testing the REST API endpoints
 */

get_header();
?>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .endpoint {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            background-color: white;
        }
        .endpoint-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .method {
            padding: 5px 10px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
        }
        .method.get {
            background-color: #61affe;
        }
        .method.post {
            background-color: #49cc90;
        }
        .method.delete {
            background-color: #f93e3e;
        }
        .endpoint-url {
            font-family: monospace;
            margin-left: 10px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background-color: #45a049;
        }
        .response {
            margin-top: 15px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f5f5f5;
            font-family: monospace;
            white-space: pre-wrap;
            display: none;
        }
        .success {
            border-left: 4px solid #4CAF50;
        }
        .error {
            border-left: 4px solid #f44336;
        }
        /* Auth section styling */
        .auth-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #e8f5e9;
            border-radius: 4px;
        }
        .success-text {
            color: #4CAF50;
            font-weight: bold;
        }
        .error-text {
            color: #f44336;
            font-weight: bold;
        }
        #auth-status {
            margin-top: 10px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
        }
        #auth-status.logged-in {
            background-color: #e8f5e9;
        }
        #auth-status.logged-out {
            background-color: #ffebee;
        }
    </style>

    <div class="container">
        <h1>Stanfort Edge API Test</h1>
        <p>Use this interface to test the REST API endpoints for the Auth and User modules.</p>
        
        <div class="auth-section">
            <h3>Authentication Status</h3>
            <p>WordPress uses cookie-based authentication. Login first to test protected endpoints.</p>
            <div id="auth-status">Checking login status...</div>
        </div>

        <!-- Login Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Login</h3>
                <span class="method post">POST</span>
            </div>
            <div class="endpoint-url">/api/v1/auth/login</div>
            <div class="form-group">
                <label for="login-username">Username:</label>
                <input type="text" id="login-username" placeholder="Enter username">
            </div>
            <div class="form-group">
                <label for="login-password">Password:</label>
                <input type="password" id="login-password" placeholder="Enter password">
            </div>
            <button onclick="testEndpoint('login')">Test Login</button>
            <div id="login-response" class="response"></div>
        </div>


        <!-- List Roles Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>List Roles (Admin only)</h3>
                <span class="method get">GET</span>
            </div>
            <div class="endpoint-url">/api/v1/admin/user-roles</div>
            <button onclick="testEndpoint('list-roles')">Test List Roles</button>
            <div id="list-roles-response" class="response"></div>
        </div>

        <!-- Assign Role Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Assign Role (Admin only)</h3>
                <span class="method post">POST</span>
            </div>
            <div class="endpoint-url">/api/v1/admin/user-role</div>
            <div class="form-group">
                <label for="assign-user-id">User ID:</label>
                <input type="text" id="assign-user-id" placeholder="Enter user ID">
            </div>
            <div class="form-group">
                <label for="assign-role">Role:</label>
                <input type="text" id="assign-role" placeholder="Enter role (e.g., editor)">
            </div>
            <button onclick="testEndpoint('assign-role')">Test Assign Role</button>
            <div id="assign-role-response" class="response"></div>
        </div>

        <!-- Remove Role Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Remove Role (Admin only)</h3>
                <span class="method delete">DELETE</span>
            </div>
            <div class="endpoint-url">/api/v1/admin/user-role</div>
            <div class="form-group">
                <label for="remove-user-id">User ID:</label>
                <input type="text" id="remove-user-id" placeholder="Enter user ID">
            </div>
            <div class="form-group">
                <label for="remove-role">Role:</label>
                <input type="text" id="remove-role" placeholder="Enter role (e.g., editor)">
                <button onclick="testEndpoint('remove-role')" class="btn">Remove Role</button>
                <div id="remove-role-response" class="response"></div>
            </div>
        </div>

        <!-- User Creation Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Create User</h3>
                <span class="method post">POST</span>
            </div>
            <div class="endpoint-url">/api/v1/user</div>
            <div class="form-group">
                <label>Username: <input type="text" id="create-username" class="form-control" placeholder="username" required></label>
                <label>Email: <input type="email" id="create-email" class="form-control" placeholder="user@example.com" required></label>
                <label>Password: <input type="password" id="create-password" class="form-control" placeholder="password" required></label>
                <label>First Name: <input type="text" id="create-firstname" class="form-control" placeholder="First"></label>
                <label>Last Name: <input type="text" id="create-lastname" class="form-control" placeholder="Last"></label>
                <label>Role: 
                    <select id="create-role" class="form-control">
                        <option value="">-- Select Role --</option>
                        <option value="administrator">Administrator</option>
                        <option value="editor">Editor</option>
                        <option value="author">Author</option>
                        <option value="contributor">Contributor</option>
                        <option value="subscriber" selected>Subscriber</option>
                    </select>
                </label>
                <label>Status: 
                    <select id="create-status" class="form-control">
                        <option value="active" selected>Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </label>
                <button onclick="testEndpoint('create-user')" class="btn">Create User</button>
                <div id="create-user-response" class="response"></div>
            </div>
        </div>

        <!-- /me GET Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Get My Profile</h3>
                <span class="method get">GET</span>
            </div>
            <div class="endpoint-url">/api/v1/me</div>
            <button onclick="testEndpoint('me-get')">Test Get My Profile</button>
            <div id="me-get-response" class="response"></div>
        </div>

        <!-- /me PATCH Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Update My Profile</h3>
                <span class="method post">PATCH</span>
            </div>
            <div class="endpoint-url">/api/v1/me</div>
            <div class="form-group">
                <label for="me-first-name">First Name:</label>
                <input type="text" id="me-first-name" placeholder="Enter new first name">
            </div>
            <div class="form-group">
                <label for="me-last-name">Last Name:</label>
                <input type="text" id="me-last-name" placeholder="Enter new last name">
            </div>
            <div class="form-group">
                <label for="me-bio">Bio:</label>
                <input type="text" id="me-bio" placeholder="Enter new bio">
            </div>
            <button onclick="testEndpoint('me-patch')">Test Update My Profile</button>
            <div id="me-patch-response" class="response"></div>
        </div>

        <!-- /user GET Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>List All Users (Admin only)</h3>
                <span class="method get">GET</span>
            </div>
            <div class="endpoint-url">/api/v1/user</div>
            <button onclick="testEndpoint('user-list')">Test List Users</button>
            <div id="user-list-response" class="response"></div>
        </div>

        <!-- /user/{id} GET Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Get User by ID (Admin only)</h3>
                <span class="method get">GET</span>
            </div>
            <div class="endpoint-url">/api/v1/user/{id}</div>
            <div class="form-group">
                <label for="get-user-id">User ID:</label>
                <input type="text" id="get-user-id" placeholder="Enter user ID">
            </div>
            <button onclick="testEndpoint('user-get')">Test Get User</button>
            <div id="user-get-response" class="response"></div>
        </div>

        <!-- /user/{id} PATCH Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Update User by ID (Admin only)</h3>
                <span class="method post">PATCH</span>
            </div>
            <div class="endpoint-url">/api/v1/user/{id}</div>
            <div class="form-group">
                <label for="patch-user-id">User ID:</label>
                <input type="text" id="patch-user-id" placeholder="Enter user ID">
            </div>
            <div class="form-group">
                <label for="patch-user-bio">Bio:</label>
                <input type="text" id="patch-user-bio" placeholder="Enter new bio">
            </div>
            <div class="form-group">
                <label for="patch-user-status">Status:</label>
                <input type="text" id="patch-user-status" placeholder="Enter new status">
            </div>
            <button onclick="testEndpoint('user-patch')">Test Update User</button>
            <div id="user-patch-response" class="response"></div>
        </div>

        <!-- /user/{id} DELETE Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Delete User by ID (Admin only)</h3>
                <span class="method delete">DELETE</span>
            </div>
            <div class="endpoint-url">/api/v1/user/{id}</div>
            <div class="form-group">
                <label for="delete-user-id">User ID:</label>
                <input type="text" id="delete-user-id" placeholder="Enter user ID">
            </div>
            <button onclick="testEndpoint('user-delete')">Test Delete User</button>
            <div id="user-delete-response" class="response"></div>
        </div>
    </div>

        <!-- User Search Endpoint -->
        <div class="endpoint">
            <div class="endpoint-header">
                <h3>Search Users (Admin only)</h3>
                <span class="method get">GET</span>
            </div>
            <div class="endpoint-url">/api/v1/user/search</div>
            <div class="form-group">
                <label for="search-query">Search Query:</label>
                <input type="text" id="search-query" placeholder="Enter search term">
            </div>
            <div class="form-group">
                <label for="search-page">Page:</label>
                <input type="number" id="search-page" value="1" min="1">
            </div>
            <div class="form-group">
                <label for="search-per-page">Per Page:</label>
                <input type="number" id="search-per-page" value="10" min="1" max="100">
            </div>
            <button onclick="testEndpoint('user-search')">Test Search Users</button>
            <div id="user-search-response" class="response"></div>
        </div>

    <script>
        // Base URL for the API
        const baseUrl = 'https://staff.stanforteedge.com/wp-json/api/v1';
        
        // Check login status when page loads
        window.addEventListener('DOMContentLoaded', function() {
            checkLoginStatus();
        });
        
        // Function to check if user is logged in
        function checkLoginStatus() {
            const statusElement = document.getElementById('auth-status');
            
            fetch(wpApiSettings.root + 'api/v1/auth/status', {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': wpApiSettings.nonce
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.loggedIn) {
                    statusElement.innerHTML = '<span class="success-text">✓ Logged in as: ' + data.user.username + '</span>';
                    statusElement.classList.add('logged-in');
                } else {
                    statusElement.innerHTML = '<span class="error-text">✗ Not logged in</span><br><small>Please use the login endpoint below first</small>';
                    statusElement.classList.add('logged-out');
                }
            })
            .catch(error => {
                statusElement.innerHTML = '<span class="error-text">Error checking login status</span>';
            });
        }
        
        // Test endpoint function
        function testEndpoint(endpoint) {
            let url, method, data, responseElement;
            
            // Clear previous response
            responseElement = document.getElementById(`${endpoint}-response`);
            responseElement.innerHTML = 'Testing...';
            responseElement.style.display = 'block';
            responseElement.className = 'response';
            
            // Set up request based on endpoint
            switch(endpoint) {
                case 'login':
                    url = `${baseUrl}/auth/login`;
                    method = 'POST';
                    data = {
                        username: document.getElementById('login-username').value,
                        password: document.getElementById('login-password').value
                    };
                    break;
                case 'list-roles':
                    url = `${baseUrl}/admin/user-roles`;
                    method = 'GET';
                    data = {};
                    break;
                case 'assign-role':
                    url = `${baseUrl}/admin/user-role`;
                    method = 'POST';
                    data = {
                        user_id: document.getElementById('assign-user-id').value,
                        role: document.getElementById('assign-role').value
                    };
                    break;
                case 'remove-role':
                    url = `${baseUrl}/admin/user-role`;
                    method = 'DELETE';
                    data = {
                        user_id: document.getElementById('remove-user-id').value,
                        role: document.getElementById('remove-role').value
                    };
                    break;
                case 'create-user':
                    url = `${baseUrl}/user`;
                    method = 'POST';
                    data = {
                        username: document.getElementById('create-username').value,
                        email: document.getElementById('create-email').value,
                        password: document.getElementById('create-password').value,
                        first_name: document.getElementById('create-firstname').value,
                        last_name: document.getElementById('create-lastname').value,
                        role: document.getElementById('create-role').value,
                        status: document.getElementById('create-status').value
                    };
                    break;
                case 'me-get':
                    url = `${baseUrl}/me`;
                    method = 'GET';
                    data = {};
                    break;
                case 'me-patch':
                    url = `${baseUrl}/me`;
                    method = 'PATCH';
                    data = {
                        first_name: document.getElementById('me-first-name').value,
                        last_name: document.getElementById('me-last-name').value,
                        bio: document.getElementById('me-bio').value
                    };
                    break;
                case 'user-list':
                    url = `${baseUrl}/user`;
                    method = 'GET';
                    data = {};
                    break;
                case 'user-get':
                    url = `${baseUrl}/user/` + document.getElementById('get-user-id').value;
                    method = 'GET';
                    data = {};
                    break;
                case 'user-patch':
                    url = `${baseUrl}/user/` + document.getElementById('patch-user-id').value;
                    method = 'PATCH';
                    data = {
                        bio: document.getElementById('patch-user-bio').value,
                        status: document.getElementById('patch-user-status').value
                    };
                    break;
                case 'user-delete':
                    url = `${baseUrl}/user/` + document.getElementById('delete-user-id').value;
                    method = 'DELETE';
                    data = {};
                    break;
                case 'user-search':
                    url = `${baseUrl}/user/search`;
                    method = 'GET';
                    const searchQuery = document.getElementById('search-query').value;
                    const searchPage = document.getElementById('search-page').value;
                    const searchPerPage = document.getElementById('search-per-page').value;
                    url += `?query=${encodeURIComponent(searchQuery)}&page=${searchPage}&per_page=${searchPerPage}`;
                    data = {};
                    break;
                default:
                    responseElement.innerHTML = 'Unknown endpoint';
                    responseElement.className = 'response error';
                    return;
            }
            
            // Make the request
            const headers = {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            };
            
            const fetchOptions = {
                method: method,
                headers: headers,
                credentials: 'same-origin' // This ensures cookies are sent with the request
            };
            
            if (method !== 'GET') {
                fetchOptions.body = JSON.stringify(data);
            }
            
            fetch(url, fetchOptions)
                .then(response => {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return response.json().then(data => ({
                            status: response.status,
                            body: data
                        }));
                    } else {
                        return response.text().then(text => ({
                            status: response.status,
                            body: text
                        }));
                    }
                })
                .then(result => {
                    // Display response
                    const statusClass = result.status >= 200 && result.status < 300 ? 'success' : 'error';
                    responseElement.className = `response ${statusClass}`;
                    
                    // Format the response
                    let formattedResponse = `Status: ${result.status}\n\n`;
                    if (typeof result.body === 'object') {
                        // Handle object-based responses from refactored User model
                        if (result.body.data && typeof result.body.data === 'object') {
                            // Format pagination info if available
                            if (result.body.pagination) {
                                formattedResponse += `Pagination: Page ${result.body.pagination.current_page} of ${result.body.pagination.total_pages} (${result.body.pagination.total_items} total items)\n\n`;
                            }
                            formattedResponse += JSON.stringify(result.body, null, 2);
                        } else {
                            formattedResponse += JSON.stringify(result.body, null, 2);
                        }
                    } else {
                        formattedResponse += result.body;
                    }
                    
                    responseElement.textContent = formattedResponse;
                    
                    // If login was successful, refresh the auth status
                    if (endpoint === 'login' && result.status === 200) {
                        // Refresh auth status after successful login
                        setTimeout(checkLoginStatus, 500);
                    }
                })
                .catch(error => {
                    responseElement.className = 'response error';
                    responseElement.textContent = `Error: ${error.message}`;
                });
        }
    </script>

    <?php get_footer(); ?>
