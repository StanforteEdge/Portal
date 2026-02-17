<?php /* Template Name: Staff: Admin - System Maintenance */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'System Maintenance';

include get_template_directory() . "/layout/menu.php";

// Get system information
$system_info = array(
    'php_version' => PHP_VERSION,
    'mysql_version' => $wpdb->db_version(),
    'wordpress_version' => get_bloginfo('version'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'operating_system' => PHP_OS,
    'max_upload_size' => ini_get('upload_max_filesize'),
    'max_post_size' => ini_get('post_max_size'),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time'),
);

// Get database tables information
$tables_info = $wpdb->get_results("
    SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        update_time
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name LIKE '{$wpdb->prefix}staff_%'
    ORDER BY table_name
");

// Get recent system logs
$system_logs = $wpdb->get_results("
    SELECT *
    FROM {$wpdb->prefix}staff_system_logs
    ORDER BY created_at DESC
    LIMIT 50
");
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
        <!-- BEGIN: System Information -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">System Information</h2>
                <div class="dropdown ml-auto">
                    <button class="dropdown-toggle btn px-2 box" aria-expanded="false">
                        <span class="w-5 h-5 flex items-center justify-center">
                            <i class="w-4 h-4" data-lucide="download"></i>
                        </span>
                    </button>
                    <div class="dropdown-menu w-40">
                        <ul class="dropdown-content">
                            <li>
                                <a href="" class="dropdown-item">
                                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export Info
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-12 gap-5">
                    <!-- System Details -->
                    <div class="col-span-12 xl:col-span-6">
                        <div class="box p-5">
                            <div class="flex items-center border-b border-slate-200/60 pb-5 mb-5">
                                <div class="font-medium text-base truncate">System Details</div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="table">
                                    <tbody>
                                        <tr>
                                            <td class="whitespace-nowrap">PHP Version</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['php_version']); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="whitespace-nowrap">MySQL Version</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['mysql_version']); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="whitespace-nowrap">WordPress Version</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['wordpress_version']); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="whitespace-nowrap">Server Software</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['server_software']); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="whitespace-nowrap">Operating System</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['operating_system']); ?></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Server Limits -->
                    <div class="col-span-12 xl:col-span-6">
                        <div class="box p-5">
                            <div class="flex items-center border-b border-slate-200/60 pb-5 mb-5">
                                <div class="font-medium text-base truncate">Server Limits</div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="table">
                                    <tbody>
                                        <tr>
                                            <td class="whitespace-nowrap">Max Upload Size</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['max_upload_size']); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="whitespace-nowrap">Max Post Size</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['max_post_size']); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="whitespace-nowrap">Memory Limit</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['memory_limit']); ?></td>
                                        </tr>
                                        <tr>
                                            <td class="whitespace-nowrap">Max Execution Time</td>
                                            <td class="whitespace-nowrap"><?php echo esc_html($system_info['max_execution_time']); ?> seconds</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: System Information -->
        
        <!-- BEGIN: Database Information -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Database Information</h2>
                <div class="flex">
                    <button class="btn btn-primary shadow-md mr-2" onclick="optimizeTables()">Optimize Tables</button>
                    <button class="btn btn-outline-secondary" onclick="backupDatabase()">Backup Database</button>
                </div>
            </div>
            <div class="p-5">
                <div class="overflow-x-auto">
                    <table class="table table-report">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Table Name</th>
                                <th class="text-center whitespace-nowrap">Rows</th>
                                <th class="text-center whitespace-nowrap">Data Size</th>
                                <th class="text-center whitespace-nowrap">Index Size</th>
                                <th class="text-center whitespace-nowrap">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($tables_info as $table): ?>
                            <tr class="intro-x">
                                <td><?php echo esc_html($table->table_name); ?></td>
                                <td class="text-center"><?php echo number_format($table->table_rows); ?></td>
                                <td class="text-center"><?php echo size_format($table->data_length); ?></td>
                                <td class="text-center"><?php echo size_format($table->index_length); ?></td>
                                <td class="text-center">
                                    <?php echo $table->update_time ? date('Y-m-d H:i:s', strtotime($table->update_time)) : 'N/A'; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <!-- END: Database Information -->
        
        <!-- BEGIN: System Logs -->
        <div class="intro-y box mt-5">
            <div class="flex items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">System Logs</h2>
                <div class="dropdown ml-auto">
                    <button class="dropdown-toggle btn px-2 box" aria-expanded="false">
                        <span class="w-5 h-5 flex items-center justify-center">
                            <i class="w-4 h-4" data-lucide="download"></i>
                        </span>
                    </button>
                    <div class="dropdown-menu w-40">
                        <ul class="dropdown-content">
                            <li>
                                <a href="" class="dropdown-item">
                                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export Logs
                                </a>
                            </li>
                            <li>
                                <a href="javascript:;" class="dropdown-item" onclick="clearLogs()">
                                    <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i> Clear Logs
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="p-5">
                <div class="overflow-x-auto">
                    <table class="table table-report">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Timestamp</th>
                                <th class="whitespace-nowrap">Level</th>
                                <th class="whitespace-nowrap">Message</th>
                                <th class="whitespace-nowrap">User</th>
                                <th class="whitespace-nowrap">IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($system_logs as $log): ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <?php echo date('Y-m-d H:i:s', strtotime($log->created_at)); ?>
                                </td>
                                <td>
                                    <div class="flex items-center justify-center whitespace-nowrap 
                                                <?php echo $log->level === 'error' ? 'text-danger' : 
                                                         ($log->level === 'warning' ? 'text-warning' : 'text-success'); ?>">
                                        <i data-lucide="alert-circle" class="w-4 h-4 mr-1"></i> 
                                        <?php echo ucfirst(esc_html($log->level)); ?>
                                    </div>
                                </td>
                                <td class="whitespace-nowrap"><?php echo esc_html($log->message); ?></td>
                                <td class="whitespace-nowrap"><?php echo esc_html($log->user); ?></td>
                                <td class="whitespace-nowrap"><?php echo esc_html($log->ip_address); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <!-- END: System Logs -->
    </div>
</div>

<script>
function optimizeTables() {
    if (confirm('Are you sure you want to optimize all database tables? This process may take some time.')) {
        // Add your optimization logic here
        alert('Database optimization started. This may take a few minutes.');
    }
}

function backupDatabase() {
    if (confirm('Are you sure you want to create a database backup?')) {
        // Add your backup logic here
        alert('Database backup process started.');
    }
}

function clearLogs() {
    if (confirm('Are you sure you want to clear all system logs? This action cannot be undone.')) {
        // Add your log clearing logic here
        alert('System logs have been cleared.');
    }
}
</script>

<?php get_footer(); ?>
