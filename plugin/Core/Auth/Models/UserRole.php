<?php
namespace App\Core\Auth\Models;

use App\Utils\BaseModel;

class UserRole extends BaseModel
{
    protected $table = 'sta_user_roles';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'profile_id',
        'role_id',
        'organization_id',
        'is_primary_role',
        'assigned_at',
        'created_at'
    ];

    protected $casts = [
        'is_primary_role' => 'boolean',
        'assigned_at' => 'datetime',
        'created_at' => 'datetime'
    ];

    /**
     * Check if user has role (optionally scoped to organization)
     * 
     * @param int $profile_id Profile ID from sta_profiles
     * @param string $role_id Role ID
     * @param string|null $organization_id Organization ID (null = group-level only)
     * @return bool
     */
    public static function userHasRole($profile_id, $role_id, $organization_id = null)
    {
        global $wpdb;

        if ($organization_id === null) {
            // Check for group-level role only
            $count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}sta_user_roles 
                 WHERE profile_id = %d AND role_id = %s AND organization_id IS NULL",
                $profile_id,
                $role_id
            ));
        } else {
            // Check for org-specific role OR group-level role
            $count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}sta_user_roles 
                 WHERE profile_id = %d AND role_id = %s 
                 AND (organization_id = %s OR organization_id IS NULL)",
                $profile_id,
                $role_id,
                $organization_id
            ));
        }

        return $count > 0;
    }

    /**
     * Get users with specific role in an organization
     * 
     * @param string $role_id Role ID
     * @param string|null $organization_id Organization ID
     * @return array
     */
    public static function getUsersWithRole($role_id, $organization_id = null)
    {
        global $wpdb;

        if ($organization_id === null) {
            return $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}sta_user_roles 
                 WHERE role_id = %s AND organization_id IS NULL",
                $role_id
            ));
        } else {
            return $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}sta_user_roles 
                 WHERE role_id = %s AND organization_id = %s",
                $role_id,
                $organization_id
            ));
        }
    }

    /**
     * Get all role assignments for a profile
     * 
     * @param int $profile_id
     * @return array
     */
    public static function getRolesForProfile($profile_id)
    {
        global $wpdb;

        $query = "
            SELECT ur.*, r.name as role_name, r.slug as role_slug, o.name as organization_name
            FROM {$wpdb->prefix}sta_user_roles ur
            JOIN {$wpdb->prefix}sta_roles r ON ur.role_id = r.id
            LEFT JOIN {$wpdb->prefix}sta_organizations o ON ur.organization_id = o.id
            WHERE ur.profile_id = %d
            ORDER BY ur.is_primary_role DESC, o.name ASC
        ";

        return $wpdb->get_results($wpdb->prepare($query, $profile_id));
    }
}
