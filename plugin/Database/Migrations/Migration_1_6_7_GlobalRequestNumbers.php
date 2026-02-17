<?php

namespace App\Database\Migrations;

class Migration_1_6_7_GlobalRequestNumbers
{
    public static function up()
    {
        global $wpdb;
        
        error_log('Running Migration 1.6.7: Making request numbers globally unique');
        
        // Drop the old unique constraint that was per request_type
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` DROP INDEX unique_request_number");
        
        // Add new unique constraint for globally unique request numbers
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` ADD UNIQUE KEY unique_global_request_number (request_number)");
        
        // Also update module-specific tables if they exist
        $moduleTables = [
            'sta_finance_requests',
            'sta_hr_requests', 
            'sta_admin_requests'
        ];
        
        foreach ($moduleTables as $table) {
            $fullTable = $wpdb->prefix . $table;
            if ($wpdb->get_var("SHOW TABLES LIKE '$fullTable'") === $fullTable) {
                $wpdb->query("ALTER TABLE `$fullTable` DROP INDEX IF EXISTS unique_request_number");
                $wpdb->query("ALTER TABLE `$fullTable` ADD UNIQUE KEY unique_global_request_number (request_number)");
            }
        }
        
        error_log('Migration 1.6.7 completed: Request numbers are now globally unique');
    }

    public static function down()
    {
        global $wpdb;
        
        // Revert to per-request-type uniqueness
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` DROP INDEX unique_global_request_number");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` ADD UNIQUE KEY unique_request_number (request_type_id, request_number)");
        
        error_log('Migration 1.6.7 reverted: Request numbers back to per-type uniqueness');
    }
}