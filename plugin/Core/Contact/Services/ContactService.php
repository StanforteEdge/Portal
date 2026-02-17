<?php

namespace App\Core\Contact\Services;

use App\Core\Contact\Models\Contact;
use Exception;

/**
 * Contact Service
 * 
 * Business logic for managing contacts across different entity types
 */
class ContactService
{
    private $contactModel;

    public function __construct()
    {
        $this->contactModel = new Contact();
    }

    /**
     * Create a new contact
     * 
     * @param string $entityType Type of entity (employee, organization, vendor, etc.)
     * @param int $entityId ID of the entity
     * @param array $data Contact data
     * @return object Created contact
     * @throws Exception
     */
    public function createContact($entityType, $entityId, $data)
    {
        // Validate required fields
        if (empty($data['contact_type']) || empty($data['name'])) {
            throw new Exception('Contact type and name are required');
        }

        // Prepare contact data
        $contactData = [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'contact_type' => $data['contact_type'],
            'name' => $data['name'],
            'relationship' => $data['relationship'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'is_primary' => $data['is_primary'] ?? false,
            'metadata' => isset($data['metadata']) ? json_encode($data['metadata']) : null,
        ];

        // If setting as primary, unset other primary contacts
        if ($contactData['is_primary']) {
            $this->unsetPrimaryContacts($entityType, $entityId, $data['contact_type']);
        }

        // Create contact
        $contactId = $this->contactModel->create($contactData);
        if (!$contactId) {
            throw new Exception('Failed to create contact');
        }

        return $this->contactModel->find($contactId);
    }

    /**
     * Get contacts for an entity
     * 
     * @param string $entityType Type of entity
     * @param int $entityId ID of the entity
     * @param string|null $contactType Optional filter by contact type
     * @return array Array of contacts
     */
    public function getContactsForEntity($entityType, $entityId, $contactType = null)
    {
        return $this->contactModel->getContactsForEntity($entityType, $entityId, $contactType);
    }

    /**
     * Get a single contact by ID
     * 
     * @param int $contactId Contact ID
     * @return object|null Contact object or null
     */
    public function getContact($contactId)
    {
        return $this->contactModel->find($contactId);
    }

    /**
     * Update a contact
     * 
     * @param int $contactId Contact ID
     * @param array $data Updated contact data
     * @return object Updated contact
     * @throws Exception
     */
    public function updateContact($contactId, $data)
    {
        $contact = $this->contactModel->find($contactId);
        if (!$contact) {
            throw new Exception('Contact not found');
        }

        // Prepare update data
        $updateData = [];
        $allowedFields = ['contact_type', 'name', 'relationship', 'phone', 'email', 'address', 'is_primary', 'metadata'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'metadata') {
                    $updateData[$field] = json_encode($data[$field]);
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }

        // If setting as primary, unset other primary contacts
        if (isset($data['is_primary']) && $data['is_primary']) {
            $this->unsetPrimaryContacts($contact->entity_type, $contact->entity_id, $contact->contact_type);
        }

        // Update contact
        $success = $this->contactModel->update($contactId, $updateData);
        if (!$success) {
            throw new Exception('Failed to update contact');
        }

        return $this->contactModel->find($contactId);
    }

    /**
     * Delete a contact
     * 
     * @param int $contactId Contact ID
     * @return bool Success status
     * @throws Exception
     */
    public function deleteContact($contactId)
    {
        $contact = $this->contactModel->find($contactId);
        if (!$contact) {
            throw new Exception('Contact not found');
        }

        return $this->contactModel->delete($contactId);
    }

    /**
     * Set a contact as primary
     * 
     * @param int $contactId Contact ID
     * @return bool Success status
     * @throws Exception
     */
    public function setPrimaryContact($contactId)
    {
        $contact = $this->contactModel->find($contactId);
        if (!$contact) {
            throw new Exception('Contact not found');
        }

        return $this->contactModel->setPrimary($contactId);
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
        return $this->contactModel->getPrimaryContact($entityType, $entityId, $contactType);
    }

    /**
     * Delete all contacts for an entity
     * 
     * @param string $entityType Type of entity
     * @param int $entityId ID of the entity
     * @return bool Success status
     */
    public function deleteContactsForEntity($entityType, $entityId)
    {
        return $this->contactModel->deleteForEntity($entityType, $entityId);
    }

    /**
     * Unset primary contacts for an entity and contact type
     * 
     * @param string $entityType Type of entity
     * @param int $entityId ID of the entity
     * @param string $contactType Contact type
     * @return void
     */
    private function unsetPrimaryContacts($entityType, $entityId, $contactType)
    {
        global $wpdb;

        $wpdb->update(
            $this->contactModel->getTableName(),
            ['is_primary' => 0],
            [
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'contact_type' => $contactType
            ]
        );
    }
}
