<?php
require_once 'stanforte-edge-core.php';
global $wpdb;

$tables = [
    'sta_organizations',
    'sta_profile_organizations',
    'sta_groups',
    'sta_group_users',
    'sta_profiles'
];

echo "Checking tables with prefix: {$wpdb->prefix}\n";

foreach ($tables as $table) {
    $full_name = $wpdb->prefix . $table;
    $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $full_name));
    echo "Table $full_name: " . ($exists ? "EXISTS" : "MISSING") . "\n";
}

$version = get_option('stanfort_edge_db_version');
echo "Current DB Version: $version\n";
