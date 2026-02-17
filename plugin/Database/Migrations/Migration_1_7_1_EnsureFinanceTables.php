<?php

namespace App\Database\Migrations;

class Migration_1_7_1_EnsureFinanceTables
{
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();

        error_log('Running Migration 1.7.1: Ensure Finance tables exist');

        // Payment Vouchers table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_payment_vouchers` (
            id CHAR(36) PRIMARY KEY,
            request_id BIGINT UNSIGNED NOT NULL,
            organization_id CHAR(36) NULL,
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
            INDEX idx_request (request_id),
            INDEX idx_status (status),
            INDEX idx_voucher_number (voucher_number),
            INDEX idx_organization (organization_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Payment Voucher Items table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_payment_voucher_items` (
            id CHAR(36) PRIMARY KEY,
            payment_voucher_id CHAR(36) NOT NULL,
            request_item_id CHAR(36) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_pv (payment_voucher_id),
            INDEX idx_item (request_item_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Retirements table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_finance_retirements` (
            id CHAR(36) PRIMARY KEY,
            request_id BIGINT UNSIGNED NOT NULL,
            organization_id CHAR(36) NULL,
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
            INDEX idx_request (request_id),
            INDEX idx_pv (payment_voucher_id),
            INDEX idx_status (status),
            INDEX idx_organization (organization_id)
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
            INDEX idx_retirement (retirement_id)
        ) $charset_collate;";
        dbDelta($sql);

        error_log('Migration 1.7.1 completed: Finance tables ensured');
    }

    public static function down()
    {
        // No-op: core tables
        error_log('Migration 1.7.1 down: No action taken');
    }
}
