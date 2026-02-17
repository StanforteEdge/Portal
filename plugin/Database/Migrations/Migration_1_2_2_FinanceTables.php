<?php

namespace App\Database\Migrations;

class Migration_1_2_2_FinanceTables
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        // Payment Vouchers table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_payment_vouchers` (
            id CHAR(36) PRIMARY KEY,
            request_id CHAR(36) NOT NULL,
            voucher_number VARCHAR(20) UNIQUE,
            amount DECIMAL(15,2) NOT NULL,
            payment_method VARCHAR(50),
            payment_date DATE,
            payee_name VARCHAR(255),
            is_partial_payment BOOLEAN DEFAULT FALSE,
            payment_sequence INT DEFAULT 1,
            total_payment_count INT DEFAULT 1,
            funding_source VARCHAR(100),
            account_code VARCHAR(50),
            program_id CHAR(36),
            percentage DECIMAL(5,2),
            items_covered JSON,
            status VARCHAR(32) DEFAULT 'pending',
            prepared_by BIGINT UNSIGNED,
            approved_by BIGINT UNSIGNED,
            prepared_date DATE,
            approved_date DATE,
            created_by BIGINT UNSIGNED,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES {$wpdb->prefix}sta_request_instances(id) ON DELETE CASCADE,
            INDEX idx_request (request_id),
            INDEX idx_status (status),
            INDEX idx_voucher_number (voucher_number)
        ) $charset_collate;";
        dbDelta($sql);

        // Payment Voucher Items table (for item-specific funding tracking)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_payment_voucher_items` (
            id CHAR(36) PRIMARY KEY,
            payment_voucher_id CHAR(36) NOT NULL,
            request_item_id CHAR(36) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payment_voucher_id) REFERENCES {$wpdb->prefix}sta_finance_payment_vouchers(id) ON DELETE CASCADE,
            FOREIGN KEY (request_item_id) REFERENCES {$wpdb->prefix}sta_request_items(id) ON DELETE CASCADE,
            INDEX idx_pv (payment_voucher_id),
            INDEX idx_item (request_item_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Retirements table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_retirements` (
            id CHAR(36) PRIMARY KEY,
            request_id CHAR(36) NOT NULL,
            payment_voucher_id CHAR(36),
            retired_by BIGINT UNSIGNED NOT NULL,
            retired_date DATE NOT NULL,
            total_receipts_amount DECIMAL(15,2) NOT NULL,
            balance_returned DECIMAL(15,2) DEFAULT 0,
            status VARCHAR(32) DEFAULT 'pending',
            verified_by BIGINT UNSIGNED,
            verified_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES {$wpdb->prefix}sta_request_instances(id) ON DELETE CASCADE,
            FOREIGN KEY (payment_voucher_id) REFERENCES {$wpdb->prefix}sta_finance_payment_vouchers(id) ON DELETE SET NULL,
            INDEX idx_request (request_id),
            INDEX idx_pv (payment_voucher_id),
            INDEX idx_status (status)
        ) $charset_collate;";
        dbDelta($sql);

        // Retirement Receipts table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_retirement_receipts` (
            id CHAR(36) PRIMARY KEY,
            retirement_id CHAR(36) NOT NULL,
            file_id CHAR(36) NOT NULL,
            description VARCHAR(255),
            amount DECIMAL(15,2),
            receipt_date DATE,
            vendor_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (retirement_id) REFERENCES {$wpdb->prefix}sta_finance_retirements(id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES {$wpdb->prefix}sta_files(id) ON DELETE CASCADE,
            INDEX idx_retirement (retirement_id)
        ) $charset_collate;";
        dbDelta($sql);

        error_log('Stanforte Edge: Finance tables created with sta_finance_ prefix');
    }

    public static function down()
    {
        global $wpdb;

        $tables = [
            'sta_finance_retirement_receipts',
            'sta_finance_retirements',
            'sta_finance_payment_voucher_items',
            'sta_finance_payment_vouchers'
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}{$table}`");
        }
    }
}
