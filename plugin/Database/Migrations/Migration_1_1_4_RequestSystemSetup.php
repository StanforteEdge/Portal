<?php

namespace App\Database\Migrations;

class Migration_1_1_4_RequestSystemSetup
{
    public static function up()
    {
        error_log('Stanforte Edge: Migration_1_1_4_RequestSystemSetup skipped (logic moved to Migration_1_2_1_RequestSystemTables).');
    }

    public static function down()
    {
        // Intentionally left blank. Rollbacks are handled by newer migrations.
    }
}
