<?php
namespace App\Core\Auth\Services;

use \WP_Error;
use function get_user_meta;
use App\Core\Auth\Models\Token;
use App\Core\Notification\Services\NotificationService;
use function wp_generate_password;
use function wp_set_password;
use function current_time;
use function get_site_url;

class AuthService
{
    private $jwtSecret;

    public function __construct($jwtSecret = null)
    {
        $this->jwtSecret = $jwtSecret ?: wp_salt('auth');
    }

    public function login($username, $password)
    {
        $creds = [
            'user_login' => $username,
            'user_password' => $password,
            'remember' => true
        ];
        
        $user = wp_signon($creds, false);
        
        if (is_wp_error($user)) {
            return false;
        }
        
        // Update last login time
        update_user_meta($user->ID, 'last_login', current_time('mysql'));
        
        return [
            'user_id' => $user->ID,
            'username' => $user->user_login,
            'roles' => $user->roles
        ];
    }

    /**
     * WordPress handles password hashing internally
     * These methods are kept for compatibility but use WordPress functions
     */
    public function hashPassword($password)
    {
        return wp_hash_password($password);
    }

    public function verifyPassword($password, $hash)
    {
        return wp_check_password($password, $hash);
    }

    /**
     * Generate a nonce for authentication
     * 
     * @param array $user User data
     * @return string Nonce
     */
    public function generateAuthToken($user_id)
    {
        return wp_create_nonce('wp_rest');
    }

    /**
     * Verify a nonce
     * 
     * @param string $nonce Nonce to verify
     * @return bool Whether the nonce is valid
     */
    public function verifyAuthToken($nonce)
    {
        return wp_verify_nonce($nonce, 'wp_rest');
    }

    /**
     * Authenticate a user with email and password
     *
     * @param string $email User's email address
     * @param string $password User's password
     * @return \WP_User Authenticated user object
     * @throws \InvalidArgumentException If email or password is empty
     * @throws \RuntimeException If authentication fails
     * @throws \DomainException If user is inactive
     */
    public static function authenticate(string $email, string $password): \WP_User
    {
        // Validate input
        if (empty($email) || empty($password)) {
            throw new \InvalidArgumentException('Email and password are required', 400);
        }
        
        // Use wp_authenticate for credential validation
        $user = wp_authenticate($email, $password);
        
        if (is_wp_error($user)) {
            $errorCode = $user->get_error_code();
            
            // Map WordPress authentication errors to appropriate exceptions
            if (in_array($errorCode, ['invalid_username', 'invalid_email', 'incorrect_password'])) {
                throw new \RuntimeException('Invalid email or password', 401);
            }
            
            // For other errors, include the original error message for logging
            throw new \RuntimeException(
                sprintf('Authentication failed: %s', $user->get_error_message()),
                401
            );
        }
        
        // Check if user is active
        if (!self::isUserActive($user->ID)) {
            throw new \DomainException('Your account is inactive. Please contact support.', 403);
        }
        
        // Update last login time
        update_user_meta($user->ID, 'last_login', current_time('mysql'));
        
        return $user;
    }

    /**
     * Check if a user is active by WordPress user ID
     * 
     * @param int $wpUserId
     * @return bool True if user is active, false otherwise
     */
    public static function isUserActive(int $wpUserId): bool
    {
        $status = get_user_meta($wpUserId, 'employment_status', true);
        return empty($status) || $status === 'active';
    }

    /**
     * Check if a user is active and throw an exception if not
     *
     * @param int $userId WordPress user ID
     * @return void
     * @throws \Exception If the user account is inactive
     */
    public static function assertUserActive(int $userId): void
    {
        if (!self::isUserActive($userId)) {
            throw new \Exception(
                'Your account is inactive or terminated. Please contact the administrator.',
                403
            );
        }
    }

    /**
     * Change password for a user with verification of current password
     *
     * @param int $userId
     * @param string $currentPassword
     * @param string $newPassword
     * @return true|WP_Error
     */
    /**
     * Change a user's password after verifying the current password
     *
     * @param int $userId The ID of the user
     * @param string $currentPassword The user's current password
     * @param string $newPassword The new password to set
     * @return void
     * @throws \InvalidArgumentException If any parameter is invalid
     * @throws \RuntimeException If the password change fails
     */
    public static function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        // Input validation
        if ($userId <= 0) {
            throw new \InvalidArgumentException('Invalid user ID', 400);
        }
        
        if (empty($currentPassword) || empty($newPassword)) {
            throw new \InvalidArgumentException('Current password and new password are required', 400);
        }
        
        // Verify user exists
        $user = get_user_by('id', $userId);
        if (!$user) {
            throw new \RuntimeException('User not found', 404);
        }
        
        // Verify current password
        if (!wp_check_password($currentPassword, $user->data->user_pass, $userId)) {
            throw new \RuntimeException('Current password is incorrect', 400);
        }
        
        // Set new password (this invalidates existing sessions)
        $result = wp_set_password($newPassword, $userId);
        
        if (is_wp_error($result)) {
            throw new \RuntimeException('Failed to update password: ' . $result->get_error_message(), 500);
        }
        
        try {
            // Send notifications
            $authService = new self();
            $authService->sendPasswordChangeNotifications($userId);
            
            // TODO: Audit log password change
        } catch (\Exception $e) {
            // Log the error but don't fail the request
            error_log('Password change notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Process forgot password request and send reset email
     * 
     * @param string $email User's email address
     * @return void
     * @throws \InvalidArgumentException If email is invalid
     * @throws \RuntimeException If unable to process the request
     */
    public static function forgotPassword(string $email): void
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Please provide a valid email address');
        }
        
        $user = get_user_by('email', $email);
        if (!$user) {
            // Don't reveal if user exists for security reasons
            return;
        }
        
        try {
            // Generate token and hash
            $token = wp_generate_password(32, false);
            $hash = hash('sha256', $token);
            
            // Store token in database
            $tokenModel = new Token();
            $expires = date('Y-m-d H:i:s', time() + 3600);
            
            $tokenModel->create([
                'id' => wp_generate_uuid4(),
                'user_id' => $user->ID,
                'type' => 'reset',
                'token_hash' => $hash,
                'expires_at' => $expires,
                'created_at' => current_time('mysql'),
            ]);
            
            // Generate reset URL
            $reset_url = get_site_url() . '/password-reset?token=' . $token;
            
            // Prepare email data
            $templateData = [
                'user_name' => $user->display_name ?: $user->user_login,
                'site_name' => get_bloginfo('name'),
                'reset_link' => $reset_url,
                'expiration_hours' => 1,
            ];

            // Send notification
            $result = NotificationService::sendNotification([
                'template' => 'password_reset',
                'user_id' => $user->ID,
                'type' => 'action',
                'channels' => ['email'],
                'link' => $reset_url
            ]);
            
            if (is_wp_error($result)) {
                error_log('Failed to send password reset email: ' . $result->get_error_message());
                // Don't expose the error to the user for security
                throw new \RuntimeException('Failed to process password reset request');
            }
            
        } catch (\Exception $e) {
            error_log('Error processing forgot password: ' . $e->getMessage());
            throw new \RuntimeException('Failed to process password reset request');
        }
    }

    /**
     * Reset user password using a valid reset token
     *
     * @param string $token The reset token
     * @param string $newPassword The new password
     * @return void
     * @throws \RuntimeException If token is invalid or expired
     * @throws \Exception For other unexpected errors
     */
    public static function resetPassword(string $token, string $newPassword): void
    {
        if (empty($token) || empty($newPassword)) {
            throw new \InvalidArgumentException('Token and new password are required');
        }

        $tokenModel = new Token();
        $hash = hash('sha256', $token);
        
        // Find valid reset token
        $row = $tokenModel->where('token_hash', $hash)
                         ->where('type', 'reset')
                         ->where('expires_at', '>', gmdate('Y-m-d H:i:s'))
                         ->first();
        
        if (!$row) {
            throw new \RuntimeException('Invalid or expired token');
        }
        
        try {
            // Set the new password
            wp_set_password($newPassword, $row->user_id);
            
            // Delete the used token
            $tokenModel->delete($row->id);
            
            // Log the password reset
            error_log(sprintf(
                'Password reset for user ID: %d',
                $row->user_id
            ));
            
        } catch (\Exception $e) {
            error_log('Password reset failed: ' . $e->getMessage());
            throw new \RuntimeException('Failed to reset password. Please try again.');
        }
    }

    /**
     * Send password change notifications to user and administrators
     *
     * @param int $userId
     * @return void
     */
    public static function sendPasswordChangeNotifications($userId)
    {
        $user = get_user_by('id', $userId);
        if (!$user) {
            return; // User not found, skip notifications
        }

        // Prepare common template data
        $changeTime = current_time('mysql');
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $siteName = get_bloginfo('name');
        $supportEmail = get_option('admin_email');

        // Send notification to the user
        $userTemplateData = [
            'user_name' => $user->display_name ?: $user->user_login,
            'site_name' => $siteName,
            'support_email' => $supportEmail,
            'change_time' => $changeTime,
        ];

        $userResult = NotificationService::sendTemplateNotification(
            'password_changed_user',
            $userTemplateData,
            $userId,
            'account',
            [
                'send_via' => ['email', 'in-app'],
                'link' => get_site_url() . '/profile' // Optional: link to profile
            ]
        );

        if (is_wp_error($userResult)) {
            error_log('Failed to send password change notification to user ' . $userId . ': ' . $userResult->get_error_message());
        }

        // Send notification to all administrators
        $admins = get_users(['role' => 'administrator']);
        $adminTemplateData = [
            'user_name' => $user->display_name ?: $user->user_login,
            'user_email' => $user->user_email,
            'user_id' => $userId,
            'site_name' => $siteName,
            'change_time' => $changeTime,
            'ip_address' => $ipAddress,
        ];

        foreach ($admins as $admin) {
            $adminResult = NotificationService::sendTemplateNotification(
                'password_changed_admin',
                $adminTemplateData,
                $admin->ID,
                'security',
                [
                    'send_via' => ['email', 'in-app']
                ]
            );

            if (is_wp_error($adminResult)) {
                error_log('Failed to send password change notification to admin ' . $admin->ID . ': ' . $adminResult->get_error_message());
            }
        }
    }

}
