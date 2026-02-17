<?php
namespace App\Core\Auth\Security;

use \WP_Error;
use App\Core\Auth\Services\AuthService;

/**
 * Block login for inactive/terminated users at authentication stage
 */
function login_guard_block_inactive($user, $username, $password)
{
    if ($user instanceof \WP_User) {
        $active = AuthService::assertUserActive($user->ID);
        if (is_wp_error($active)) {
            return $active;
        }
    }
    return $user;
}
add_filter('authenticate', 'App\\Core\\Auth\\Security\\login_guard_block_inactive', 30, 3);

/**
 * Block REST API access for inactive/terminated users
 */
function rest_guard_block_inactive($result)
{
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        $active = AuthService::assertUserActive($user_id);
        if (is_wp_error($active)) {
            return $active;
        }
    }
    return $result;
}
add_filter('rest_authentication_errors', 'App\\Core\\Auth\\Security\\rest_guard_block_inactive', 10, 1);

/**
 * Auto-logout any logged-in user whose status became inactive/terminated
 */
function auto_logout_inactive_users()
{
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        $active = AuthService::assertUserActive($user_id);
        if (is_wp_error($active)) {
            wp_logout();
        }
    }
}
add_action('init', 'App\\Core\\Auth\\Security\\auto_logout_inactive_users');
