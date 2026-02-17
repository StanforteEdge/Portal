<?php
/**
 * Authentication Helper
 * Handles auth redirects for logged-in users on public pages
 */

class AuthHelper
{

    /**
     * Check if user is logged in via cookie and redirect if on auth pages
     * Call this at the top of login, forgot-password, reset-password pages
     * 
     * @return void
     */
    public static function redirect_if_authenticated()
    {
        // Check for logged_in cookie
        $is_logged_in = isset($_COOKIE['logged_in']) && $_COOKIE['logged_in'] === 'true';

        if (!$is_logged_in) {
            return; // Not logged in, show the page
        }

        // Get current path
        $current_path = $_SERVER['REQUEST_URI'];

        // Define auth pages that should redirect logged-in users
        $auth_pages = [
            '/login',
            '/login/',
            '/forgot-password',
            '/forgot-password/',
            '/reset-password',
            '/reset-password/',
            '/'
        ];

        // Check if current page is an auth page
        $is_auth_page = false;
        foreach ($auth_pages as $page) {
            if (strpos($current_path, $page) === 0) {
                $is_auth_page = true;
                break;
            }
        }

        if (!$is_auth_page) {
            return; // Not on auth page, allow access
        }

        // User is logged in and on auth page, redirect to dashboard
        // JavaScript will handle role-based section rendering
        wp_redirect('/dashboard');
        exit;
    }

    /**
     * Set logged_in cookie
     * Call this from JavaScript after successful login
     * 
     * @param bool $value
     * @return void
     */
    public static function set_logged_in_cookie($value = true)
    {
        $cookie_value = $value ? 'true' : 'false';
        $expire = $value ? time() + (7 * 24 * 60 * 60) : time() - 3600; // 7 days or expire now

        setcookie('logged_in', $cookie_value, $expire, '/', '', true, false);
    }

    /**
     * Clear logged_in cookie
     * Call this on logout
     * 
     * @return void
     */
    public static function clear_logged_in_cookie()
    {
        self::set_logged_in_cookie(false);
    }
}
