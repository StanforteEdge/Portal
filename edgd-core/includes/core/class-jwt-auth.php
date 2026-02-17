<?php
/**
 * JWT Authentication Handler
 *
 * @package    EDGD\Core
 * @since      1.0.0
 */

namespace EDGD\Core;

use Exception;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use WP_Error;
use WP_User;

/**
 * JWT Authentication Handler
 *
 * Handles JWT token generation, validation, and user authentication.
 *
 * @package EDGD\Core
 */
class JWT_Auth {
    /**
     * The single instance of the class.
     *
     * @var JWT_Auth
     */
    private static $instance = null;

    /**
     * The JWT secret key.
     *
     * @var string
     */
    private $secret_key;

    /**
     * The algorithm used to sign the token.
     *
     * @var string
     */
    private $algorithm = 'HS256';

    /**
     * Token expiration time in seconds.
     *
     * @var int
     */
    private $token_expiration = 3600; // 1 hour

    /**
     * Refresh token expiration time in seconds.
     *
     * @var int
     */
    private $refresh_token_expiration = 1209600; // 14 days

    /**
     * Get the singleton instance.
     *
     * @return JWT_Auth
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor.
     */
    private function __construct() {
        $this->secret_key = defined('JWT_AUTH_SECRET_KEY') 
            ? JWT_AUTH_SECRET_KEY 
            : get_option('edgd_jwt_secret_key');

        // Set token expiration from options
        $this->token_expiration = (int) get_option('edgd_jwt_expire', $this->token_expiration);
        $this->refresh_token_expiration = (int) get_option('edgd_jwt_refresh_expire', $this->refresh_token_expiration);
    }

    /**
     * Generate a JWT token for a user.
     *
     * @param WP_User $user User object.
     * @param string  $type Token type (access or refresh).
     * @return string|WP_Error
     */
    public function generate_token($user, $type = 'access') {
        if (!($user instanceof WP_User)) {
            return new WP_Error(
                'invalid_user',
                __('Invalid user.', 'edgd-core'),
                ['status' => 400]
            );
        }

        $issued_at = time();
        $expire = 'refresh' === $type 
            ? $issued_at + $this->refresh_token_expiration 
            : $issued_at + $this->token_expiration;

        $token_data = [
            'iss'  => get_bloginfo('url'),
            'iat'  => $issued_at,
            'exp'  => $expire,
            'nbf'  => $issued_at,
            'data' => [
                'user' => [
                    'id' => $user->ID,
                ],
            ],
        ];

        if ('refresh' === $type) {
            $token_data['data']['refresh'] = true;
        }

        try {
            return JWT::encode($token_data, $this->secret_key, $this->algorithm);
        } catch (Exception $e) {
            return new WP_Error(
                'jwt_error',
                $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Validate a JWT token.
     *
     * @param string $token JWT token.
     * @return object|WP_Error
     */
    public function validate_token($token) {
        try {
            $decoded = JWT::decode($token, new Key($this->secret_key, $this->algorithm));
            
            // Check if token is expired
            if (isset($decoded->exp) && $decoded->exp < time()) {
                return new WP_Error(
                    'jwt_auth_expired_token',
                    __('Token has expired.', 'edgd-core'),
                    ['status' => 401]
                );
            }

            // Check if token is valid
            if (!isset($decoded->data->user->id)) {
                return new WP_Error(
                    'jwt_auth_invalid_token',
                    __('Invalid token.', 'edgd-core'),
                    ['status' => 401]
                );
            }

            return $decoded;
        } catch (Exception $e) {
            return new WP_Error(
                'jwt_auth_invalid_token',
                $e->getMessage(),
                ['status' => 401]
            );
        }
    }

    /**
     * Authenticate a user with username/email and password.
     *
     * @param string $username Username or email.
     * @param string $password User password.
     * @return array|WP_Error
     */
    public function authenticate($username, $password) {
        // Try to authenticate the user
        $user = wp_authenticate($username, $password);

        if (is_wp_error($user)) {
            return new WP_Error(
                'invalid_credentials',
                __('Invalid username or password.', 'edgd-core'),
                ['status' => 401]
            );
        }

        // Generate tokens
        $access_token = $this->generate_token($user, 'access');
        $refresh_token = $this->generate_token($user, 'refresh');

        if (is_wp_error($access_token) || is_wp_error($refresh_token)) {
            return new WP_Error(
                'token_generation_failed',
                __('Could not generate authentication tokens.', 'edgd-core'),
                ['status' => 500]
            );
        }

        return [
            'access_token'  => $access_token,
            'refresh_token' => $refresh_token,
            'expires_in'    => $this->token_expiration,
            'user'          => [
                'id'        => $user->ID,
                'email'     => $user->user_email,
                'username'  => $user->user_login,
                'firstName' => $user->first_name,
                'lastName'  => $user->last_name,
                'roles'     => $user->roles,
            ],
        ];
    }

    /**
     * Refresh an access token using a refresh token.
     *
     * @param string $refresh_token Refresh token.
     * @return array|WP_Error
     */
    public function refresh_token($refresh_token) {
        $token = $this->validate_token($refresh_token);

        if (is_wp_error($token)) {
            return $token;
        }

        // Check if this is a refresh token
        if (!isset($token->data->refresh) || true !== $token->data->refresh) {
            return new WP_Error(
                'invalid_refresh_token',
                __('Invalid refresh token.', 'edgd-core'),
                ['status' => 401]
            );
        }

        // Get the user
        $user = get_user_by('id', $token->data->user->id);
        if (!$user) {
            return new WP_Error(
                'user_not_found',
                __('User not found.', 'edgd-core'),
                ['status' => 404]
            );
        }

        // Generate new tokens
        $access_token = $this->generate_token($user, 'access');
        $new_refresh_token = $this->generate_token($user, 'refresh');

        if (is_wp_error($access_token) || is_wp_error($new_refresh_token)) {
            return new WP_Error(
                'token_refresh_failed',
                __('Could not refresh tokens.', 'edgd-core'),
                ['status' => 500]
            );
        }

        return [
            'access_token'  => $access_token,
            'refresh_token' => $new_refresh_token,
            'expires_in'    => $this->token_expiration,
        ];
    }
}
