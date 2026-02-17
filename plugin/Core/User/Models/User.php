<?php

namespace App\Core\User\Models;

use App\Utils\BaseModel;
use WP_Error;

/**
 * User model for general user profiles
 * 
 * This class handles all database operations for user profiles.
 * It extends BaseModel to leverage common CRUD operations.
 */
class User extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'sta_profiles';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';

    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'wp_user_id',
        'username',
        'email',
        'type',
        'status',
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'phone',
        'address',
        'nationality',
        'state',
        'lga',
        'marital_status',
        'avatar',
        'bio',
        'occupation',
        'last_login',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * @var bool Whether to use soft deletes
     */
    protected $softDeletes = true;

    /**
     * Find a profile by WordPress user ID
     * 
     * @param int $wpUserId WordPress user ID
     * @return object|null Profile data or null if not found
     */
    public function findByWpUserId(int $wpUserId)
    {
        return $this->where('wp_user_id', $wpUserId)->first();
    }

    /**
     * Find profile by username
     * 
     * @param string $username
     * @return object|null Profile data or null if not found
     */
    public function findByUsername(string $username)
    {
        return $this->where('username', $username)->first();
    }

    /**
     * Search users by term across multiple fields
     * 
     * @param string $term Search term
     * @param array $columns Fields to search in (defaults to username, email, first_name, last_name)
     * @return $this
     */
    public function search($term, $columns = null)
    {
        if ($columns === null) {
            $columns = ['username', 'email', 'first_name', 'last_name'];
        }

        return parent::search($term, $columns);
    }

    /**
     * Get all users with optional filters and pagination
     * 
     * @param array $filters Key-value pairs of filters
     * @param array $order Order by fields [field => 'asc'|'desc']
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Paginated results
     */
    public function getAll($filters = [], $order = ['id' => 'desc'], $page = 1, $perPage = 15)
    {
        foreach ($filters as $field => $value) {
            if ($field === 'search') {
                $this->search($value);
            } else {
                $this->where($field, $value);
            }
        }

        foreach ($order as $field => $direction) {
            $this->orderBy($field, $direction);
        }

        return $this->paginate($perPage, $page);
    }

    /**
     * Update last login timestamp
     * 
     * @param int $id Profile ID
     * @return bool Whether the update was successful
     */
    public function updateLastLogin(int $id)
    {
        return $this->update($id, [
            'last_login' => current_time('mysql')
        ]);
    }
}
