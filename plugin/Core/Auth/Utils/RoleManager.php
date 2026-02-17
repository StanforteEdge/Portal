<?php
namespace App\Core\Auth\Utils;

use App\Core\Auth\Services\RBACService;

/**
 * Registers custom roles and capabilities for StanforteEdge Staff Portal.
 * Call this on theme/plugin activation.
 */
function stanforteedge_register_roles_and_capabilities()
{
    // Simplified Role Structure: "Staff" is the primary bucket.
    // Granular access is handled by Custom Permissions (user_has_cap).

    add_role('staff', 'Staff', [
        'read' => true, // Basic WP access
    ]);

    // Ensure Admin has all capabilities (fallback)
    $admin = get_role('administrator');
    if ($admin) {
        $admin->add_cap('staff'); // Mark admin as staff too
    }
}
add_action('init', 'App\\Core\\Auth\\Utils\\stanforteedge_register_roles_and_capabilities');

/**
 * Intercept WordPress Capability Checks and map them to our Custom RBAC.
 * 
 * @param array $allcaps All capabilities of the user.
 * @param array $caps Capabilities being checked.
 * @param array $args Arguments (permission, user_id, etc).
 * @param object $user The WP_User object.
 * 
 * @return array Modified capabilities.
 */
function stanforteedge_map_permissions($allcaps, $caps, $args, $user)
{
    // 1. Safety Checks
    if (empty($args) || empty($user) || empty($user->ID)) {
        return $allcaps;
    }

    $required_cap = $args[0];

    // 2. Optimization: If user already has the cap (e.g., Admin), return early.
    // Except if we want to potentially DENY access explicitly? For now, we allow overrides.
    if (!empty($allcaps[$required_cap])) {
        return $allcaps;
    }

    // 2b. Super Admin Override: Standard Admins should always have access
    // This prevents lockout if the custom tables are truncated or desynced
    if (!empty($allcaps['manage_options'])) {
        $allcaps[$required_cap] = true;
        return $allcaps;
    }

    // 3. Get Profile ID associated with WP User
    // We cache this in the object cache to avoid DB hits on every cap check
    $cache_key = 'sta_profile_id_' . $user->ID;
    $profile_id = wp_cache_get($cache_key);

    if ($profile_id === false) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'sta_profiles';
        $profile_id = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE wp_user_id = %d", $user->ID));
        wp_cache_set($cache_key, $profile_id, '', 3600);
    }

    if (!$profile_id) {
        return $allcaps;
    }

    // 4. Check Custom RBAC Permission
    // We assume the capability name matches our permission slug (e.g., 'finance.view')

    // Check class existence to avoid fatal errors during early boot or migration
    if (class_exists('App\\Core\\Auth\\Services\\RBACService')) {
        // userHasPermission($profile_id, $permission_name, $organization_id = null)
        // For now, we check Global Permissions (null organization)
        if (RBACService::userHasPermission($profile_id, $required_cap)) {
            $allcaps[$required_cap] = true;
        }
    }

    return $allcaps;
}
add_filter('user_has_cap', 'App\\Core\\Auth\\Utils\\stanforteedge_map_permissions', 10, 4);
