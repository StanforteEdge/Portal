<?php

namespace App\Core\Auth\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Core\Auth\Models\Token;
use WP_Error;

class JWTService
{
    private $secret;
    private $accessTokenExpiry = 36000; // 1 hour
    private $refreshTokenExpiry = 2592000; // 30 days

    public function __construct()
    {
        // Get or create a consistent JWT secret
        $jwt_secret = get_option('stanfort_edge_jwt_secret');
        if (!$jwt_secret) {
            $jwt_secret = wp_generate_password(64, true, true);
            update_option('stanfort_edge_jwt_secret', $jwt_secret);
        }

        $this->secret = wp_salt('auth') . $jwt_secret;
    }

    /**
     * Generate JWT access token
     */
    /**
     * Generate a JWT access token for the specified user
     *
     * @param int $user_id The WordPress user ID
     * @param array $additional_claims Additional claims to include in the token
     * @return string The generated JWT token
     * @throws \App\Core\Auth\Exceptions\TokenGenerationException If token generation fails
     */
    public function generateAccessToken($user_id, $additional_claims = []): string
    {


        try {

            $user = get_user_by('id', $user_id);
            if (!$user) {
                throw new \RuntimeException('User not found', 401);
            }
            // Get profile to access custom RBAC roles
            $userService = new \App\Core\User\Services\UserService();
            $profile = $userService::getProfileByWpUserId($user_id);
            $custom_roles = [];
            $profile_id = null;

            if ($profile) {
                $rbacService = new \App\Core\Auth\Services\RBACService();
                $profile_id = $profile->id;
                error_log('[JWTService] Fetching roles for profile_id: ' . $profile_id);
                $custom_roles = $rbacService->getUserRoles($profile_id);
                error_log('[JWTService] Roles fetched: ' . json_encode($custom_roles));
            } else {
                error_log('[JWTService] No profile found for user_id: ' . $user_id);
            }

            $token_id = wp_generate_uuid4();
            $issued_at = time();
            $expires_at = $issued_at + $this->accessTokenExpiry;

            $payload = array_merge([
                'iss' => get_bloginfo('url'),
                'aud' => get_bloginfo('url'),
                'iat' => $issued_at,
                'exp' => $issued_at + $this->accessTokenExpiry,
                'nbf' => $issued_at,
                'jti' => $token_id,
                'user_id' => $user_id,
                'profile_id' => $profile_id,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'roles' => $custom_roles
            ], $additional_claims);

            try {
                $token = JWT::encode($payload, $this->secret, 'HS256');
            } catch (\Exception $e) {
                throw new \RuntimeException('Failed to encode JWT token: ' . $e->getMessage());
            }

            // Ensure the token is a string and properly formatted
            if (!is_string($token) || empty($token)) {
                throw new \RuntimeException('Failed to generate token');
            }

            $token_hash = hash('sha256', $token);
        } catch (\Exception $e) {
            error_log('Token generation failed: ' . $e->getMessage());
            throw new \RuntimeException('Failed to generate token', 0, $e);
        }

        $token_hash = hash('sha256', $token);

        // Store token using unified model
        $tokenModel = new Token();
        $result = $tokenModel->storeToken(
            Token::TYPE_ACCESS,
            $user_id,
            $token_hash,
            gmdate('Y-m-d H:i:s', $expires_at),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $this->getClientIP(),
            $token_id
        );

        if (is_wp_error($result)) {
            error_log('[JWTService] Failed to store token: ' . $result->get_error_message());
            return $result;
        }

        // Return the full token with ID for reference
        return $token;
    }

    /**
     * Generate refresh token
     */
    public function generateRefreshToken($user_id)
    {
        $token_id = wp_generate_uuid4();
        $token = bin2hex(random_bytes(32));
        $token_hash = hash('sha256', $token);
        $expires_at = time() + $this->refreshTokenExpiry;

        $tokenModel = new Token();
        $tokenModel->storeToken(
            Token::TYPE_REFRESH,
            $user_id,
            $token_hash,
            gmdate('Y-m-d H:i:s', $expires_at),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $this->getClientIP(),
            $token_id
        );

        return $token_id . '.' . $token;
    }

    /**
     * Validate a JWT token and return its decoded payload
     *
     * @param string $token The JWT token to validate
     * @return object The decoded token payload
     * @throws \App\Core\Auth\Exceptions\InvalidTokenException If the token is invalid, expired, or revoked
     * @throws \RuntimeException For other validation errors
     */
    public function validateToken($token)
    {
        // Basic token validation
        if (empty($token) || !is_string($token)) {
            throw new \RuntimeException('Empty or invalid token');
        }

        // Check token format (basic JWT format check)
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \RuntimeException('Malformed token: Invalid format');
        }

        try {
            // Ensure we're using the correct key format
            $key = new Key($this->secret, 'HS256');
            $decoded = JWT::decode($token, $key);

            if (!$decoded) {
                throw new \RuntimeException('Invalid token: Empty payload');
            }

            // Additional validation of required claims
            $required_claims = ['iss', 'aud', 'iat', 'exp', 'user_id'];
            foreach ($required_claims as $claim) {
                if (!isset($decoded->$claim)) {
                    error_log("[JWTService] Missing required claim: $claim");
                    throw new \RuntimeException('Invalid token: Missing required claim');
                }
            }

            // Check if token exists in database
            $token_hash = hash('sha256', $token);
            $tokenModel = new Token();
            $db_token = $tokenModel->findByHashAndType($token_hash, Token::TYPE_ACCESS);

            if (!$db_token) {
                throw new \RuntimeException('Token not found');
            }

            // Check if token is expired
            if (strtotime($db_token->expires_at) <= time()) {
                throw new \RuntimeException('Token has expired');
            }

            // Check if token is revoked
            if ($db_token->revoked_at !== null) {
                throw new \RuntimeException('Token has been revoked');
            }

            return $decoded;
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            throw new \RuntimeException('Invalid token signature');
        } catch (\Firebase\JWT\ExpiredException $e) {
            throw new \RuntimeException('Token has expired');
        } catch (\UnexpectedValueException $e) {
            throw new \RuntimeException('Invalid token format');
        } catch (\Exception $e) {
            error_log('Token validation failed: ' . $e->getMessage());
            throw new \RuntimeException('Failed to validate token', 0, $e);
        }
    }

    /**
     * Refresh an access token using a refresh token
     *
     * @param string $refresh_token The refresh token string in format "token_id.token"
     * @return array Array containing new access and refresh tokens
     * @throws \App\Core\Auth\Exceptions\InvalidTokenException If the refresh token is invalid or expired
     * @throws \App\Core\Auth\Exceptions\TokenGenerationException If token generation fails
     * @throws \RuntimeException For other errors during token refresh
     */
    public function refreshToken($refresh_token): array
    {
        if (empty($refresh_token)) {
            throw new \RuntimeException('Refresh token is required');
        }

        // Split the refresh token into ID and token parts
        $parts = explode('.', $refresh_token, 2);
        if (count($parts) !== 2) {
            throw new \RuntimeException('Invalid refresh token format');
        }

        list($token_id, $token) = $parts;
        $token_hash = hash('sha256', $token);

        try {
            // Look up the refresh token
            $tokenModel = new Token();
            $refresh_token = $tokenModel->findByHashIdAndType($token_id, $token_hash, Token::TYPE_REFRESH);

            if (!$refresh_token || strtotime($refresh_token->expires_at) <= time()) {
                throw new \RuntimeException('Invalid or expired refresh token');
            }

            // Generate new access token
            $access_token = $this->generateAccessToken($refresh_token->user_id);

            // Delete the used refresh token
            $tokenModel->delete($refresh_token->id);

            // Generate a new refresh token
            $new_refresh_token = $this->generateRefreshToken($refresh_token->user_id);

            return [
                'access_token' => $access_token['token'],
                'refresh_token' => $new_refresh_token,
                'expires_in' => $this->accessTokenExpiry
            ];
        } catch (\Exception $e) {
            error_log('Token refresh failed: ' . $e->getMessage());
        } catch (\Exception $e) {
            // Re-throw token generation exceptions
            throw $e;
        } catch (\Exception $e) {
            error_log('Token refresh failed: ' . $e->getMessage());
            throw new \RuntimeException('Failed to refresh token', 0, $e);
        } {
            $tokenModel = new Token();
            return $tokenModel->cleanupExpired();
        }
    }

    /**
     * Get client IP address
     */
    private function getClientIP()
    {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];

        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}
