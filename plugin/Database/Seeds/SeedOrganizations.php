<?php

namespace App\Database\Seeds;

/**
 * Seed initial organizations based on Stanforte Group structure
 */
class SeedOrganizations
{
    private $wpdb;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    public function run()
    {
        error_log('Seeding initial organizations...');

        $table_name = $this->wpdb->prefix . 'sta_organizations';
        $now = current_time('mysql');

        $organizations = [
            [
                'id' => wp_generate_uuid4(),
                'name' => 'Stanforte Group',
                'code' => 'GROUP',
                'parent_organization_id' => null,
                'organization_type' => 'group',
                'is_active' => 1,
                'metadata' => json_encode([
                    'description' => 'Parent holding company for all Stanforte ventures',
                    'provides' => ['Shared Services', 'Group Functions']
                ]),
                'created_at' => $now,
                'updated_at' => $now
            ]
        ];

        // Insert parent org first
        $this->wpdb->insert($table_name, $organizations[0]);
        $group_id = $organizations[0]['id'];

        // Insert ventures
        $ventures = [
            [
                'id' => wp_generate_uuid4(),
                'name' => 'Project Enable Africa',
                'code' => 'PEA',
                'parent_organization_id' => $group_id,
                'organization_type' => 'venture',
                'is_active' => 1,
                'metadata' => json_encode([
                    'venture_lead' => 'Mike',
                    'focus' => 'Community Programs'
                ]),
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'LAFIAMI',
                'code' => 'LAF',
                'parent_organization_id' => $group_id,
                'organization_type' => 'venture',
                'is_active' => 1,
                'metadata' => json_encode([
                    'ceo' => 'Olusola Owonikoko',
                    'coo' => 'Tosin',
                    'focus' => 'Health & Wellbeing'
                ]),
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'Facity',
                'code' => 'FAC',
                'parent_organization_id' => $group_id,
                'organization_type' => 'venture',
                'is_active' => 1,
                'metadata' => json_encode([
                    'venture_lead' => 'Olusola Owonikoko',
                    'product_lead' => 'Dunsin',
                    'focus' => 'Product & Technology'
                ]),
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'Unclutter',
                'code' => 'UNC',
                'parent_organization_id' => $group_id,
                'organization_type' => 'venture',
                'is_active' => 1,
                'metadata' => json_encode([
                    'venture_lead' => 'Olalekan Owonikoko',
                    'focus' => 'Personal Productivity'
                ]),
                'created_at' => $now,
                'updated_at' => $now
            ]
        ];

        foreach ($ventures as $venture) {
            $this->wpdb->insert($table_name, $venture);
        }

        error_log('Seeded ' . (count($ventures) + 1) . ' organizations successfully');
    }
}
