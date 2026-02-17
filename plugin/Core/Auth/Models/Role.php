<?php
namespace App\Core\Auth\Models;

use App\Utils\BaseModel;

class Role extends BaseModel
{
    protected $table = 'sta_roles';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'name',
        'slug',
        'description',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function create($data)
    {
        return $this->db->insert(
            $this->table,
            $data
        );
    }

    /**
     * Get permissions for this role
     */
    /**
     * Get permissions for this role
     */
    public function permissions()
    {
        global $wpdb;

        $query = "
            SELECT p.*
            FROM {$wpdb->prefix}sta_permissions p
            JOIN {$wpdb->prefix}sta_role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = %s
            ORDER BY p.name ASC
        ";

        return $wpdb->get_results($wpdb->prepare($query, $this->id));
    }

    /**
     * Get users with this role
     */
    public function users()
    {
        global $wpdb;

        $query = "
            SELECT u.*
            FROM {$wpdb->users} u
            JOIN {$wpdb->prefix}sta_profiles p ON u.ID = p.wp_user_id
            JOIN {$wpdb->prefix}sta_user_roles ur ON p.id = ur.profile_id
            WHERE ur.role_id = %s
            ORDER BY u.user_login ASC
        ";

        return $wpdb->get_results($wpdb->prepare($query, $this->id));
    }

    /**
     * Get all roles with user counts and permission counts
     * 
     * @return array List of roles with user_count and permission_count fields
     */
    public static function getAllWithUserCounts()
    {
        global $wpdb;

        $query = "
            SELECT 
                r.*,
                COUNT(DISTINCT ur.profile_id) as user_count,
                COUNT(DISTINCT rp.permission_id) as permission_count
            FROM {$wpdb->prefix}sta_roles r
            LEFT JOIN {$wpdb->prefix}sta_user_roles ur ON r.id = ur.role_id
            LEFT JOIN {$wpdb->prefix}sta_role_permissions rp ON r.id = rp.role_id
            GROUP BY r.id
            ORDER BY r.name ASC
        ";

        return $wpdb->get_results($query);
    }

    /**
     * Get role slugs for a user
     * 
     * @param int $user_id User ID
     * @return array List of role slugs
     */
    public static function getUserRoleSlugs($user_id)
    {
        global $wpdb;

        $query = "
            SELECT r.slug
            FROM {$wpdb->prefix}sta_roles r
            JOIN {$wpdb->prefix}sta_user_roles ur ON r.id = ur.role_id
            WHERE ur.profile_id = %s
            ORDER BY r.slug ASC
        ";

        return $wpdb->get_col($wpdb->prepare($query, $user_id));
    }

    /**
     * Get permissions for a role
     * 
     * @param string $role_id Role ID
     * @return array List of permission objects
     */
    public static function getPermissionsForRole($role_id)
    {
        global $wpdb;

        $query = "
            SELECT p.*
            FROM {$wpdb->prefix}sta_permissions p
            JOIN {$wpdb->prefix}sta_role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = %s
            ORDER BY p.name ASC
        ";

        return $wpdb->get_results($wpdb->prepare($query, $role_id));
    }

    /**
     * Check if a profile/user belongs to this role
     *
     * @param int $profile_id Profile ID
     * @return bool
     */
    public function hasUser($profile_id)
    {
        global $wpdb;

        $query = "
            SELECT COUNT(*)
            FROM {$wpdb->prefix}sta_user_roles
            WHERE role_id = %s AND profile_id = %d
        ";

        $count = (int) $wpdb->get_var($wpdb->prepare($query, $this->id, $profile_id));
        return $count > 0;
    }
}
