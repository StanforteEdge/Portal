<?php
// Define WordPress constants to satisfy dependencies if needed
define('ABSPATH', '/Users/olalekan/Projects/stanforteedge/portal/');
define('SE_DIR', '/Users/olalekan/Projects/stanforteedge/portal/plugin/');

// Mock WordPress functions
function get_option($key, $default)
{
    // In a real scenario, this would check the DB. 
    // consistently returning '1.0.4' or similar would force migration logic to check file versions.
    // Let's assume the DB version is lower than 1.2.2 to trigger the compare.
    return '1.2.1';
}

function update_option($key, $value)
{
    echo "Updating option $key to $value\n";
}

function version_compare($v1, $v2, $op)
{
    return \version_compare($v1, $v2, $op);
}

function error_log($message)
{
    echo $message . "\n";
}

// Mock wpdb class
class MockWPDB
{
    public $prefix = 'wp_';

    public function get_charset_collate()
    {
        return "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    }

    public function get_var($query)
    {
        // Return 0 to simulate migration not existing yet with "migrationExists" check
        if (strpos($query, "SELECT COUNT(*)") !== false) {
            return 0;
        }
        return null;
    }

    public function prepare($query, ...$args)
    {
        return vsprintf(str_replace('%s', "'%s'", $query), $args);
    }

    public function insert($table, $data, $format)
    {
        echo "Inserting into $table: " . json_encode($data) . "\n";
    }

    public function query($sql)
    {
        echo "Executing SQL: " . substr($sql, 0, 100) . "...\n";
        return true;
    }
}

global $wpdb;
$wpdb = new MockWPDB();

function dbDelta($sql)
{
    echo "Running dbDelta: " . substr($sql, 0, 100) . "...\n";
}

// Load the runner
require_once '/Users/olalekan/Projects/stanforteedge/portal/plugin/Database/MigrationRunner.php';

// Run it
App\Database\MigrationRunner::runMigrations();
