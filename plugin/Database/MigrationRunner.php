<?php

namespace App\Database;

class MigrationRunner
{
    private static $migrations_path = __DIR__ . '/Migrations/';

    public static function runMigrations()
    {
        $current_version = get_option('stanfort_edge_db_version', '1.0.4');
        $target_version = self::getTargetVersion();
        error_log('Stanforte Edge: Running migrations...');
        error_log('Current version: ' . $current_version);
        error_log('Target version: ' . $target_version);

        if (version_compare($current_version, $target_version, '<')) {
            // error_log('Running migrations...');
            $migrations = self::getPendingMigrations($current_version);

            foreach ($migrations as $migration) {
                error_log('Running migration: ' . $migration['version'] . ' - ' . $migration['name']);
                self::runMigration($migration);
                update_option('stanfort_edge_db_version', $migration['version']);
            }
        } else {
            error_log('No migrations to run');
        }

        error_log('Migrations completed successfully');
    }

    private static function getTargetVersion()
    {
        return '1.7.2'; // Fix finance table columns
    }

    private static function getPendingMigrations($current_version)
    {
        $migrations = [];
        $files = glob(self::$migrations_path . 'Migration_*.php');

        foreach ($files as $file) {
            $filename = basename($file, '.php');
            if (preg_match('/Migration_(\d+_\d+_\d+)_(.+)/', $filename, $matches)) {
                $version = str_replace('_', '.', $matches[1]);
                $migration_name = $matches[2];

                if (
                    version_compare($version, $current_version, '>') &&
                    !self::migrationExists($version, $migration_name)
                ) {
                    $migrations[] = [
                        'version' => $version,
                        'name' => $migration_name,
                        'class' => "App\\Database\\Migrations\\{$filename}"
                    ];
                }
            }
        }

        // Sort by version
        usort($migrations, function ($a, $b) {
            return version_compare($a['version'], $b['version']);
        });

        return $migrations;
    }

    private static function runMigration($migration)
    {
        $version_underscores = str_replace('.', '_', $migration['version']);
        $filename = "Migration_{$version_underscores}_{$migration['name']}.php";
        $filepath = self::$migrations_path . $filename;

        if (!file_exists($filepath)) {
            error_log("Stanforte Edge: Migration file not found: {$filepath}");
            return;
        }

        require_once $filepath;

        $class = $migration['class'];
        if (class_exists($class) && method_exists($class, 'up')) {
            $class::up();
            self::recordMigration($migration['version'], $migration['name']);
            error_log("Stanforte Edge: Executed migration {$migration['version']}_{$migration['name']}");
        }
    }

    private static function migrationExists($version, $migration_name)
    {
        global $wpdb;

        $result = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}sta_migrations WHERE version = %s AND migration_name = %s",
            $version,
            $migration_name
        ));

        return $result > 0;
    }

    private static function recordMigration($version, $migration_name)
    {
        global $wpdb;

        $wpdb->insert(
            "{$wpdb->prefix}sta_migrations",
            [
                'version' => $version,
                'migration_name' => $migration_name
            ],
            ['%s', '%s']
        );
    }
}
