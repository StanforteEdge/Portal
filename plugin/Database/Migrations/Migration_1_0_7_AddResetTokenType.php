<?php

namespace App\Database\Migrations;

class Migration_1_0_7_AddResetTokenType
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $table = $wpdb->prefix . 'sta_tokens';
        $wpdb->query("ALTER TABLE $table MODIFY COLUMN type ENUM('access', 'refresh', 'reset') NOT NULL");
    }
    
    public static function down()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_tokens';
        $wpdb->query("ALTER TABLE $table MODIFY COLUMN type ENUM('access', 'refresh') NOT NULL");
    }
}
