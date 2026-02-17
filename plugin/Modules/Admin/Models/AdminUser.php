<?php
namespace App\Modules\Admin\Models;

use App\Core\User\Models\User;
use App\Utils\BaseModel;
use WP_Error;

/**
 * Admin User Model
 *
 * Extends the core User model with admin-specific functionality
 * for user management operations in the Admin Module.
 */
class AdminUser extends User
{
    /**
     * Get user with admin-specific fields
     *
     * @param int $id User ID
     * @return object|null User data with admin fields or null if not found
     */
    public function getWithAdminFields($id)
    {
        $user = $this->find($id);
        if (!$user) {
            return null;
        }

        // Add admin-specific computed fields
        $user->is_staff = ($user->type === 'staff');
        $user->employee_id = $user->is_staff ? $user->id : null;
        $user->teams = $this->getUserTeams($id);
        $user->primary_team = $this->getPrimaryTeam($id);
        $user->roles = $this->getUserRoles($id);

        return $user;
    }

    /**
     * Get user's teams
     *
     * @param int $userId User ID
     * @return array Array of team objects
     */
    public static function getUserTeams($userId)
    {
        global $wpdb;

        $sql = $wpdb->prepare("
            SELECT g.*, gu.role as user_role, gu.is_primary_team,
                   gu.joined_at, gu.added_by
            FROM {$wpdb->prefix}sta_groups g
            JOIN {$wpdb->prefix}sta_group_users gu ON g.id = gu.group_id
            WHERE gu.user_id = %d AND g.type = 'team' AND g.is_active = 1
            ORDER BY gu.is_primary_team DESC, gu.joined_at ASC
        ", $userId);

        return $wpdb->get_results($sql) ?: [];
    }

    /**
     * Get user's primary team
     *
     * @param int $userId User ID
     * @return object|null Primary team object or null
     */
    public static function getPrimaryTeam($userId)
    {
        global $wpdb;

        $sql = $wpdb->prepare("
            SELECT g.*, gu.role as user_role, gu.joined_at
            FROM {$wpdb->prefix}sta_groups g
            JOIN {$wpdb->prefix}sta_group_users gu ON g.id = gu.group_id
            WHERE gu.user_id = %d AND g.type = 'team' AND gu.is_primary_team = 1
            AND g.is_active = 1
            LIMIT 1
        ", $userId);

        return $wpdb->get_row($sql);
    }

    /**
     * Get user's roles
     *
     * @param int $userId User ID
     * @return array Array of role objects
     */
    public static function getUserRoles($userId)
    {
        global $wpdb;

        $sql = $wpdb->prepare("
            SELECT r.*, ur.assigned_at, ur.assigned_by
            FROM {$wpdb->prefix}sta_roles r
            JOIN {$wpdb->prefix}sta_user_roles ur ON r.id = ur.role_id
            WHERE ur.profile_id = %d AND r.is_active = 1
            ORDER BY ur.assigned_at ASC
        ", $userId);

        return $wpdb->get_results($sql) ?: [];
    }

    /**
     * Assign user to team
     *
     * @param int $userId User ID
     * @param int $teamId Team ID
     * @param string $role User role in team (member, lead, admin)
     * @param bool $isPrimary Whether this is the primary team
     * @param int $assignedBy ID of user making the assignment
     * @return bool Success status
     */
    public static function assignToTeam($userId, $teamId, $role = 'member', $isPrimary = false, $assignedBy = null)
    {
        global $wpdb;

        // If setting as primary team, remove existing primary team assignment
        if ($isPrimary) {
            $wpdb->update(
                $wpdb->prefix . 'sta_group_users',
                ['is_primary_team' => 0],
                ['user_id' => $userId],
                ['%d'],
                ['%d']
            );
        }

        // Check if user is already in this team
        $existing = $wpdb->get_row($wpdb->prepare("
            SELECT id FROM {$wpdb->prefix}sta_group_users
            WHERE user_id = %d AND group_id = %d
        ", $userId, $teamId));

        $data = [
            'role' => $role,
            'is_primary_team' => $isPrimary ? 1 : 0,
            'added_by' => $assignedBy
        ];

        if ($existing) {
            // Update existing assignment
            $result = $wpdb->update(
                $wpdb->prefix . 'sta_group_users',
                $data,
                ['id' => $existing->id],
                ['%s', '%d', '%d'],
                ['%d']
            );
        } else {
            // Create new assignment
            $data = array_merge($data, [
                'group_id' => $teamId,
                'user_id' => $userId,
                'joined_at' => current_time('mysql')
            ]);

            $result = $wpdb->insert(
                $wpdb->prefix . 'sta_group_users',
                $data,
                ['%d', '%d', '%s', '%d', '%s', '%d']
            );
        }

        return $result !== false;
    }

    /**
     * Remove user from team
     *
     * @param int $userId User ID
     * @param int $teamId Team ID
     * @return bool Success status
     */
    public static function removeFromTeam($userId, $teamId)
    {
        global $wpdb;

        $result = $wpdb->delete(
            $wpdb->prefix . 'sta_group_users',
            ['user_id' => $userId, 'group_id' => $teamId],
            ['%d', '%d']
        );

        return $result !== false;
    }

    /**
     * Search users with admin filters
     *
     * @param array $filters Search and filter parameters
     * @param array $order Order by parameters
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Paginated results
     */
    public static function searchWithAdminFilters($filters = [], $order = ['created_at' => 'desc'], $page = 1, $perPage = 15)
    {
        global $wpdb;

        // Build base query
        $sql = "SELECT DISTINCT u.* FROM {$wpdb->prefix}sta_profiles u";

        $whereConditions = [];
        $whereValues = [];

        // Optional role filtering (custom RBAC)
        $joinedRoles = false;
        if (isset($filters['role']) && $filters['role'] !== '' && $filters['role'] !== null) {
            // Join user_roles and roles tables
            $sql .= " LEFT JOIN {$wpdb->prefix}sta_user_roles ur ON u.id = ur.profile_id";
            $sql .= " LEFT JOIN {$wpdb->prefix}sta_roles r ON ur.role_id = r.id";
            $joinedRoles = true;

            // Support both numeric role id and string role name
            if (is_numeric($filters['role'])) {
                $whereConditions[] = "ur.role_id = %d";
                $whereValues[] = (int) $filters['role'];
            } else {
                $whereConditions[] = "(r.name = %s OR r.display_name = %s)";
                $whereValues[] = $filters['role'];
                $whereValues[] = $filters['role'];
            }
        }

        // Add admin-specific filters
        if (isset($filters['type'])) {
            $whereConditions[] = "u.type = %s";
            $whereValues[] = $filters['type'];
        }

        if (isset($filters['status'])) {
            $whereConditions[] = "u.status = %s";
            $whereValues[] = $filters['status'];
        }

        if (isset($filters['has_team'])) {
            if ($filters['has_team']) {
                $sql .= " LEFT JOIN {$wpdb->prefix}sta_group_users gu ON u.id = gu.user_id";
                $sql .= " LEFT JOIN {$wpdb->prefix}sta_groups g ON gu.group_id = g.id AND g.type = 'team' AND g.is_active = 1";
                $whereConditions[] = "g.id IS NOT NULL";
            }
        }

        if (isset($filters['team_id'])) {
            // Avoid alias collision if earlier join exists
            $sql .= " LEFT JOIN {$wpdb->prefix}sta_group_users gu2 ON u.id = gu2.user_id";
            $whereConditions[] = "gu2.group_id = %d";
            $whereValues[] = $filters['team_id'];
        }

        // Apply standard search filters
        if (isset($filters['search'])) {
            $searchTerm = $filters['search'];
            $whereConditions[] = "(u.username LIKE %s OR u.email LIKE %s OR u.first_name LIKE %s OR u.last_name LIKE %s)";
            $searchPattern = '%' . $wpdb->esc_like($searchTerm) . '%';
            $whereValues[] = $searchPattern;
            $whereValues[] = $searchPattern;
            $whereValues[] = $searchPattern;
            $whereValues[] = $searchPattern;
        }

        // Add WHERE clause if conditions exist
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(" AND ", $whereConditions);
        }

        // Add ORDER BY
        $orderBy = [];
        foreach ($order as $field => $direction) {
            $direction = strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC';
            $orderBy[] = "u.{$field} {$direction}";
        }
        if (!empty($orderBy)) {
            $sql .= " ORDER BY " . implode(", ", $orderBy);
        }

        // Get total count
        $countSql = preg_replace('/SELECT DISTINCT u\.\*/', 'SELECT COUNT(DISTINCT u.id)', $sql);
        $totalCount = $wpdb->get_var($wpdb->prepare($countSql, $whereValues));

        // Add LIMIT for pagination
        $offset = ($page - 1) * $perPage;
        $sql .= " LIMIT %d, %d";
        $whereValues[] = $offset;
        $whereValues[] = $perPage;

        // Execute query
        $results = $wpdb->get_results($wpdb->prepare($sql, $whereValues));

        return [
            'data' => $results ?: [],
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => (int) $totalCount,
                'total_pages' => ceil($totalCount / $perPage)
            ]
        ];
    }
}
