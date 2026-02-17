<?php

class CreateAttendanceTables {
    private $wpdb;
    private $charset_collate;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->charset_collate = $wpdb->get_charset_collate();
    }

    public function up() {
        $this->createAttendanceRecordsTable();
        $this->createTimeOffTable();
    }

    private function createAttendanceRecordsTable() {
        $table_name = $this->wpdb->prefix . 'attendance_records';
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            check_in datetime NOT NULL,
            check_out datetime DEFAULT NULL,
            work_mode varchar(20) NOT NULL DEFAULT 'office',
            status varchar(20) NOT NULL DEFAULT 'present',
            notes text,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY check_in (check_in),
            KEY status (status)
        ) {$this->charset_collate};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    private function createTimeOffTable() {
        $table_name = $this->wpdb->prefix . 'attendance_time_off';
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            type varchar(50) NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL,
            reason text NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            processed_by bigint(20) DEFAULT NULL,
            processed_at datetime DEFAULT NULL,
            notes text,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY status (status),
            KEY type (type),
            KEY start_date (start_date),
            KEY end_date (end_date)
        ) {$this->charset_collate};";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function down() {
        $tables = [
            $this->wpdb->prefix . 'attendance_records',
            $this->wpdb->prefix . 'attendance_time_off'
        ];

        foreach ($tables as $table) {
            $this->wpdb->query("DROP TABLE IF EXISTS $table");
        }
    }
}
