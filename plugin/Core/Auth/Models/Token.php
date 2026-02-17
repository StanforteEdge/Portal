<?php
namespace App\Core\Auth\Models;

use App\Utils\BaseModel;

class Token extends BaseModel
{
    protected $table = 'sta_tokens';
    
    protected $fillable = [
        'id',
        'user_id',
        'type',
        'token_hash',
        'expires_at',
        'user_agent',
        'ip_address',
        'last_used_at'
    ];

    const TYPE_ACCESS = 'access';
    const TYPE_REFRESH = 'refresh';
    const TYPE_RESET = 'reset';

    /**
     * Store new token
     */
    public function storeToken($type, $user_id, $token_hash, $expires_at, $user_agent = '', $ip_address = '', $token_id = null)
    {
        $data = [
            'type' => $type,
            'user_id' => $user_id,
            'token_hash' => $token_hash,
            'expires_at' => $expires_at,
            'user_agent' => $user_agent,
            'ip_address' => $ip_address
        ];

        if ($token_id) {
            $data['id'] = $token_id;
        }

        return $this->create($data);
    }

    /**
     * Find token by hash and type
     */
    public function findByHashAndType($token_hash, $type)
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Token::findByHashAndType - Token hash: ' . substr($token_hash, 0, 10) . '...');
            error_log('Token::findByHashAndType - Type: ' . $type);
        }
        
        $result = $this->where('token_hash', $token_hash)
                     ->where('type', $type)
                     ->first();
                     
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Token::findByHashAndType - Result: ' . print_r($result, true));
            error_log('Token::findByHashAndType - Last query: ' . $this->db->last_query);
        }
        
        return $result;
    }

    /**
     * Find valid token by hash and type (not expired)
     */
    public function findValidByHashAndType($token_hash, $type)
    {
        return $this->where('token_hash', $token_hash)
                   ->where('type', $type)
                   ->where('expires_at', '>', gmdate('Y-m-d H:i:s'))
                   ->first();
    }

    /**
     * Find valid refresh token by ID and hash
     */
    public function findValidRefreshToken($token_id, $token_hash)
    {
        return $this->where('id', $token_id)
                   ->where('token_hash', $token_hash)
                   ->where('type', self::TYPE_REFRESH)
                   ->where('expires_at', '>', gmdate('Y-m-d H:i:s'))
                   ->where('used_at', null)
                   ->first();
    }

    /**
     * Update last used timestamp
     */
    public function updateLastUsed($id)
    {
        return $this->update($id, [
            'last_used_at' => current_time('mysql')
        ]);
    }

    /**
     * Mark refresh token as used
     */
    public function markAsUsed($token_id)
    {
        return $this->update($token_id, [
            'used_at' => current_time('mysql')
        ]);
    }

    /**
     * Delete token by hash and type
     */
    public function deleteByHashAndType($token_hash, $type)
    {
        global $wpdb;
        return $wpdb->delete(
            $this->table,
            ['token_hash' => $token_hash, 'type' => $type],
            ['%s', '%s']
        );
    }

    /**
     * Delete all tokens for user by type
     */
    public function deleteByUserIdAndType($user_id, $type)
    {
        global $wpdb;
        return $wpdb->delete(
            $this->table,
            ['user_id' => $user_id, 'type' => $type],
            ['%d', '%s']
        );
    }

    /**
     * Delete all tokens for user (all types)
     */
    public function deleteByUserId($user_id)
    {
        return $this->deleteBy('user_id', $user_id);
    }

    /**
     * Clean up expired tokens
     */
    public function cleanupExpired()
    {
        global $wpdb;
        return $wpdb->query(
            "DELETE FROM {$this->table} WHERE expires_at < NOW()"
        );
    }
}
