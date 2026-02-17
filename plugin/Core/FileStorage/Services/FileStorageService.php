<?php

namespace App\Core\FileStorage\Services;

use App\Core\FileStorage\Models\File;
use App\Core\FileStorage\Models\FileLink;
use WP_Error;

/**
 * FileStorageService
 *
 * Handles file upload, download, and management operations
 * Integrates with WordPress upload system for security
 */
class FileStorageService
{
    /**
     * Upload a file and create metadata
     *
     * @param array $fileData Uploaded file data from $_FILES
     * @param array $options Upload options
     * @param object $currentUser Authenticated user object
     * @return array Structured result with success/error information
     */
    public static function uploadFile(array $fileData, array $options = [], $currentUser = null)
    {
        try {
            // Validate file data
            if (empty($fileData['tmp_name']) || empty($fileData['name'])) {
                return [
                    'success' => false,
                    'error' => 'invalid_file',
                    'message' => 'Invalid file data provided'
                ];
            }

            // Check if current user is provided
            if (!$currentUser) {
                return [
                    'success' => false,
                    'error' => 'authentication_required',
                    'message' => 'User authentication required'
                ];
            }

            // Validate file type and size
            $validation = self::validateFile($fileData);
            if (!$validation) {
                return $validation; // Already structured error response
            }

            // Generate unique file ID
            $fileId = wp_generate_uuid4();

            // Handle file upload using WordPress upload system
            $uploadResult = self::handleWordPressUpload($fileData, $fileId);
            if (!$uploadResult['success']) {
                return $uploadResult; // Already structured error response
            }

            // Create file metadata record
            $file = new File([
                'id' => $fileId,
                'owner_id' => $currentUser->profile_id,
                'file_name' => sanitize_file_name($fileData['name']),
                'file_type' => $fileData['type'],
                'file_size' => $fileData['size'],
                'storage_path' => $uploadResult['file'],
                'storage_provider' => 'local',
                'status' => 'active',
                'version' => 1,
                'parent_file_id' => null,
                'metadata' => !empty($options['metadata']) ? $options['metadata'] : null,
                'hash' => !empty($options['hash']) ? $options['hash'] : null,
                'uploaded_at' => current_time('mysql')
            ]);

            if (!$file->save()) {
                // Clean up uploaded file if metadata save fails
                @unlink($uploadResult['file']);
                return [
                    'success' => false,
                    'error' => 'save_failed',
                    'message' => 'Failed to save file metadata'
                ];
            }

            // Create file links if specified
            if (!empty($options['linked_entity_type']) && !empty($options['linked_entity_id'])) {
                FileLink::createLink(
                    $fileId,
                    $options['linked_entity_type'],
                    $options['linked_entity_id'],
                    $currentUser->profile_id
                );
            }

            return [
                'success' => true,
                'file' => $file,
                'upload_path' => $uploadResult['file']
            ];

        } catch (\Exception $e) {
            error_log('File upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'upload_error',
                'message' => 'File upload failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Download a file with access control
     *
     * @param string $fileId File ID
     * @param object $currentUser Authenticated user object
     * @return array Structured result with success/error information
     */
    public static function downloadFile(string $fileId, $currentUser = null)
    {
        try {
            // Get file metadata
            $file = File::find($fileId);
            if (!$file) {
                return [
                    'success' => false,
                    'error' => 'file_not_found',
                    'message' => 'File not found'
                ];
            }

            // Check if current user is provided
            if (!$currentUser) {
                return [
                    'success' => false,
                    'error' => 'authentication_required',
                    'message' => 'Authentication required'
                ];
            }

            if (!$file->isAccessibleBy($currentUser->profile_id)) {
                return [
                    'success' => false,
                    'error' => 'access_denied',
                    'message' => 'Access denied to this file'
                ];
            }

            // Check if file exists on disk
            if (!file_exists($file->storage_path)) {
                return [
                    'success' => false,
                    'error' => 'file_missing',
                    'message' => 'File not found on disk'
                ];
            }

            return [
                'success' => true,
                'file' => $file,
                'file_path' => $file->storage_path,
                'file_name' => $file->file_name,
                'file_size' => $file->file_size,
                'mime_type' => $file->file_type
            ];

        } catch (\Exception $e) {
            error_log('File download error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'download_error',
                'message' => 'File download failed'
            ];
        }
    }

    /**
     * Get files for an entity
     *
     * @param string $entityType Entity type (request, user, workflow, etc.)
     * @param string $entityId Entity ID
     * @return array Structured result with success/error information
     */
    public static function getEntityFiles(string $entityType, string $entityId)
    {
        try {
            $links = FileLink::getForEntity($entityType, $entityId);
            $files = [];

            foreach ($links as $link) {
                $file = $link->getFile();
                if ($file && $file->status === 'active') {
                    $files[] = $file;
                }
            }

            return [
                'success' => true,
                'files' => $files,
                'count' => count($files)
            ];

        } catch (\Exception $e) {
            error_log('Get entity files error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'query_error',
                'message' => 'Failed to retrieve entity files'
            ];
        }
    }

    /**
     * Delete a file (soft delete)
     *
     * @param string $fileId File ID
     * @param object $currentUser Authenticated user object
     * @return array Structured result with success/error information
     */
    public static function deleteFile(string $fileId, $currentUser = null)
    {
        try {
            $file = File::findById($fileId);
            if (!$file) {
                return [
                    'success' => false,
                    'error' => 'file_not_found',
                    'message' => 'File not found'
                ];
            }

            // Check if current user is provided
            if (!$currentUser || $file->owner_id !== $currentUser->profile_id) {
                return [
                    'success' => false,
                    'error' => 'access_denied',
                    'message' => 'Only file owner can delete files'
                ];
            }

            if (!$file->softDelete()) {
                return [
                    'success' => false,
                    'error' => 'delete_failed',
                    'message' => 'Failed to delete file'
                ];
            }

            return [
                'success' => true,
                'message' => 'File deleted successfully'
            ];

        } catch (\Exception $e) {
            error_log('File delete error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'delete_error',
                'message' => 'File deletion failed'
            ];
        }
    }

    /**
     * Link file to an entity
     *
     * @param string $fileId File ID
     * @param string $entityType Entity type
     * @param string $entityId Entity ID
     * @param object $currentUser Authenticated user object
     * @return array Structured result with success/error information
     */
    public static function linkFileToEntity(string $fileId, string $entityType, string $entityId, $currentUser = null)
    {
        try {
            // Check if current user is provided
            if (!$currentUser) {
                return [
                    'success' => false,
                    'error' => 'authentication_required',
                    'message' => 'Authentication required'
                ];
            }

            $link = FileLink::createLink($fileId, $entityType, $entityId, $currentUser->profile_id);

            if (!$link) {
                return [
                    'success' => false,
                    'error' => 'link_failed',
                    'message' => 'Failed to link file to entity'
                ];
            }

            return [
                'success' => true,
                'link' => $link,
                'message' => 'File linked to entity successfully'
            ];

        } catch (\Exception $e) {
            error_log('File link error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'link_error',
                'message' => 'File linking failed'
            ];
        }
    }

    /**
     * Handle WordPress upload with custom path
     *
     * @param array $fileData File data
     * @param string $fileId File ID for custom path
     * @return array Structured result with success/error information
     */
    private static function handleWordPressUpload(array $fileData, string $fileId)
    {
        // Create custom upload directory structure
        $uploadDir = wp_upload_dir();
        $customDir = $uploadDir['basedir'] . '/sta-files/' . date('Y/m');

        if (!wp_mkdir_p($customDir)) {
            return [
                'success' => false,
                'error' => 'directory_error',
                'message' => 'Failed to create upload directory'
            ];
        }

        // Generate unique filename
        $fileName = wp_unique_filename($customDir, $fileData['name']);
        $filePath = $customDir . '/' . $fileName;

        // Move uploaded file
        if (!move_uploaded_file($fileData['tmp_name'], $filePath)) {
            return [
                'success' => false,
                'error' => 'move_error',
                'message' => 'Failed to move uploaded file'
            ];
        }

        return [
            'success' => true,
            'file' => $filePath,
            'url' => str_replace($uploadDir['basedir'], $uploadDir['baseurl'], $filePath),
            'type' => $fileData['type']
        ];
    }

    /**
     * Validate uploaded file
     *
     * @param array $fileData File data
     * @return array|bool Structured error response or true if valid
     */
    private static function validateFile(array $fileData)
    {
        // Check file size (50MB limit)
        $maxSize = 50 * 1024 * 1024; // 50MB
        if ($fileData['size'] > $maxSize) {
            return [
                'success' => false,
                'error' => 'file_too_large',
                'message' => 'File size exceeds 50MB limit'
            ];
        }

        // Check file type
        $allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ];

        if (!in_array($fileData['type'], $allowedTypes)) {
            return [
                'success' => false,
                'error' => 'invalid_file_type',
                'message' => 'File type not allowed'
            ];
        }

        return [
            'success' => true
        ];
    }
}
