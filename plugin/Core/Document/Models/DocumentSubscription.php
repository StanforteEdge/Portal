<?php
namespace App\Core\Document\Models;

use App\Utils\BaseModel;

class DocumentSubscription extends BaseModel
{
    protected $table = 'sta_document_subscriptions';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'document_id',
        'category_id',
        'department_id',
        'user_id',
        'subscription_type',
        'notify_on_update',
        'notify_on_publish',
        'created_at'
    ];
    
    protected $casts = [
        'notify_on_update' => 'boolean',
        'notify_on_publish' => 'boolean',
        'created_at' => 'datetime'
    ];

    /**
     * Create a new document subscription
     * 
     * @param array $data Subscription data
     * @return int|false Insert ID or false on failure
     */
    public function create($data)
    {
        return $this->db->insert(
            $this->table,
            $data
        );
    }

    /**
     * Get subscription by ID
     * 
     * @param string $id Subscription ID
     * @return object|null Subscription object or null if not found
     */
    public function findById($id)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE id = %s",
                $id
            )
        );
    }

    /**
     * Get user's subscription for a specific document
     * 
     * @param string $document_id Document ID
     * @param int $user_id User ID
     * @return object|null Subscription object or null if not found
     */
    public function getUserDocumentSubscription($document_id, $user_id)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE document_id = %s AND user_id = %d AND subscription_type = 'document'",
                $document_id,
                $user_id
            )
        );
    }

    /**
     * Get user's subscription for a category
     * 
     * @param string $category_id Category ID
     * @param int $user_id User ID
     * @return object|null Subscription object or null if not found
     */
    public function getUserCategorySubscription($category_id, $user_id)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE category_id = %s AND user_id = %d AND subscription_type = 'category'",
                $category_id,
                $user_id
            )
        );
    }

    /**
     * Get user's subscription for a department
     * 
     * @param string $department_id Department ID
     * @param int $user_id User ID
     * @return object|null Subscription object or null if not found
     */
    public function getUserDepartmentSubscription($department_id, $user_id)
    {
        return $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE department_id = %s AND user_id = %d AND subscription_type = 'department'",
                $department_id,
                $user_id
            )
        );
    }

    /**
     * Get all subscriptions for a user
     * 
     * @param int $user_id User ID
     * @param string $subscription_type Optional filter by subscription type
     * @return array Array of subscription objects
     */
    public function getUserSubscriptions($user_id, $subscription_type = null)
    {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = %d";
        $params = [$user_id];

        if ($subscription_type) {
            $sql .= " AND subscription_type = %s";
            $params[] = $subscription_type;
        }

        $sql .= " ORDER BY created_at DESC";

        return $this->db->get_results(
            $this->db->prepare($sql, ...$params)
        );
    }

    /**
     * Get all subscribers for a document
     * 
     * @param string $document_id Document ID
     * @param string $notification_type Optional filter by notification type (update, publish)
     * @return array Array of user IDs
     */
    public function getDocumentSubscribers($document_id, $notification_type = null)
    {
        $sql = "SELECT DISTINCT user_id FROM {$this->table} WHERE document_id = %s";
        $params = [$document_id];

        if ($notification_type === 'update') {
            $sql .= " AND notify_on_update = 1";
        } elseif ($notification_type === 'publish') {
            $sql .= " AND notify_on_publish = 1";
        }

        $results = $this->db->get_results(
            $this->db->prepare($sql, ...$params)
        );

        return array_column($results, 'user_id');
    }

    /**
     * Get all subscribers for a category
     * 
     * @param string $category_id Category ID
     * @param string $notification_type Optional filter by notification type
     * @return array Array of user IDs
     */
    public function getCategorySubscribers($category_id, $notification_type = null)
    {
        $sql = "SELECT DISTINCT user_id FROM {$this->table} WHERE category_id = %s AND subscription_type = 'category'";
        $params = [$category_id];

        if ($notification_type === 'update') {
            $sql .= " AND notify_on_update = 1";
        } elseif ($notification_type === 'publish') {
            $sql .= " AND notify_on_publish = 1";
        }

        $results = $this->db->get_results(
            $this->db->prepare($sql, ...$params)
        );

        return array_column($results, 'user_id');
    }

    /**
     * Get all subscribers for a department
     * 
     * @param string $department_id Department ID
     * @param string $notification_type Optional filter by notification type
     * @return array Array of user IDs
     */
    public function getDepartmentSubscribers($department_id, $notification_type = null)
    {
        $sql = "SELECT DISTINCT user_id FROM {$this->table} WHERE department_id = %s AND subscription_type = 'department'";
        $params = [$department_id];

        if ($notification_type === 'update') {
            $sql .= " AND notify_on_update = 1";
        } elseif ($notification_type === 'publish') {
            $sql .= " AND notify_on_publish = 1";
        }

        $results = $this->db->get_results(
            $this->db->prepare($sql, ...$params)
        );

        return array_column($results, 'user_id');
    }

    /**
     * Update subscription by ID
     * 
     * @param string $id Subscription ID
     * @param array $data Update data
     * @return int|false Number of rows updated or false on failure
     */
    public function update($id, $data)
    {
        return $this->db->update(
            $this->table,
            $data,
            ['id' => $id],
            null,
            ['%s']
        );
    }

    /**
     * Delete subscription by ID
     * 
     * @param string $id Subscription ID
     * @return int|false Number of rows deleted or false on failure
     */
    public function delete($id)
    {
        return $this->db->delete(
            $this->table,
            ['id' => $id],
            ['%s']
        );
    }

    /**
     * Delete user's subscription for a document
     * 
     * @param string $document_id Document ID
     * @param int $user_id User ID
     * @return int|false Number of rows deleted or false on failure
     */
    public function deleteUserDocumentSubscription($document_id, $user_id)
    {
        return $this->db->delete(
            $this->table,
            [
                'document_id' => $document_id,
                'user_id' => $user_id,
                'subscription_type' => 'document'
            ],
            ['%s', '%d', '%s']
        );
    }

    /**
     * Check if user is subscribed to a document
     * 
     * @param string $document_id Document ID
     * @param int $user_id User ID
     * @return bool True if subscribed, false otherwise
     */
    public function isUserSubscribedToDocument($document_id, $user_id)
    {
        $count = $this->db->get_var(
            $this->db->prepare(
                "SELECT COUNT(*) FROM {$this->table} WHERE document_id = %s AND user_id = %d AND subscription_type = 'document'",
                $document_id,
                $user_id
            )
        );

        return $count > 0;
    }
}
