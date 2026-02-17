<?php
namespace App\Core\Document\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use App\Core\Document\Services\DocumentService;
use App\Utils\BaseController;
use App\Core\Auth\Middleware\AuthMiddleware;

class DocumentController extends BaseController
{
    // ==================== DOCUMENT METHODS ====================
    
    /**
     * Get all documents
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function listDocuments(WP_REST_Request $request)
    {
        try {
            
            $filters = [];
            $limit = (int) ($request->get_param('per_page') ?: 10);
            $page = (int) ($request->get_param('page') ?: 1);
            $offset = ($page - 1) * $limit;
            
            // Apply filters
            if ($request->get_param('status')) {
                $filters['status'] = $request->get_param('status');
            }
            
            if ($request->get_param('category_id')) {
                $filters['category_id'] = $request->get_param('category_id');
            }
            
            if ($request->get_param('created_by')) {
                $filters['created_by'] = $request->get_param('created_by');
            }
            
            if ($request->get_param('department_id')) {
                $filters['department_id'] = $request->get_param('department_id');
            }
            
            // Fetch documents and pagination meta
            $total = (new \App\Core\Document\Models\Document())->getDocumentCount($filters);
            $documents = DocumentService::getAllDocuments($filters, $limit, $offset);

            return static::success([
                'data' => array_map(function($document) {
                    return self::formatDocumentResponse($document);
                }, $documents)
            ], 200, [
                'total' => (int) $total,
                'per_page' => (int) $limit,
                'current_page' => (int) $page,
                'last_page' => (int) max(1, (int) ceil(($total ?: 0) / ($limit ?: 1)))
            ]);
            
        } catch (\Exception $e) {
            error_log('Error listing documents: ' . $e->getMessage());
            return static::error('documents_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get document by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $document = DocumentService::getDocumentById($id);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting document: ' . $e->getMessage());
            return static::error('documents_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create new document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function createDocument(\WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'Request body is required', 400);
            }
            
            // Add current user as creator
            $auth = AuthMiddleware::getCurrentUserFromRequest($request);
            $data['created_by'] = $auth->wp_user_id ?? get_current_user_id();
            
            $document = DocumentService::createDocument($data);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 201);
            
        } catch (\Exception $e) {
            error_log('Error creating document: ' . $e->getMessage());
            return static::error('documents_create_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function updateDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'Request body is required', 400);
            }
            
            $document = DocumentService::updateDocument($id, $data);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200);
            
        } catch (\Exception $e) {
            error_log('Error updating document: ' . $e->getMessage());
            return static::error('documents_update_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function deleteDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $result = DocumentService::deleteDocument($id);
            
            if (is_wp_error($result)) {
                return static::error($result);
            }
            
            return static::success(null, 204);
            
        } catch (\Exception $e) {
            error_log('Error deleting document: ' . $e->getMessage());
            return static::error('documents_delete_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Search documents
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function searchDocuments(\WP_REST_Request $request)
    {
        try {
            $query = $request->get_param('query') ?: '';
            $filters = [];
            $limit = $request->get_param('per_page') ?: 10;
            $page = $request->get_param('page') ?: 1;
            $offset = ($page - 1) * $limit;
            
            // Apply filters
            if ($request->get_param('status')) {
                $filters['status'] = $request->get_param('status');
            }
            
            if ($request->get_param('category_id')) {
                $filters['category_id'] = $request->get_param('category_id');
            }
            
            if ($request->get_param('tags')) {
                $filters['tags'] = explode(',', $request->get_param('tags'));
            }
            
            if ($request->get_param('created_by')) {
                $filters['created_by'] = $request->get_param('created_by');
            }
            
            $documents = DocumentService::searchDocuments($query, $filters, $limit, $offset);
            
            return static::success([
                'data' => array_map(function($document) {
                    return self::formatDocumentResponse($document);
                }, $documents)
            ], 200, [
                'query' => $query,
                'page' => (int) $page,
                'per_page' => (int) $limit
            ]);
            
        } catch (\Exception $e) {
            error_log('Error searching documents: ' . $e->getMessage());
            return static::error('documents_search_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    // ==================== WORKFLOW METHODS ====================
    
    /**
     * Submit document for review
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function submitForReview(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $auth = AuthMiddleware::getCurrentUserFromRequest($request);
            $user_id = $auth->wp_user_id ?? get_current_user_id();
            $document = DocumentService::submitForReview($id, $user_id);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200, [
                'message' => 'Document submitted for review'
            ]);
            
        } catch (\Exception $e) {
            error_log('Error submitting document for review: ' . $e->getMessage());
            return static::error('documents_submit_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Approve document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function approveDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $auth = AuthMiddleware::getCurrentUserFromRequest($request);
            $user_id = $auth->wp_user_id ?? get_current_user_id();
            $document = DocumentService::approveDocument($id, $user_id);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200, [
                'message' => 'Document approved and published'
            ]);
            
        } catch (\Exception $e) {
            error_log('Error approving document: ' . $e->getMessage());
            return static::error('documents_approve_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Reject document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function rejectDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $auth = AuthMiddleware::getCurrentUserFromRequest($request);
            $user_id = $auth->wp_user_id ?? get_current_user_id();
            $document = DocumentService::rejectDocument($id, $user_id);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200, [
                'message' => 'Document rejected'
            ]);
            
        } catch (\Exception $e) {
            error_log('Error rejecting document: ' . $e->getMessage());
            return static::error('documents_reject_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Archive document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function archiveDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $auth = AuthMiddleware::getCurrentUserFromRequest($request);
            $user_id = $auth->wp_user_id ?? get_current_user_id();
            $document = DocumentService::archiveDocument($id, $user_id);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200, [
                'message' => 'Document archived'
            ]);
            
        } catch (\Exception $e) {
            error_log('Error archiving document: ' . $e->getMessage());
            return static::error('documents_archive_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Restore archived document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function restoreDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $auth = AuthMiddleware::getCurrentUserFromRequest($request);
            $user_id = $auth->wp_user_id ?? get_current_user_id();
            $document = DocumentService::restoreDocument($id, $user_id);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200, [
                'message' => 'Document restored'
            ]);
            
        } catch (\Exception $e) {
            error_log('Error restoring document: ' . $e->getMessage());
            return static::error('documents_restore_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    // ==================== VERSION METHODS ====================
    
    /**
     * Get document versions
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getDocumentVersions(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $versions = DocumentService::getDocumentVersions($id);
            
            return static::success([
                'data' => array_map(function($version) {
                    return (array) $version;
                }, $versions)
            ], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting document versions: ' . $e->getMessage());
            return static::error('documents_versions_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get specific document version
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getDocumentVersion(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $version = $request->get_param('version');
            
            if (empty($id) || empty($version)) {
                return static::error('bad_request', 'Document ID and version are required', 400);
            }
            
            $versionData = DocumentService::getDocumentVersion($id, $version);
            
            if (is_wp_error($versionData)) {
                return static::error($versionData);
            }
            
            return static::success(['data' => (array) $versionData], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting document version: ' . $e->getMessage());
            return static::error('documents_version_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Rollback document to previous version
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function rollbackDocument(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            $version = $request->get_param('version');
            
            if (empty($id) || empty($version)) {
                return static::error('bad_request', 'Document ID and version are required', 400);
            }
            
            $auth = AuthMiddleware::getCurrentUserFromRequest($request);
            $user_id = $auth->wp_user_id ?? get_current_user_id();
            $document = DocumentService::rollbackToVersion($id, $version, $user_id);
            
            if (is_wp_error($document)) {
                return static::error($document);
            }
            
            return static::success(['data' => self::formatDocumentResponse($document)], 200, [
                'message' => "Document rolled back to version {$version}"
            ]);
            
        } catch (\Exception $e) {
            error_log('Error rolling back document: ' . $e->getMessage());
            return static::error('documents_rollback_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    // ==================== ATTACHMENT METHODS ====================
    
    /**
     * Get document attachments
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getDocumentAttachments(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $attachments = DocumentService::getDocumentAttachments($id);
            
            return static::success([
                'data' => array_map(function($attachment) {
                    return (array) $attachment;
                }, $attachments)
            ], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting document attachments: ' . $e->getMessage());
            return static::error('documents_attachments_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Add attachment to document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function addDocumentAttachment(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Document ID is required', 400);
            }
            
            $data = $request->get_json_params();
            if (empty($data['file_id'])) {
                return static::error('bad_request', 'File ID is required', 400);
            }
            
            $attachment_type = $data['attachment_type'] ?? 'supporting';
            $attachment = DocumentService::addDocumentAttachment($id, $data['file_id'], $attachment_type);
            
            if (is_wp_error($attachment)) {
                return static::error($attachment);
            }
            
            return static::success(['data' => (array) $attachment], 201, [
                'message' => 'File attached successfully'
            ]);
            
        } catch (\Exception $e) {
            error_log('Error adding document attachment: ' . $e->getMessage());
            return static::error('documents_attachment_add_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Remove attachment from document
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function removeDocumentAttachment(\WP_REST_Request $request)
    {
        try {
            $attachment_id = $request->get_param('attachment_id');
            if (empty($attachment_id)) {
                return static::error('bad_request', 'Attachment ID is required', 400);
            }
            
            $result = DocumentService::removeDocumentAttachment($attachment_id);
            
            if (is_wp_error($result)) {
                return static::error($result);
            }
            
            return static::success(null, 204);
            
        } catch (\Exception $e) {
            error_log('Error removing document attachment: ' . $e->getMessage());
            return static::error('documents_attachment_remove_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    // ==================== TAXONOMY METHODS ====================
    
    /**
     * Get document categories
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getDocumentCategories(\WP_REST_Request $request)
    {
        try {
            $categories = DocumentService::getDocumentCategories();
            
            return static::success(['data' => $categories], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting document categories: ' . $e->getMessage());
            return static::error('documents_categories_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get document departments
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getDocumentDepartments(\WP_REST_Request $request)
    {
        try {
            $departments = DocumentService::getDocumentDepartments();
            
            return static::success(['data' => $departments], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting document departments: ' . $e->getMessage());
            return static::error('documents_departments_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get taxonomy term by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getTaxonomyTerm(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Term ID is required', 400);
            }
            
            $term = DocumentService::getTaxonomyTerm($id);
            
            if (is_wp_error($term)) {
                return static::error($term);
            }
            
            return static::success(['data' => $term], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting taxonomy term: ' . $e->getMessage());
            return static::error('documents_term_error', 'Internal server error', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    /**
     * Format document response
     * 
     * @param object $document Document object
     * @return array Formatted document array
     */
    private static function formatDocumentResponse($document)
    {
        $formatted = (array) $document;
        
        // Decode JSON fields
        if (isset($formatted['tags']) && is_string($formatted['tags'])) {
            $formatted['tags'] = json_decode($formatted['tags'], true) ?: [];
        }
        
        if (isset($formatted['metadata']) && is_string($formatted['metadata'])) {
            $formatted['metadata'] = json_decode($formatted['metadata'], true) ?: [];
        }
        
        return $formatted;
    }
}
