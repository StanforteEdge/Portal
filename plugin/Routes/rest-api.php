<?php
// StanforteEdge Portal REST API - Dynamic route loader
error_log('rest-api.php started loading');

// List all module route files to be loaded
$modules = [
    SE_DIR . 'Core/Auth/Routes/routes.php',
    SE_DIR . 'Core/Auth/Routes/Admin.php',
    SE_DIR . 'Core/User/Routes/routes.php',
    SE_DIR . 'Core/User/Routes/groups.php',
    SE_DIR . 'Core/FileStorage/Routes/files.php',
    SE_DIR . 'Core/Requests/Routes/requests.php',
    SE_DIR . 'Core/Api/Routes/swagger.php',
    SE_DIR . 'Core/Document/Routes/routes.php',
    SE_DIR . 'Core/Taxonomy/Routes/routes.php',
    SE_DIR . 'Core/Organization/Routes/routes.php',
    SE_DIR . 'Core/Notification/Routes/routes.php',
    SE_DIR . 'Core/Notification/Routes/templates.php',
    SE_DIR . 'Core/Forms/Routes/api.php',
    SE_DIR . 'Core/Contact/Routes/routes.php',
    // Admin Module routes
    SE_DIR . 'Modules/Admin/Routes/users.php',
    // Finance Module routes
    SE_DIR . 'Modules/Finance/Routes/api.php',
    // HR Module routes
    SE_DIR . 'Modules/HR/Routes/routes.php',
];
foreach ($modules as $routeFile) {
    // error_log("Checking route file: $routeFile");
    if (file_exists($routeFile)) {
        // error_log("Loading route file: $routeFile");
        require_once $routeFile;
    } else {
        // error_log("Route file not found: $routeFile");
    }
}
