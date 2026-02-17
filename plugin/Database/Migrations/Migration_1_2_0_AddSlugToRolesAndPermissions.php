<?php

namespace App\Database\Migrations;

class Migration_1_2_0_AddSlugToRolesAndPermissions
{
    public static function up()
    {
        global $wpdb;
        
        error_log('[Migration 1.2.0] Adding slug column to roles table');
        
        // Add slug to roles table
        $roles_table = $wpdb->prefix . 'sta_roles';
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM `{$roles_table}` LIKE 'slug'");
        
        if (empty($column_exists)) {
            $sql = "ALTER TABLE `{$roles_table}` 
                    ADD COLUMN `slug` VARCHAR(100) UNIQUE NULL AFTER `name`";
            $result = $wpdb->query($sql);
            
            if ($result === false) {
                error_log('[Migration 1.2.0] Failed to add slug to roles: ' . $wpdb->last_error);
                return false;
            }
            
            error_log('[Migration 1.2.0] Added slug column to roles table');
            
            // Generate slugs for existing roles
            $roles = $wpdb->get_results("SELECT id, name FROM `{$roles_table}`");
            foreach ($roles as $role) {
                $slug = self::generateSlug($role->name);
                $wpdb->update(
                    $roles_table,
                    ['slug' => $slug],
                    ['id' => $role->id]
                );
            }
            
            error_log('[Migration 1.2.0] Generated slugs for ' . count($roles) . ' existing roles');
        } else {
            error_log('[Migration 1.2.0] Slug column already exists in roles table');
        }
        
        error_log('[Migration 1.2.0] Migration completed successfully');
        return true;
    }
    
    public static function down()
    {
        global $wpdb;
        
        error_log('[Migration 1.2.0] Rolling back: Removing slug column from roles');
        
        // Remove slug from roles
        $roles_table = $wpdb->prefix . 'sta_roles';
        $wpdb->query("ALTER TABLE `{$roles_table}` DROP COLUMN IF EXISTS `slug`");
        
        error_log('[Migration 1.2.0] Rollback completed');
        return true;
    }
    
    /**
     * Generate a slug from a name
     */
    private static function generateSlug($name)
    {
        $slug = strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '_', $slug);
        $slug = trim($slug, '_');
        return $slug;
    }
}
