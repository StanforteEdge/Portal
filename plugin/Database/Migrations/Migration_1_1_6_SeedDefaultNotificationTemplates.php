<?php

namespace App\Database\Migrations;

class Migration_1_1_6_SeedDefaultNotificationTemplates
{
    /**
     * Run the migration
     */
    public static function up()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $table_name = $wpdb->prefix . 'sta_templates';
        
        $templates = [
            [
                'id' => wp_generate_uuid4(),
                'name' => 'password_changed_user',
                'template_type' => 'email',
                'notification_type' => 'account',
                'subject' => 'Your password has been changed',
                'body' => "Hello {{user_name}},\n\nYour password for {{site_name}} has been successfully changed.\n\nIf you didn't make this change, please contact support immediately at {{support_email}}.\n\nFor your security, we recommend:\n- Using a strong, unique password\n- Enabling two-factor authentication if available\n- Regularly monitoring your account activity\n\nThanks,\nThe {{site_name}} Team",
                'description' => 'Sent to user after successful password change',
                'language' => 'en',
                'is_active' => 1
            ],
            [
                'id' => wp_generate_uuid4(),
                'name' => 'password_changed_admin',
                'template_type' => 'email',
                'notification_type' => 'security',
                'subject' => 'User password changed: {{user_name}}',
                'body' => "Hello Admin,\n\nThe password for user {{user_name}} ({{user_email}}) has been changed.\n\nChange details:\n- User ID: {{user_id}}\n- Change time: {{change_time}}\n- IP Address: {{ip_address}}\n\nPlease review the account activity for any suspicious behavior.\n\nRegards,\n{{site_name}} System",
                'description' => 'Sent to admin when a user changes their password',
                'language' => 'en',
                'is_active' => 1
            ]
        ];

        foreach ($templates as $template) {
            // Check if template already exists
            // $exists = $wpdb->get_var($wpdb->prepare(
            //     "SELECT COUNT(*) FROM {$table_name} WHERE name = %s",
            //     $template['name']
            // ));

            // if (!$exists) {
                $wpdb->insert(
                    $table_name,
                    $template,
                    ['%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d']
                );
            // }
        }
    }

    /**
     * Rollback the migration
     */
    public static function down()
    {
        // No need to delete templates on rollback as they will be removed
        // when the notification_templates table is dropped
    }
}
