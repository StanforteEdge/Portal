<?php

namespace App\Database\Migrations;

class Migration_1_5_7_AddSlugAndHierarchicalToTaxonomies
{
    public static function up()
    {
        global $wpdb;

        $table_name = $wpdb->prefix . 'sta_taxonomies';

        // Add slug column if it doesn't exist
        if (!$wpdb->get_results("SHOW COLUMNS FROM `$table_name` LIKE 'slug'")) {
            $wpdb->query("ALTER TABLE `$table_name` ADD COLUMN `slug` VARCHAR(64) UNIQUE NOT NULL AFTER `name`");
        }

        // Add hierarchical column if it doesn't exist
        if (!$wpdb->get_results("SHOW COLUMNS FROM `$table_name` LIKE 'hierarchical'")) {
            $wpdb->query("ALTER TABLE `$table_name` ADD COLUMN `hierarchical` BOOLEAN DEFAULT FALSE AFTER `description`");
        }

        // Add is_system column if it doesn't exist
        if (!$wpdb->get_results("SHOW COLUMNS FROM `$table_name` LIKE 'is_system'")) {
            $wpdb->query("ALTER TABLE `$table_name` ADD COLUMN `is_system` BOOLEAN DEFAULT FALSE AFTER `hierarchical`");
        }
    }

    public static function down()
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'sta_taxonomies';

        // We generally don't drop columns in down() to prevent data loss during quick toggles,
        // but strictly speaking we should reverse the up().
        // For this environment, we'll leave them or comment out.
        // $wpdb->query("ALTER TABLE `$table_name` DROP COLUMN `slug`");
        // $wpdb->query("ALTER TABLE `$table_name` DROP COLUMN `hierarchical`");
        // $wpdb->query("ALTER TABLE `$table_name` DROP COLUMN `is_system`");
    }
}
