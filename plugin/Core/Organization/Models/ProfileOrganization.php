<?php

namespace App\Core\Organization\Models;

use App\Utils\BaseModel;

class ProfileOrganization extends BaseModel
{
    protected $table = 'sta_profile_organizations';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'profile_id',
        'organization_id',
        'is_primary',
        'start_date',
        'end_date',
        'created_at'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime'
    ];

    /**
     * Get organizations for a profile
     * 
     * @param int $profile_id
     * @return array
     */
    public static function getOrganizationsForProfile($profile_id)
    {
        global $wpdb;

        $query = "
            SELECT o.*, po.is_primary
            FROM {$wpdb->prefix}sta_organizations o
            JOIN {$wpdb->prefix}sta_profile_organizations po ON o.id = po.organization_id
            WHERE po.profile_id = %d
            AND (po.end_date IS NULL OR po.end_date > CURDATE())
            ORDER BY po.is_primary DESC, o.name ASC
        ";

        return $wpdb->get_results($wpdb->prepare($query, $profile_id));
    }

    /**
     * Get primary organization for a profile
     * 
     * @param int $profile_id
     * @return object|null
     */
    public static function getPrimaryOrganization($profile_id)
    {
        global $wpdb;

        $query = "
            SELECT o.*
            FROM {$wpdb->prefix}sta_organizations o
            JOIN {$wpdb->prefix}sta_profile_organizations po ON o.id = po.organization_id
            WHERE po.profile_id = %d
            AND po.is_primary = 1
            LIMIT 1
        ";

        return $wpdb->get_row($wpdb->prepare($query, $profile_id));
    }

    /**
     * Assign profile to organization
     * 
     * @param int $profile_id
     * @param string $organization_id
     * @param bool $is_primary
     * @return bool|int
     */
    public static function assign($profile_id, $organization_id, $is_primary = false)
    {
        global $wpdb;

        // If setting as primary, unset other primaries first
        if ($is_primary) {
            $wpdb->update(
                $wpdb->prefix . 'sta_profile_organizations',
                ['is_primary' => 0],
                ['profile_id' => $profile_id]
            );
        }

        $data = [
            'id' => wp_generate_uuid4(),
            'profile_id' => $profile_id,
            'organization_id' => $organization_id,
            'is_primary' => $is_primary ? 1 : 0,
            'start_date' => current_time('mysql', false),
            'created_at' => current_time('mysql')
        ];

        return $wpdb->insert($wpdb->prefix . 'sta_profile_organizations', $data);
    }
}
