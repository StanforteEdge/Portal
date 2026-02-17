<?php

namespace App\Database\Migrations;

class Migration_1_6_0_HREmployeeDataAndContacts
{
    public static function up()
    {
        global $wpdb;

        // 1. Create sta_employee_data table
        self::createEmployeeDataTable($wpdb);

        // 2. Create sta_contacts table (generic contact system)
        self::createContactsTable($wpdb);

        error_log('HR Employee Data and Contacts tables created successfully');
    }

    private static function createEmployeeDataTable($wpdb)
    {
        $table_name = $wpdb->prefix . 'sta_employee_data';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS `$table_name` (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            profile_id BIGINT NOT NULL,
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            employment_type ENUM('staff', 'contract', 'intern', 'consultant', 'management') NOT NULL,
            position VARCHAR(100),
            department_id VARCHAR(36),
            manager_id BIGINT,
            join_date DATE,
            end_date DATE,
            employment_status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
            national_id VARCHAR(50),
            tax_id VARCHAR(50),
            pension_id VARCHAR(50),
            work_email VARCHAR(100),
            work_phone VARCHAR(20),
            probation_end_date DATE,
            contract_end_date DATE,
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            INDEX idx_profile_id (profile_id),
            INDEX idx_employee_id (employee_id),
            INDEX idx_employment_status (employment_status),
            INDEX idx_department_id (department_id),
            INDEX idx_manager_id (manager_id),
            FOREIGN KEY (profile_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (manager_id) REFERENCES {$wpdb->prefix}sta_profiles(id) ON DELETE SET NULL
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        error_log('Created sta_employee_data table');
    }

    private static function createContactsTable($wpdb)
    {
        $table_name = $wpdb->prefix . 'sta_contacts';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS `$table_name` (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            entity_type VARCHAR(50) NOT NULL,
            entity_id BIGINT NOT NULL,
            contact_type VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            relationship VARCHAR(50),
            phone VARCHAR(20),
            email VARCHAR(100),
            address TEXT,
            is_primary BOOLEAN DEFAULT FALSE,
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            INDEX idx_entity (entity_type, entity_id),
            INDEX idx_contact_type (contact_type),
            INDEX idx_is_primary (is_primary)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        error_log('Created sta_contacts table');
    }

    public static function down()
    {
        global $wpdb;

        // Drop tables in reverse order
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_employee_data");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}sta_contacts");

        error_log('Dropped HR Employee Data and Contacts tables');
    }
}
