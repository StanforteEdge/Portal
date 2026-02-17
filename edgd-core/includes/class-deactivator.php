<?php
/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    EDGD\Core
 */

namespace EDGD\Core;

class Deactivator {
    /**
     * Short Description. (use period)
     *
     * Long Description.
     *
     * @since    1.0.0
     */
    public static function deactivate() {
        // Clear any scheduled hooks
        self::clear_scheduled_hooks();
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Clear scheduled hooks
     */
    private static function clear_scheduled_hooks() {
        // Example: Clear any scheduled events
        $timestamp = wp_next_scheduled('edgd_daily_cleanup');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'edgd_daily_cleanup');
        }
        
        // Add more scheduled events to clear if needed
    }
}
