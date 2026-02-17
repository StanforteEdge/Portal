<?php
namespace App\Core\Document\Services;

use \WP_Error;
use App\Core\Document\Models\Document;
use App\Core\Document\Models\DocumentVersion;
use App\Core\Document\Models\DocumentAttachment;
use App\Core\Document\Models\DocumentSubscription;

class DocumentService
{
    // ==================== DOCUMENT METHODS ====================
    
    /**
     * Get all documents with optional filters
     * 
     * @param array $filters Optional filters (status, category_id, created_by, etc.)
     * @param int $limit Optional limit
     * @param int $offset Optional offset
     * @return array List of documents
     */
    public static function getAllDocuments($filters = [], $limit = null, $offset = 0)
    {
        $documentModel = new Document();
        return $documentModel->getDocuments($filters, $limit, $offset);
    }
    
    /**
     * Get document by ID
     * 
     * @param string $id Document ID
     * @return object|WP_Error Document data or error
     */
    public static function getDocumentById($id)
    {
        $documentModel = new Document();
        $document = $documentModel->findById($id);
        
        if (!$document) {
            return new WP_Error('document_not_found', 'Document not found', ['status' => 404]);
        }
        
        return $document;
    }
    
    /**
     * Create new document
     * 
     * @param array $data Document data
     * @return object|WP_Error Created document or error
     */
    public static function createDocument($data)
    {
        $documentModel = new Document();
        
        // Validate required fields
        if (empty($data['title'])) {
            return new WP_Error('missing_title', 'Document title is required', ['status' => 400]);
        }
        
        if (empty($data['content']) && empty($data['external_url'])) {
            return new WP_Error('missing_content', 'Document content or external URL is required', ['status' => 400]);
        }
        
        if (empty($data['category_id'])) {
            return new WP_Error('missing_category', 'Document category is required', ['status' => 400]);
        }
        
        // Generate UUID and slug
        $data['id'] = wp_generate_uuid4();
        $data['slug'] = self::generateUniqueSlug($data['title']);
        $data['status'] = $data['status'] ?? 'draft';
        $data['version'] = $data['version'] ?? '1.0.0';
        $data['content_type'] = $data['content_type'] ?? 'wysiwyg';
        $data['created_at'] = current_time('mysql');
        $data['updated_at'] = current_time('mysql');
        
        // Encode JSON fields
        if (isset($data['tags']) && is_array($data['tags'])) {
            $data['tags'] = json_encode($data['tags']);
        }
        
        if (isset($data['metadata']) && is_array($data['metadata'])) {
            $data['metadata'] = json_encode($data['metadata']);
        }
        
        $result = $documentModel->create($data);
        
        if ($result === false) {
            return new WP_Error('creation_failed', 'Failed to create document', ['status' => 500]);
        }
        
        // Create initial version
        self::createDocumentVersion($data['id'], $data);
        
        return $documentModel->findById($data['id']);
    }
    
    /**
     * Update document
     * 
     * @param string $id Document ID
     * @param array $data Update data
     * @return object|WP_Error Updated document or error
     */
    public static function updateDocument($id, $data)
    {
        $documentModel = new Document();
        $document = $documentModel->findById($id);
        
        if (!$document) {
            return new WP_Error('document_not_found', 'Document not found', ['status' => 404]);
        }
        
        // Update slug if title changed
        if (isset($data['title']) && $data['title'] !== $document->title) {
            $data['slug'] = self::generateUniqueSlug($data['title'], $id);
        }
        
        $data['updated_at'] = current_time('mysql');
        
        // Encode JSON fields
        if (isset($data['tags']) && is_array($data['tags'])) {
            $data['tags'] = json_encode($data['tags']);
        }
        
        if (isset($data['metadata']) && is_array($data['metadata'])) {
            $data['metadata'] = json_encode($data['metadata']);
        }
        
        // Create new version if content changed
        if (isset($data['content']) || isset($data['external_url'])) {
            $new_version = self::incrementVersion($document->version);
            $data['version'] = $new_version;
            
            self::createDocumentVersion($id, array_merge((array)$document, $data));
        }
        
        $result = $documentModel->update($id, $data);
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update document', ['status' => 500]);
        }
        
        return $documentModel->findById($id);
    }
    
    /**
     * Delete document
     * 
     * @param string $id Document ID
     * @return bool|WP_Error True on success or error
     */
    public static function deleteDocument($id)
    {
        $documentModel = new Document();
        $document = $documentModel->findById($id);
        
        if (!$document) {
            return new WP_Error('document_not_found', 'Document not found', ['status' => 404]);
        }
        
        // Delete related data
        $versionModel = new DocumentVersion();
        $versionModel->deleteDocumentVersions($id);
        
        $attachmentModel = new DocumentAttachment();
        $attachmentModel->deleteDocumentAttachments($id);
        
        $result = $documentModel->delete($id);
        
        if ($result === false) {
            return new WP_Error('deletion_failed', 'Failed to delete document', ['status' => 500]);
        }
        
        return true;
    }
    
    /**
     * Search documents
     * 
     * @param string $query Search query
     * @param array $filters Additional filters
     * @param int $limit Optional limit
     * @param int $offset Optional offset
     * @return array Search results
     */
    public static function searchDocuments($query, $filters = [], $limit = null, $offset = 0)
    {
        $documentModel = new Document();
        return $documentModel->searchDocuments($query, $filters, $limit, $offset);
    }
    
    // ==================== WORKFLOW METHODS ====================
    
    /**
     * Submit document for review
     * 
     * @param string $id Document ID
     * @param int $user_id User submitting for review
     * @return object|WP_Error Updated document or error
     */
    public static function submitForReview($id, $user_id)
    {
        return self::updateDocumentStatus($id, 'review', $user_id);
    }
    
    /**
     * Approve document (review -> published)
     * 
     * @param string $id Document ID
     * @param int $user_id User approving
     * @return object|WP_Error Updated document or error
     */
    public static function approveDocument($id, $user_id)
    {
        $result = self::updateDocumentStatus($id, 'published', $user_id);
        
        if (!is_wp_error($result)) {
            // Update published_by and published_at
            $documentModel = new Document();
            $documentModel->update($id, [
                'published_by' => $user_id,
                'published_at' => current_time('mysql')
            ]);
            
            // TODO: Trigger notifications for subscribers
            // self::notifySubscribers($id, 'publish');
        }
        
        return $result;
    }
    
    /**
     * Reject document (review -> rejected)
     * 
     * @param string $id Document ID
     * @param int $user_id User rejecting
     * @return object|WP_Error Updated document or error
     */
    public static function rejectDocument($id, $user_id)
    {
        $result = self::updateDocumentStatus($id, 'rejected', $user_id);
        
        if (!is_wp_error($result)) {
            // Update reviewed_by
            $documentModel = new Document();
            $documentModel->update($id, [
                'reviewed_by' => $user_id
            ]);
        }
        
        return $result;
    }
    
    /**
     * Archive document
     * 
     * @param string $id Document ID
     * @param int $user_id User archiving
     * @return object|WP_Error Updated document or error
     */
    public static function archiveDocument($id, $user_id)
    {
        return self::updateDocumentStatus($id, 'archived', $user_id);
    }
    
    /**
     * Restore archived document
     * 
     * @param string $id Document ID
     * @param int $user_id User restoring
     * @return object|WP_Error Updated document or error
     */
    public static function restoreDocument($id, $user_id)
    {
        return self::updateDocumentStatus($id, 'draft', $user_id);
    }
    
    // ==================== VERSION METHODS ====================
    
    /**
     * Get document versions
     * 
     * @param string $document_id Document ID
     * @return array List of versions
     */
    public static function getDocumentVersions($document_id)
    {
        $versionModel = new DocumentVersion();
        return $versionModel->getDocumentVersions($document_id);
    }
    
    /**
     * Get specific document version
     * 
     * @param string $document_id Document ID
     * @param string $version Version number
     * @return object|WP_Error Version data or error
     */
    public static function getDocumentVersion($document_id, $version)
    {
        $versionModel = new DocumentVersion();
        $versionData = $versionModel->findByDocumentAndVersion($document_id, $version);
        
        if (!$versionData) {
            return new WP_Error('version_not_found', 'Document version not found', ['status' => 404]);
        }
        
        return $versionData;
    }
    
    /**
     * Rollback document to previous version
     * 
     * @param string $document_id Document ID
     * @param string $version Version to rollback to
     * @param int $user_id User performing rollback
     * @return object|WP_Error Updated document or error
     */
    public static function rollbackToVersion($document_id, $version, $user_id)
    {
        $versionModel = new DocumentVersion();
        $versionData = $versionModel->findByDocumentAndVersion($document_id, $version);
        
        if (!$versionData) {
            return new WP_Error('version_not_found', 'Document version not found', ['status' => 404]);
        }
        
        $documentModel = new Document();
        $current_document = $documentModel->findById($document_id);
        
        if (!$current_document) {
            return new WP_Error('document_not_found', 'Document not found', ['status' => 404]);
        }
        
        // Create new version with incremented number
        $new_version = self::incrementVersion($current_document->version);
        
        // Update document with version data
        $update_data = [
            'content' => $versionData->content,
            'content_type' => $versionData->content_type,
            'external_url' => $versionData->external_url,
            'version' => $new_version,
            'updated_at' => current_time('mysql')
        ];
        
        $result = $documentModel->update($document_id, $update_data);
        
        if ($result === false) {
            return new WP_Error('rollback_failed', 'Failed to rollback document', ['status' => 500]);
        }
        
        // Create version entry for the rollback
        self::createDocumentVersion($document_id, array_merge((array)$current_document, $update_data), "Rolled back to version {$version}");
        
        return $documentModel->findById($document_id);
    }
    
    // ==================== ATTACHMENT METHODS ====================
    
    /**
     * Get document attachments
     * 
     * @param string $document_id Document ID
     * @return array List of attachments
     */
    public static function getDocumentAttachments($document_id)
    {
        $attachmentModel = new DocumentAttachment();
        return $attachmentModel->getDocumentAttachments($document_id);
    }
    
    /**
     * Add attachment to document
     * 
     * @param string $document_id Document ID
     * @param string $file_id File ID from file storage system
     * @param string $attachment_type Type of attachment (primary, supporting)
     * @return object|WP_Error Created attachment or error
     */
    public static function addDocumentAttachment($document_id, $file_id, $attachment_type = 'supporting')
    {
        $documentModel = new Document();
        $document = $documentModel->findById($document_id);
        
        if (!$document) {
            return new WP_Error('document_not_found', 'Document not found', ['status' => 404]);
        }
        
        $attachmentModel = new DocumentAttachment();
        
        // Check if file is already attached
        if ($attachmentModel->isFileAttached($document_id, $file_id)) {
            return new WP_Error('file_already_attached', 'File is already attached to this document', ['status' => 400]);
        }
        
        $attachment_data = [
            'id' => wp_generate_uuid4(),
            'document_id' => $document_id,
            'file_id' => $file_id,
            'attachment_type' => $attachment_type,
            'uploaded_at' => current_time('mysql')
        ];
        
        $result = $attachmentModel->create($attachment_data);
        
        if ($result === false) {
            return new WP_Error('attachment_failed', 'Failed to attach file', ['status' => 500]);
        }
        
        return $attachmentModel->findById($attachment_data['id']);
    }
    
    /**
     * Remove attachment from document
     * 
     * @param string $attachment_id Attachment ID
     * @return bool|WP_Error True on success or error
     */
    public static function removeDocumentAttachment($attachment_id)
    {
        $attachmentModel = new DocumentAttachment();
        $attachment = $attachmentModel->findById($attachment_id);
        
        if (!$attachment) {
            return new WP_Error('attachment_not_found', 'Attachment not found', ['status' => 404]);
        }
        
        $result = $attachmentModel->delete($attachment_id);
        
        if ($result === false) {
            return new WP_Error('removal_failed', 'Failed to remove attachment', ['status' => 500]);
        }
        
        return true;
    }
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    /**
     * Generate unique slug for document
     * 
     * @param string $title Document title
     * @param string $exclude_id Optional document ID to exclude
     * @return string Unique slug
     */
    private static function generateUniqueSlug($title, $exclude_id = null)
    {
        $base_slug = sanitize_title($title);
        $slug = $base_slug;
        $counter = 1;
        
        $documentModel = new Document();
        
        while (true) {
            $existing = $documentModel->findBySlug($slug);
            
            if (!$existing || ($exclude_id && $existing->id === $exclude_id)) {
                break;
            }
            
            $slug = $base_slug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
    
    /**
     * Update document status
     * 
     * @param string $id Document ID
     * @param string $status New status
     * @param int $user_id User making the change
     * @return object|WP_Error Updated document or error
     */
    private static function updateDocumentStatus($id, $status, $user_id)
    {
        $documentModel = new Document();
        $document = $documentModel->findById($id);
        
        if (!$document) {
            return new WP_Error('document_not_found', 'Document not found', ['status' => 404]);
        }
        
        $update_data = [
            'status' => $status,
            'updated_at' => current_time('mysql')
        ];
        
        $result = $documentModel->update($id, $update_data);
        
        if ($result === false) {
            return new WP_Error('status_update_failed', 'Failed to update document status', ['status' => 500]);
        }
        
        return $documentModel->findById($id);
    }
    
    /**
     * Create document version
     * 
     * @param string $document_id Document ID
     * @param array $document_data Document data
     * @param string $change_notes Optional change notes
     * @return bool Success status
     */
    private static function createDocumentVersion($document_id, $document_data, $change_notes = null)
    {
        $versionModel = new DocumentVersion();
        
        $version_data = [
            'id' => wp_generate_uuid4(),
            'document_id' => $document_id,
            'version' => $document_data['version'],
            'content' => $document_data['content'],
            'content_type' => $document_data['content_type'] ?? 'wysiwyg',
            'external_url' => $document_data['external_url'] ?? null,
            'change_notes' => $change_notes,
            'created_by' => $document_data['created_by'],
            'created_at' => current_time('mysql')
        ];
        
        return $versionModel->create($version_data);
    }
    
    /**
     * Increment version number (semantic versioning)
     * 
     * @param string $current_version Current version
     * @return string New version
     */
    private static function incrementVersion($current_version)
    {
        $parts = explode('.', $current_version);
        
        if (count($parts) >= 3) {
            // Increment patch version
            $parts[2] = (int)$parts[2] + 1;
        } else {
            // Default increment
            $parts = ['1', '0', '1'];
        }
        
        return implode('.', $parts);
    }
}
