<?php

namespace App\Database\Migrations;

class Migration_1_5_6_ChangeTaxonomyIdToInt
{
    public static function up()
    {
        global $wpdb;

        $tax_table = $wpdb->prefix . 'sta_taxonomies';
        $terms_table = $wpdb->prefix . 'sta_taxonomy_terms';
        $docs_table = $wpdb->prefix . 'sta_documents';
        $subs_table = $wpdb->prefix . 'sta_document_subscriptions';

        error_log('Running Migration 1.5.6: Change Taxonomy ID to INT');

        // 1. Remove Constraints (if any exist, though 1.0.5 didn't typically add strict FKs for these)
        // We'll proceed to clear invalid data

        // 2. Clear referencing columns (Set UUIDs to NULL or 0)
        // Adjust dependent columns first so we can modify them

        // sta_taxonomy_terms references taxonomy_id
        $wpdb->query("TRUNCATE TABLE $terms_table");

        // sta_documents references category_id (term id). 
        // Term IDs are also changing from UUID -> INT.
        // So we must clear category_id in documents or map them.
        // Assuming dev environment, we set to 0 or NULL.
        // But category_id is NOT NULL in schema. We must change it to allow NULL momentarily or empty int.
        // Let's Set to 0.
        $wpdb->query("UPDATE $docs_table SET category_id = 0");

        // sta_document_subscriptions
        $wpdb->query("UPDATE $subs_table SET category_id = NULL");

        // 3. Truncate Taxonomies
        $wpdb->query("TRUNCATE TABLE $tax_table");

        // 4. Modify Taxonomies Table
        $wpdb->query("ALTER TABLE $tax_table MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");

        // 5. Modify Terms Table
        $wpdb->query("ALTER TABLE $terms_table MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
        $wpdb->query("ALTER TABLE $terms_table MODIFY COLUMN taxonomy_id BIGINT UNSIGNED NOT NULL");
        $wpdb->query("ALTER TABLE $terms_table MODIFY COLUMN parent_id BIGINT UNSIGNED NULL");

        // 6. Modify Documents Table
        // category_id corresponds to a TERM id.
        $wpdb->query("ALTER TABLE $docs_table MODIFY COLUMN category_id BIGINT UNSIGNED NOT NULL DEFAULT 0");

        // 7. Modify Subscriptions Table
        $wpdb->query("ALTER TABLE $subs_table MODIFY COLUMN category_id BIGINT UNSIGNED NULL");

        // 8. Re-index if needed (Indices typically auto-adjust for type changes if simple, but we can verify)
        // 1.0.5 defined KEY idx_category_id (category_id). It should persist.

        // 9. Seed Default Taxonomies (Projects, Request Categories, Document Categories)
        // Since we truncated, let's re-seed "Document Categories" as ID 1 to match expected default behavior

        $wpdb->insert(
            $tax_table,
            [
                'name' => 'Document Categories',
                'slug' => 'document_categories',
                'feature' => 'documents',
                'description' => 'Document categorization system',
                'hierarchical' => 1,
                'is_system' => 1
            ]
        );
        $docCatId = $wpdb->insert_id;

        // Seed Request Categories
        $wpdb->insert(
            $tax_table,
            [
                'name' => 'Request Categories',
                'slug' => 'request_categories',
                'feature' => 'finance',
                'description' => 'Request categorization',
                'hierarchical' => 1,
                'is_system' => 1
            ]
        );

        // Seed Projects
        $wpdb->insert(
            $tax_table,
            [
                'name' => 'Projects',
                'slug' => 'projects',
                'feature' => 'finance',
                'description' => 'Projects list',
                'hierarchical' => 0,
                'is_system' => 1
            ]
        );

        // Seed Tags
        $wpdb->insert(
            $tax_table,
            [
                'name' => 'Tags',
                'slug' => 'tags',
                'feature' => 'general',
                'description' => 'Global tags',
                'hierarchical' => 0,
                'is_system' => 1
            ]
        );

        error_log('Migration 1.5.6 completed successfully');
    }

    public static function down()
    {
        // Reversal requires converting back to UUID constraints (CHAR 36)
        // Data loss involved.
    }
}
