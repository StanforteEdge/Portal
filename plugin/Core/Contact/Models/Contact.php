<?php

namespace App\Core\Contact\Models;

use App\Utils\BaseModel;

/**
 * Contact Model
 * 
 * Generic contact system for storing contacts related to any entity
 * (employees, organizations, vendors, projects, clients, etc.)
 */
class Contact extends BaseModel
{
    /**
     * @var string Database table name without prefix
     */
    protected $table = 'sta_contacts';

    /**
     * @var string Primary key column name
     */
    protected $primaryKey = 'id';

    /**
     * @var array List of fillable fields
     */
    protected $fillable = [
        'entity_type',
        'entity_id',
        'contact_type',
        'name',
        'relationship',
        'phone',
        'email',
        'address',
        'is_primary',
        'metadata',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * @var bool Whether to use soft deletes
     */
    protected $softDeletes = true;

    /**
     * Get contacts for a specific entity
     * 
     * @param string $entityType Type of entity (employee, organization, vendor, etc.)
     * @param int $entityId ID of the entity
     * @param string|null $contactType Optional filter by contact type
     * @return array Array of contact objects
     */
    public function getContactsForEntity($entityType, $entityId, $contactType = null)
    {
        $this->where('entity_type', $entityType)
            ->where('entity_id', $entityId);

        if ($contactType) {
            $this->where('contact_type', $contactType);
        }

        return $this->orderBy('is_primary', 'DESC')
            ->orderBy('created_at', 'ASC')
            ->get();
    }

    /**
     * Get primary contact for an entity
     * 
     * @param string $entityType Type of entity
     * @param int $entityId ID of the entity
     * @param string|null $contactType Optional filter by contact type
     * @return object|null Primary contact or null
     */
    public function getPrimaryContact($entityType, $entityId, $contactType = null)
    {
        $this->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('is_primary', true);

        if ($contactType) {
            $this->where('contact_type', $contactType);
        }

        return $this->first();
    }

    /**
     * Set a contact as primary (unsets other primary contacts of same type)
     * 
     * @param int $contactId Contact ID to set as primary
     * @return bool Success status
     */
    public function setPrimary($contactId)
    {
        global $wpdb;

        // Get the contact to find its entity and type
        $contact = $this->find($contactId);
        if (!$contact) {
            return false;
        }

        // Unset all primary contacts for this entity and contact type
        $wpdb->update(
            $this->getTableName(),
            ['is_primary' => 0],
            [
                'entity_type' => $contact->entity_type,
                'entity_id' => $contact->entity_id,
                'contact_type' => $contact->contact_type
            ]
        );

        // Set this contact as primary
        return $this->update($contactId, ['is_primary' => true]);
    }

    /**
     * Get contacts by type across all entities
     * 
     * @param string $contactType Contact type to filter by
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Paginated results
     */
    public function getByType($contactType, $page = 1, $perPage = 20)
    {
        return $this->where('contact_type', $contactType)
            ->orderBy('created_at', 'DESC')
            ->paginate($perPage, $page);
    }

    /**
     * Search contacts by name, email, or phone
     * 
     * @param string $term Search term
     * @param array $columns Columns to search (defaults to name, email, phone)
     * @return $this
     */
    public function search($term, $columns = [])
    {
        if (empty($columns)) {
            $columns = ['name', 'email', 'phone'];
        }
        return parent::search($term, $columns);
    }

    /**
     * Delete all contacts for an entity
     * 
     * @param string $entityType Type of entity
     * @param int $entityId ID of the entity
     * @return bool Success status
     */
    public function deleteForEntity($entityType, $entityId)
    {
        global $wpdb;

        if ($this->softDeletes) {
            return $wpdb->update(
                $this->getTableName(),
                ['deleted_at' => current_time('mysql')],
                [
                    'entity_type' => $entityType,
                    'entity_id' => $entityId
                ]
            );
        } else {
            return $wpdb->delete(
                $this->getTableName(),
                [
                    'entity_type' => $entityType,
                    'entity_id' => $entityId
                ]
            );
        }
    }
}
