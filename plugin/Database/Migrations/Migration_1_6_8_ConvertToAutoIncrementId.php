<?php

namespace App\Database\Migrations;

class Migration_1_6_8_ConvertToAutoIncrementId
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.6.8: Removing request_number field, using ID only');

        // Modify the existing table to use auto-increment ID and remove request_number
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` MODIFY id BIGINT UNSIGNED AUTO_INCREMENT");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` DROP COLUMN request_number");

        error_log('Migration 1.6.8 completed: Request instances now use ID only');
    }

    public static function down()
    {
        global $wpdb;

        error_log('Reverting Migration 1.6.8: Adding request_number field back');

        // Add back the request_number column
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` ADD COLUMN request_number INT NOT NULL");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` ADD UNIQUE KEY unique_request_number (request_type_id, request_number)");

        error_log('Migration 1.6.8 reverted: Request numbers restored');
    }
}
