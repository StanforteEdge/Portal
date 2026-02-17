<?php

namespace App\Database\Migrations;

class Migration_1_0_5_DocumentLibrarySetup
{
    public static function up()
    {
        global $wpdb;
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // 1. Core taxonomy registry (shared across features)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_taxonomies` (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(64) UNIQUE NOT NULL,
            feature VARCHAR(32) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) $charset_collate;";
        dbDelta($sql);
        
        // 2. Unified taxonomy terms (replaces document_categories)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_taxonomy_terms` (
            id CHAR(36) PRIMARY KEY,
            taxonomy_id CHAR(36) NOT NULL,
            name VARCHAR(64) NOT NULL,
            slug VARCHAR(64) NOT NULL,
            parent_id CHAR(36) NULL,
            taxonomy_type VARCHAR(20),
            metadata JSON,
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_taxonomy_slug (taxonomy_id, slug),
            KEY idx_taxonomy_id (taxonomy_id),
            KEY idx_parent_id (parent_id),
            KEY idx_taxonomy_type (taxonomy_type),
            KEY idx_slug (slug)
        ) $charset_collate;";
        dbDelta($sql);
        
        // 3. Document tags
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_document_tags` (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(64) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) $charset_collate;";
        dbDelta($sql);
        
        // 4. Documents table
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_documents` (
            id CHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            category_id CHAR(36) NOT NULL,
            department_id CHAR(36) NULL,
            summary TEXT,
            content LONGTEXT NOT NULL,
            content_type VARCHAR(20) NOT NULL DEFAULT 'wysiwyg',
            external_url TEXT,
            status VARCHAR(16) DEFAULT 'draft',
            version VARCHAR(20) DEFAULT '1.0.0',
            tags JSON,
            metadata JSON,
            created_by BIGINT UNSIGNED NOT NULL,
            reviewed_by BIGINT UNSIGNED NULL,
            published_by BIGINT UNSIGNED NULL,
            published_at TIMESTAMP NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_category_id (category_id),
            KEY idx_status (status),
            KEY idx_created_by (created_by),
            KEY idx_published_at (published_at),
            FULLTEXT KEY idx_content_search (title, summary, content)
        ) $charset_collate;";
        dbDelta($sql);
        
        // 5. Document attachments
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_document_attachments` (
            id CHAR(36) PRIMARY KEY,
            document_id CHAR(36) NOT NULL,
            file_id CHAR(36) NOT NULL,
            attachment_type VARCHAR(20) DEFAULT 'supporting',
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_document_id (document_id)
        ) $charset_collate;";
        dbDelta($sql);
        
        // 6. Document versions
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_document_versions` (
            id CHAR(36) PRIMARY KEY,
            document_id CHAR(36) NOT NULL,
            version VARCHAR(20) NOT NULL,
            content LONGTEXT NOT NULL,
            content_type VARCHAR(20) NOT NULL DEFAULT 'wysiwyg',
            external_url TEXT,
            change_notes TEXT,
            created_by BIGINT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_document_version (document_id, version),
            KEY idx_document_id (document_id)
        ) $charset_collate;";
        dbDelta($sql);
        
        // 7. Document subscriptions (integrates with core notification system)
        $sql = "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}sta_document_subscriptions` (
            id CHAR(36) PRIMARY KEY,
            document_id CHAR(36) NULL,
            category_id CHAR(36) NULL,
            department_id CHAR(36) NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            subscription_type VARCHAR(20) NOT NULL DEFAULT 'document',
            notify_on_update BOOLEAN DEFAULT FALSE,
            notify_on_publish BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_subscription (document_id, category_id, department_id, user_id),
            KEY idx_user_id (user_id),
            KEY idx_document_id (document_id),
            KEY idx_category_id (category_id),
            KEY idx_subscription_type (subscription_type)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Add Document Library permissions
        self::addDocumentPermissions();
        
        // Seed initial taxonomy data
        self::seedTaxonomyData();
    }
    
    public static function down()
    {
        global $wpdb;
        
        // Drop tables in reverse order (respecting foreign key dependencies)
        $tables = [
            'sta_document_subscriptions',
            'sta_document_versions', 
            'sta_document_attachments',
            'sta_documents',
            'sta_document_tags',
            'sta_taxonomy_terms',
            'sta_taxonomies'
        ];
        
        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$wpdb->prefix}{$table}`");
        }
    }
    
    private static function addDocumentPermissions()
    {
        global $wpdb;
        
        $permissions = [
            [
                'id' => wp_generate_uuid4(),
                'name' => 'view_documents',
                'description' => 'View published documents'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'create_documents',
                'description' => 'Create new documents'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'edit_documents',
                'description' => 'Edit existing documents'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'publish_documents',
                'description' => 'Publish and approve documents'
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'manage_taxonomies',
                'description' => 'Manage taxonomy terms and categories'
            ]
        ];
        
        foreach ($permissions as $permission) {
            $wpdb->insert(
                $wpdb->prefix . 'sta_permissions',
                $permission,
                ['%s', '%s', '%s']
            );
        }
    }
    
    private static function seedTaxonomyData()
    {
        global $wpdb;
        
        // Register document categories taxonomy
        $taxonomy_id = wp_generate_uuid4();
        $wpdb->insert(
            $wpdb->prefix . 'sta_taxonomies',
            [
                'id' => $taxonomy_id,
                'name' => 'document_categories',
                'feature' => 'documents',
                'description' => 'Document categorization and organization system'
            ],
            ['%s', '%s', '%s', '%s']
        );
        
        // Seed basic taxonomy terms
        $terms = [
            // Document Types
            ['name' => 'HR Policies', 'slug' => 'hr-policies', 'taxonomy_type' => 'document_type', 'sort_order' => 1],
            ['name' => 'IT Procedures', 'slug' => 'it-procedures', 'taxonomy_type' => 'document_type', 'sort_order' => 2],
            ['name' => 'Finance Templates', 'slug' => 'finance-templates', 'taxonomy_type' => 'document_type', 'sort_order' => 3],
            ['name' => 'Standard Operating Procedures', 'slug' => 'sop', 'taxonomy_type' => 'document_type', 'sort_order' => 4],
            ['name' => 'Employee Handbooks', 'slug' => 'handbooks', 'taxonomy_type' => 'document_type', 'sort_order' => 5],
            
            // Team Categories
            ['name' => 'Engineering Team', 'slug' => 'engineering-team', 'taxonomy_type' => 'team', 'sort_order' => 10],
            ['name' => 'Marketing Team', 'slug' => 'marketing-team', 'taxonomy_type' => 'team', 'sort_order' => 11],
            ['name' => 'Sales Team', 'slug' => 'sales-team', 'taxonomy_type' => 'team', 'sort_order' => 12],
            ['name' => 'Operations Team', 'slug' => 'operations-team', 'taxonomy_type' => 'team', 'sort_order' => 13],
            
            // Department Categories
            ['name' => 'Human Resources', 'slug' => 'hr-department', 'taxonomy_type' => 'department', 'sort_order' => 20],
            ['name' => 'Information Technology', 'slug' => 'it-department', 'taxonomy_type' => 'department', 'sort_order' => 21],
            ['name' => 'Finance & Accounting', 'slug' => 'finance-department', 'taxonomy_type' => 'department', 'sort_order' => 22],
            ['name' => 'Legal & Compliance', 'slug' => 'legal-department', 'taxonomy_type' => 'department', 'sort_order' => 23]
        ];
        
        foreach ($terms as $term) {
            $wpdb->insert(
                $wpdb->prefix . 'sta_taxonomy_terms',
                [
                    'id' => wp_generate_uuid4(),
                    'taxonomy_id' => $taxonomy_id,
                    'name' => $term['name'],
                    'slug' => $term['slug'],
                    'taxonomy_type' => $term['taxonomy_type'],
                    'sort_order' => $term['sort_order']
                ],
                ['%s', '%s', '%s', '%s', '%s', '%d']
            );
        }
        
        // Seed basic document tags
        $tags = ['policy', 'procedure', 'template', 'handbook', 'onboarding', 'compliance', 'security', 'training', 'reference', 'urgent'];
        
        foreach ($tags as $tag) {
            $wpdb->insert(
                $wpdb->prefix . 'sta_document_tags',
                [
                    'id' => wp_generate_uuid4(),
                    'name' => $tag
                ],
                ['%s', '%s']
            );
        }
    }
}
