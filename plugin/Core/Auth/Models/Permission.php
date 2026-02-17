<?php
namespace App\Core\Auth\Models;

use App\Utils\BaseModel;

class Permission extends BaseModel
{
    protected $table = 'sta_permissions';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'name',
        'slug',
        'module',
        'description',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get roles that have this permission
     */
    public function roles()
    {
        global $wpdb;

        $query = "
            SELECT r.*
            FROM {$wpdb->prefix}sta_roles r
            JOIN {$wpdb->prefix}sta_role_permissions rp ON r.id = rp.role_id
            WHERE rp.permission_id = %s
            ORDER BY r.name ASC
        ";

        return $wpdb->get_results($wpdb->prepare($query, $this->id));
    }

    /**
     * Get permission names for a user
     * 
     * @param int $profile_id Profile ID
     * @return array List of permission names
     */
    public static function getUserPermissionNames($profile_id)
    {
        global $wpdb;

        $query = "
            SELECT DISTINCT p.name
            FROM {$wpdb->prefix}sta_user_roles ur
            JOIN {$wpdb->prefix}sta_role_permissions rp ON ur.role_id = rp.role_id
            JOIN {$wpdb->prefix}sta_permissions p ON rp.permission_id = p.id
            WHERE ur.profile_id = %d
        ";

        return $wpdb->get_col($wpdb->prepare($query, $profile_id));
    }

    /**
     * Check if user has a specific permission
     * 
     * @param int $profile_id Profile ID
     * @param string $permission_name Permission name
     * @return bool True if user has permission
     */
    public static function userHasPermission($profile_id, $permission_name)
    {
        global $wpdb;

        $query = "
            SELECT COUNT(*) 
            FROM {$wpdb->prefix}sta_user_roles ur
            JOIN {$wpdb->prefix}sta_role_permissions rp ON ur.role_id = rp.role_id
            JOIN {$wpdb->prefix}sta_permissions p ON rp.permission_id = p.id
            WHERE ur.profile_id = %d AND p.name = %s
        ";

        $count = $wpdb->get_var($wpdb->prepare($query, $profile_id, $permission_name));

        return $count > 0;
    }
}
