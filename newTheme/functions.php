<?php

/**
 * Theme functions for Stanforte Edge Theme
 */

// Check if the plugin is active
if (!defined('SE_DIR')) {
    add_action('admin_notices', function () {
        echo '<div class="error"><p>Stanforte Edge Core plugin is required for this theme to function properly.</p></div>';
    });
    return;
}

// Basic theme setup
function stanforte_theme_setup()
{
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
    add_theme_support('custom-logo');
}
add_action('init', 'stanforte_theme_setup');

// Enqueue scripts and styles
function stanforte_enqueue_scripts()
{
    wp_enqueue_style(
        'stanforte-st',
        get_template_directory_uri() . '/assets/css/app.css',
        array(),
        filemtime(get_template_directory() . '/assets/css/app.css') // Automatically updates version when file changes
    );

    wp_enqueue_script(
        'stanforte-script',
        get_template_directory_uri() . '/assets/js/app.js',
        array('jquery'),
        filemtime(get_template_directory() . '/assets/js/app.js'),
        true
    );

    // Add this to your functions.php
    wp_enqueue_script(
        'lucide-cdn',
        'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
        array(),
        '1.0.0',
        true
    );
    wp_enqueue_script(
        'stanforte-auth',
        get_template_directory_uri() . '/assets/js/auth/auth.js',
        array('jquery'),
        filemtime(get_template_directory() . '/assets/js/auth/auth.js'),
        true
    );
    wp_enqueue_script(
        'stanforte-data-client',
        get_template_directory_uri() . '/assets/js/common/data-client.js',
        array('jquery', 'stanforte-auth'),
        filemtime(get_template_directory() . '/assets/js/common/data-client.js'),
        true
    );
    wp_enqueue_script('toastify', 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.js');
    wp_localize_script('stanforte-global', 'wpApiSettings', [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
    ]);

    // Inject rich user context for Zero-Fetch experience
    $user_context = [
        'isLoggedIn' => is_user_logged_in(),
        'user' => null
    ];

    if (is_user_logged_in()) {
        $profile = \App\Core\User\Services\UserService::getProfileByWpUserId(get_current_user_id());
        if ($profile) {
            $user_context['user'] = $profile;
        }
    }

    wp_localize_script('stanforte-script', 'userContext', $user_context);
}
add_action('wp_enqueue_scripts', 'stanforte_enqueue_scripts');

// Function to scan all template files (optimized version - focuses on templates/ folder)
function scan_all_template_files($base_dir = '')
{
    if (empty($base_dir)) {
        $base_dir = get_template_directory();
    }

    $template_files = array();

    if (!is_dir($base_dir)) {
        return $template_files;
    }

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($base_dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($files as $file) {
        if (
            $file->isFile() &&
            $file->getExtension() === 'php' &&
            !preg_match('/^\./', $file->getFilename()) &&
            strpos($file->getPathname(), '/templates/') !== false
        ) {

            $relative_path = str_replace($base_dir . '/', '', $file->getPathname());
            $template_files[] = array(
                'path' => $relative_path,
                'name' => $file->getFilename(),
                'full_path' => $file->getPathname()
            );
        }
    }

    return $template_files;
}

// Register theme templates
function register_theme_templates($page_templates, $theme, $post)
{
    $templates = scan_all_template_files();

    foreach ($templates as $template) {
        if (file_exists($template['full_path'])) {
            $file_content = file_get_contents($template['full_path']);
            if (preg_match('#Template Name:(.+?)(\*/|\?>|$)#mi', $file_content, $matches)) {
                $template_name = trim($matches[1]);
                $page_templates[$template['path']] = $template_name;
            }
        }
    }

    return $page_templates;
}
add_filter('theme_page_templates', 'register_theme_templates', 10, 3);

// Load helpers
require_once get_template_directory() . '/includes/helpers/AuthHelper.php';
require_once get_template_directory() . '/includes/helpers/PageHelper.php';
