<?php

namespace App\Core\Auth\Utils;

use App\Core\Auth\Middleware\AuthMiddleware;

class AuthUtils
{
    /**
     * Get the current authenticated user.
     *
     * Returns an object with at least `id` (profile_id) when available.
     */
    public static function getCurrentUser()
    {
        // Prefer JWT auth if present
        $jwtUser = AuthMiddleware::getCurrentUser();
        if ($jwtUser) {
            if (is_array($jwtUser)) {
                $jwtUser = (object) $jwtUser;
            }
            if (isset($jwtUser->profile_id)) {
                $jwtUser->id = $jwtUser->profile_id;
            }
            return $jwtUser;
        }

        // Fallback to WordPress logged-in user
        if (is_user_logged_in()) {
            $wpUser = wp_get_current_user();
            if (!$wpUser || empty($wpUser->ID)) {
                return null;
            }

            global $wpdb;
            $profileId = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}sta_profiles WHERE wp_user_id = %d",
                $wpUser->ID
            ));

            return (object) [
                'id' => $profileId ? (int) $profileId : null,
                'profile_id' => $profileId ? (int) $profileId : null,
                'wp_user_id' => (int) $wpUser->ID,
                'email' => $wpUser->user_email,
                'username' => $wpUser->user_login
            ];
        }

        return null;
    }
}
