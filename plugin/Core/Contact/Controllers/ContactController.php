<?php

namespace App\Core\Contact\Controllers;

use App\Utils\BaseController;
use App\Core\Contact\Services\ContactService;
use WP_REST_Request;

/**
 * Contact Controller
 * 
 * Handles HTTP requests for contact management
 */
class ContactController extends BaseController
{
    private $contactService;

    public function __construct()
    {
        $this->contactService = new ContactService();
    }

    /**
     * Get contacts for an entity
     * 
     * GET /api/v1/contacts?entity_type=employee&entity_id=123&contact_type=emergency
     */
    public static function index(WP_REST_Request $request)
    {
        try {
            $controller = new self();

            $entityType = $request->get_param('entity_type');
            $entityId = $request->get_param('entity_id');
            $contactType = $request->get_param('contact_type');

            if (!$entityType || !$entityId) {
                return self::error('validation_error', 'entity_type and entity_id are required', 400);
            }

            $contacts = $controller->contactService->getContactsForEntity(
                $entityType,
                $entityId,
                $contactType
            );

            return self::success([
                'contacts' => $contacts,
                'total' => count($contacts)
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Get a single contact
     * 
     * GET /api/v1/contacts/{id}
     */
    public static function show(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $contactId = $request->get_param('id');

            $contact = $controller->contactService->getContact($contactId);
            if (!$contact) {
                return self::error('not_found', 'Contact not found', 404);
            }

            return self::success(['contact' => $contact]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Create a new contact
     * 
     * POST /api/v1/contacts
     * Body: { entity_type, entity_id, contact_type, name, phone, email, ... }
     */
    public static function store(WP_REST_Request $request)
    {
        try {
            $controller = new self();

            $entityType = $request->get_param('entity_type');
            $entityId = $request->get_param('entity_id');
            $data = $request->get_json_params();

            if (!$entityType || !$entityId) {
                return self::error('validation_error', 'entity_type and entity_id are required', 400);
            }

            $contact = $controller->contactService->createContact($entityType, $entityId, $data);

            return self::success([
                'contact' => $contact,
                'message' => 'Contact created successfully'
            ], 201);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Update a contact
     * 
     * PUT /api/v1/contacts/{id}
     * Body: { name, phone, email, ... }
     */
    public static function update(WP_REST_Request $request)
    {
        try {
            $controller = new self();

            $contactId = $request->get_param('id');
            $data = $request->get_json_params();

            $contact = $controller->contactService->updateContact($contactId, $data);

            return self::success([
                'contact' => $contact,
                'message' => 'Contact updated successfully'
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Delete a contact
     * 
     * DELETE /api/v1/contacts/{id}
     */
    public static function destroy(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $contactId = $request->get_param('id');

            $controller->contactService->deleteContact($contactId);

            return self::success([
                'message' => 'Contact deleted successfully'
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }

    /**
     * Set a contact as primary
     * 
     * PUT /api/v1/contacts/{id}/set-primary
     */
    public static function setPrimary(WP_REST_Request $request)
    {
        try {
            $controller = new self();
            $contactId = $request->get_param('id');

            $controller->contactService->setPrimaryContact($contactId);

            return self::success([
                'message' => 'Contact set as primary successfully'
            ]);
        } catch (\Exception $e) {
            return self::error('server_error', $e->getMessage());
        }
    }
}
