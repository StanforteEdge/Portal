<?php

class PageHelper
{
    /**
     * Get page variables, using defaults if not set in template
     */
    public static function getPageVariables()
    {
        global $pageTitle, $breadcrumb, $activeMenu, $requiredRoles;

        // Default breadcrumb with URL
        $defaultBreadcrumb = [
            ['name' => 'Dashboard', 'url' => home_url('/admin')]
        ];

        return [
            'pageTitle' => $pageTitle ?? get_the_title(),
            'breadcrumb' => $breadcrumb ?? $defaultBreadcrumb,
            'activeMenu' => $activeMenu ?? 'dashboard',
            'requiredRoles' => $requiredRoles ?? null
        ];
    }

    /**
     * Check if current user has access to the current page based on template
     */
    public static function checkPageAccess($user_roles)
    {
        // If explicit roles are provided, check those first
        if (!empty($requiredRoles)) {
            return !empty(array_intersect((array) $user_roles, (array) $requiredRoles));
        }
        $template = get_page_template_slug();
        if (empty($template))
            return true;

        // Map template paths to required roles
        $requirements = [
            'templates/pages/Admin/' => ['administrator', 'admin'],
            'templates/pages/Requests/' => ['administrator', 'admin', 'editor', 'subscriber', 'finance_officer', 'accountant', 'finance_manager'],
            'templates/pages/Finance/' => ['administrator', 'admin', 'finance_officer', 'accountant', 'finance_manager'],
        ];

        foreach ($requirements as $path => $allowed_roles) {
            if (strpos($template, $path) === 0) {
                // If user doesn't have any of the allowed roles
                if (empty(array_intersect((array) $user_roles, $allowed_roles))) {
                    return false;
                }
                break;
            }
        }

        return true;
    }

    /**
     * Get current page URL for menu highlighting
     */
    public static function getCurrentPageUrl()
    {
        return home_url(add_query_arg(null, null));
    }

    /**
     * Check if current page matches given URL pattern
     */
    public static function isCurrentPage($url)
    {
        $current_url = self::getCurrentPageUrl();

        // Handle hash-based routing for profile pages
        if (strpos($url, '/profile') !== false && strpos($current_url, '/profile') !== false) {
            return true;
        }

        return strpos($current_url, $url) !== false;
    }

    /**
     * Get the default dashboard URL for a user based on their roles
     * All users now redirect to the unified dashboard
     */
    public static function getUserDashboardUrl($user_roles)
    {
        // Everyone goes to unified dashboard
        return home_url('/dashboard');
    }
}
