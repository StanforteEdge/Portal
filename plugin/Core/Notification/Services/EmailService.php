<?php
// EmailService.php

namespace App\Core\Notification\Services;

use App\Core\Notification\Models\Template;
use WP_Error;

class EmailService
{
    /**
     * Handle email notification with optional template rendering
     *
     * @param array $notificationData Must contain user_id, title/message or template
     * @return bool
     */
    public static function emailNotification($userIds, $notificationData)
    {

        error_log('Sending email notification to: ' . implode(', ', $userIds));
        // If a template name is provided and title/message are missing, render them now
        if (!empty($notificationData['template']) && (empty($notificationData['title']) || empty($notificationData['message']))) {
            error_log('Rendering template: ' . $notificationData['template']);
            $template = Template::getByName($notificationData['template'], 'email');
            error_log('Template found: ' . ($template ? 'yes' : 'no') . ' for template: ' . $notificationData['template']);
            if ($template) {
                $rendered = $template->render($notificationData['template_data'] ?? []);
                $notificationData['title'] = $notificationData['title'] ?? ($rendered['subject'] ?? '');
                $notificationData['message'] = $notificationData['message'] ?? ($rendered['body'] ?? '');
            }
        }
        // Final guard
        if (empty($notificationData['title']) || empty($notificationData['message'])) {
            throw new \Exception('Email notifications require title and message (or a valid template)');
        }

        foreach ($userIds as $userId) {
            error_log('Sending email to user: ' . $userId . ' with title: ' . $notificationData['title']);
            $notificationData['user_id'] = $userId;
            self::sendEmailNotification($notificationData);
        }

        return true;
    }

    /**
     * Send notification via email
     *
     * @param int $notificationId
     * @param array $notificationData
     * @return bool
     */
    private static function sendEmailNotification($notificationData)
    {
        error_log('Sending email to user: ' . $notificationData['user_id'] . ' with title: ' . $notificationData['title']);
        $user = get_user_by('id', $notificationData['user_id']);
        error_log('User found: ' . ($user ? 'yes' : 'no') . ' for user: ' . $notificationData['user_id']);
        if (!$user) {
            throw new \Exception('User not found');
        }

        $to = $user->user_email;
        $subject = $notificationData['title'];

        $template = self::renderEmailHtml($subject, $notificationData);
        if ($template === null) {
            error_log('Email template not found');
            // Fallback to plain text if template not found
            return self::sendPlainTextEmail($to, $subject, $notificationData);
        }

        return wp_mail($to, $subject, $template, self::getEmailHtmlHeaders());
    }

    /**
     * Render the HTML email content using the default template
     *
     * @param string $subject
     * @param array $notificationData
     * @return string|null Returns HTML string or null if template not found
     */
    private static function renderEmailHtml($subject, $notificationData)
    {

        error_log('Rendering email HTML with subject: ' . $subject);
        // Load HTML template
        $templatePath = SE_DIR . 'Core/Notification/Templates/default-email.html';
        if (!file_exists($templatePath)) {
            error_log('Email template not found at ' . $templatePath);
            return null;
        }

        $template = file_get_contents($templatePath);

        // Prepare template data
        $templateData = [
            'subject' => $subject,
            'content' => nl2br($notificationData['message']),
            'portal_url' => get_site_url(),
            'year' => date('Y'),
            'action_url' => $notificationData['link'] ?? null,
            'action_text' => 'View Details'
        ];

        // Replace template variables
        foreach ($templateData as $key => $value) {
            if ($key === 'action_url' && empty($value)) {
                // Handle conditional sections for action button
                $template = preg_replace('/{{#action_url}}.*?{{\/action_url}}/s', '', $template);
            } elseif ($key === 'action_url' && !empty($value)) {
                $template = preg_replace('/{{#action_url}}/', '', $template);
                $template = preg_replace('/{{\/action_url}}/', '', $template);
                $template = str_replace('{{action_url}}', $value, $template);
            } elseif ($key !== 'action_url') {
                $template = str_replace('{{' . $key . '}}', $value, $template);
            }
        }

        // Clean up any remaining template variables
        $template = preg_replace('/{{[^}]+}}/', '', $template);

        error_log('Email template rendered: ' . $template);

        return $template;
    }


    /**
     * Send plain text email as fallback
     *
     * @param string $to
     * @param string $subject
     * @param array $notificationData
     * @return bool
     */
    private static function sendPlainTextEmail($to, $subject, $notificationData)
    {
        error_log('Sending plain text email to: ' . $to . ' with subject: ' . $subject);
        $message = $notificationData['message'];

        if (!empty($notificationData['link'])) {
            $message .= "\n\nView: " . $notificationData['link'];
        }

        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            'From: Stanforte Edge <noreply@' . parse_url(get_site_url(), PHP_URL_HOST) . '>'
        ];

        error_log('Sending plain text email to ' . $to);

        return wp_mail($to, $subject, $message, $headers);
    }

    /**
     * Get standard HTML email headers
     *
     * @return array
     */
    private static function getEmailHtmlHeaders()
    {
        error_log('Getting email HTML headers');
        return [
            'Content-Type: text/html; charset=UTF-8',
            'From: Stanforte Edge <noreply@' . parse_url(get_site_url(), PHP_URL_HOST) . '>'
        ];
    }
}
