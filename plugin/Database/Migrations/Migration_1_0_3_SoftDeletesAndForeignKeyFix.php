<?php

namespace App\Database\Migrations;

class Migration_1_0_3_SoftDeletesAndForeignKeyFix
{
    public static function up()
    {
        global $wpdb;
        
        // Add deleted_at column to sta_profiles table for soft deletes
        $sql = "ALTER TABLE {$wpdb->prefix}sta_profiles ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL";
        $result = $wpdb->query($sql);
        
        if ($result !== false) {
            error_log('Stanforte Edge: Added deleted_at column to sta_profiles table');
        } else {
            error_log('Stanforte Edge: Failed to add deleted_at column to sta_profiles table');
        }
        
        // Fix foreign key constraint in leave requests table
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_leave_requests DROP FOREIGN KEY IF EXISTS sta_leave_requests_ibfk_1");
        $sql = "ALTER TABLE {$wpdb->prefix}sta_leave_requests ADD CONSTRAINT fk_leave_profile FOREIGN KEY (profile_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE CASCADE";
        $result = $wpdb->query($sql);
        
        if ($result !== false) {
            error_log('Stanforte Edge: Fixed foreign key constraint in sta_leave_requests table');
        } else {
            error_log('Stanforte Edge: Failed to fix foreign key constraint in sta_leave_requests table');
        }
    }
    
    public static function down()
    {
        global $wpdb;
        
        // Remove deleted_at column
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_profiles DROP COLUMN IF EXISTS deleted_at");
        
        // Revert foreign key constraint (this might fail if original constraint didn't exist)
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_leave_requests DROP FOREIGN KEY IF EXISTS fk_leave_profile");
    }
}
