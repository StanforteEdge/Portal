<?php

namespace App\Database\Migrations;

/**
 * Migration 1.6.1: Add Description Column to Taxonomy Terms
 * 
 * Adds a description TEXT column to sta_taxonomy_terms table for better
 * term documentation and UI display.
 */

class Migration_1_6_1_AddDescriptionToTaxonomyTerms
{
    public static function up()
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'sta_taxonomy_terms';

        // Add description column if it doesn't exist
        $column_exists = $wpdb->get_results(
            $wpdb->prepare(
                "SHOW COLUMNS FROM `{$table_name}` LIKE %s",
                'description'
            )
        );

        if (empty($column_exists)) {
            $wpdb->query(
                "ALTER TABLE `{$table_name}` 
                ADD COLUMN `description` TEXT NULL 
                AFTER `slug`"
            );
            error_log('Migration 1.6.1: Added description column to sta_taxonomy_terms');
        } else {
            error_log('Migration 1.6.1: Description column already exists in sta_taxonomy_terms');
        }
    }

    public static function down()
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'sta_taxonomy_terms';

        // Remove description column
        $wpdb->query("ALTER TABLE `{$table_name}` DROP COLUMN IF EXISTS `description`");
        error_log('Migration 1.6.1: Removed description column from sta_taxonomy_terms');
    }
}
