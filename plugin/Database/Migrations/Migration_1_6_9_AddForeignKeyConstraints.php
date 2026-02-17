<?php

namespace App\Database\Migrations;

class Migration_1_6_9_AddForeignKeyConstraints
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.6.9: Adding foreign key constraints');

        // Check if constraints already exist before adding them
        $constraints = $wpdb->get_results("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                                         WHERE TABLE_SCHEMA = DATABASE() 
                                         AND TABLE_NAME = '{$wpdb->prefix}sta_request_instances'
                                         AND CONSTRAINT_TYPE = 'FOREIGN KEY'");

        $existingConstraints = array_column($constraints, 'CONSTRAINT_NAME');

        // Add foreign key constraint for created_by -> users
        if (!in_array('fk_request_instances_created_by', $existingConstraints)) {
            $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` 
                         ADD CONSTRAINT fk_request_instances_created_by 
                         FOREIGN KEY (created_by) REFERENCES {$wpdb->prefix}users(ID) 
                         ON DELETE CASCADE");
        }

        // Add foreign key constraint for team_id -> sta_groups (departments)
        if (!in_array('fk_request_instances_team_id', $existingConstraints)) {
            $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` 
                         ADD CONSTRAINT fk_request_instances_team_id 
                         FOREIGN KEY (team_id) REFERENCES {$wpdb->prefix}sta_groups(id) 
                         ON DELETE SET NULL");
        }

        // Verify the constraints were added
        $newConstraints = $wpdb->get_results("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                                            WHERE TABLE_SCHEMA = DATABASE() 
                                            AND TABLE_NAME = '{$wpdb->prefix}sta_request_instances'
                                            AND CONSTRAINT_TYPE = 'FOREIGN KEY'");

        error_log('Current foreign key constraints: ' . print_r(array_column($newConstraints, 'CONSTRAINT_NAME'), true));
        error_log('Migration 1.6.9 completed: Foreign key constraints added');
    }

    public static function down()
    {
        global $wpdb;

        error_log('Reverting Migration 1.6.9: Removing foreign key constraints');

        // Remove foreign key constraints
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` 
                     DROP FOREIGN KEY IF EXISTS fk_request_instances_created_by");
        $wpdb->query("ALTER TABLE `{$wpdb->prefix}sta_request_instances` 
                     DROP FOREIGN KEY IF EXISTS fk_request_instances_team_id");

        error_log('Migration 1.6.9 reverted: Foreign key constraints removed');
    }
}
