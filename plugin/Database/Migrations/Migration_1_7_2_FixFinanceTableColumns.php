<?php

namespace App\Database\Migrations;

class Migration_1_7_2_FixFinanceTableColumns
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.7.2: Fix finance table columns');

        $pvItems = "{$wpdb->prefix}sta_finance_payment_voucher_items";
        $receipts = "{$wpdb->prefix}sta_finance_retirement_receipts";

        // Add updated_at columns where missing
        $wpdb->query("ALTER TABLE `{$pvItems}` ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        $wpdb->query("ALTER TABLE `{$receipts}` ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

        error_log('Migration 1.7.2 completed: finance table columns fixed');
    }

    public static function down()
    {
        // No-op
        error_log('Migration 1.7.2 down: No action taken');
    }
}
