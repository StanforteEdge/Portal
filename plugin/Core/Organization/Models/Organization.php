<?php

namespace App\Core\Organization\Models;

use App\Utils\BaseModel;

class Organization extends BaseModel
{
    protected $table = 'sta_organizations';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'name',
        'code',
        'parent_organization_id',
        'organization_type',
        'is_active',
        'metadata',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'metadata' => 'json',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get parent organization
     */
    public function parent()
    {
        if (!$this->parent_organization_id) {
            return null;
        }
        return $this->find($this->parent_organization_id);
    }

    /**
     * Get child organizations (ventures under this org)
     */
    public function children()
    {
        global $wpdb;

        $query = "
            SELECT *
            FROM {$wpdb->prefix}sta_organizations
            WHERE parent_organization_id = %s
            ORDER BY name ASC
        ";

        return $wpdb->get_results($wpdb->prepare($query, $this->id));
    }

    /**
     * Get all ventures (excluding group HQ)
     */
    public static function getVentures()
    {
        global $wpdb;

        return $wpdb->get_results("
            SELECT *
            FROM {$wpdb->prefix}sta_organizations
            WHERE organization_type = 'venture'
            AND is_active = 1
            ORDER BY name ASC
        ");
    }

    /**
     * Get group organization
     */
    public static function getGroup()
    {
        global $wpdb;

        return $wpdb->get_row("
            SELECT *
            FROM {$wpdb->prefix}sta_organizations
            WHERE organization_type = 'group'
            LIMIT 1
        ");
    }

    /**
     * Get profiles (users) in this organization
     */
    public function getProfiles()
    {
        global $wpdb;

        $query = "
            SELECT p.*
            FROM {$wpdb->prefix}sta_profiles p
            JOIN {$wpdb->prefix}sta_profile_organizations po ON p.id = po.profile_id
            WHERE po.organization_id = %s
            ORDER BY p.first_name, p.last_name
        ";

        return $wpdb->get_results($wpdb->prepare($query, $this->id));
    }
}
