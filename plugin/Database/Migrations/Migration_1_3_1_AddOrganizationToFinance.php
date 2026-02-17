<?php

namespace App\Database\Migrations;

class Migration_1_3_1_AddOrganizationToFinance
{
    public static function up()
    {
        global $wpdb;

        error_log('Running Migration 1.3.1: Add Organization to Finance Tables');

        // Add organization_id to payment vouchers
        $wpdb->query("
            ALTER TABLE {$wpdb->prefix}sta_finance_payment_vouchers
            ADD COLUMN IF NOT EXISTS organization_id CHAR(36) NULL AFTER request_id,
            ADD KEY idx_organization (organization_id),
            ADD CONSTRAINT fk_finance_pv_organization FOREIGN KEY (organization_id) 
                REFERENCES {$wpdb->prefix}sta_organizations(id) ON DELETE SET NULL
        ");

        // Add organization_id to retirements
        $wpdb->query("
            ALTER TABLE {$wpdb->prefix}sta_finance_retirements
            ADD COLUMN IF NOT EXISTS organization_id CHAR(36) NULL AFTER request_id,
            ADD KEY idx_organization (organization_id),
            ADD CONSTRAINT fk_finance_retirement_organization FOREIGN KEY (organization_id) 
                REFERENCES {$wpdb->prefix}sta_organizations(id) ON DELETE SET NULL
        ");

        error_log('Migration 1.3.1 completed: organization_id added to Finance tables');
    }

    public static function down()
    {
        global $wpdb;

        // Remove foreign keys and columns
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_finance_payment_vouchers DROP FOREIGN KEY fk_finance_pv_organization");
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_finance_payment_vouchers DROP COLUMN organization_id");

        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_finance_retirements DROP FOREIGN KEY fk_finance_retirement_organization");
        $wpdb->query("ALTER TABLE {$wpdb->prefix}sta_finance_retirements DROP COLUMN organization_id");
    }
}
