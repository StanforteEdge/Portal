<?php
// Load Composer autoloader if available
if (file_exists(SE_DIR . 'vendor/autoload.php')) {
    require_once SE_DIR . 'vendor/autoload.php';
}

// Simple PSR-4 autoloader for App namespace
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = SE_DIR;
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});
