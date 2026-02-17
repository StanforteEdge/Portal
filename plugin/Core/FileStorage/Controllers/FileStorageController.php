<?php

namespace App\Core\FileStorage\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use App\Core\FileStorage\Services\FileStorageService;
use App\Core\FileStorage\Models\File;
use App\Utils\BaseController;

/**
 * FileStorageController
 *
 * Handles file upload, download, and management endpoints
 */
class FileStorageController extends BaseController
{
    /**
     * Upload a file
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function upload(WP_REST_Request $request)
    {
        try {
            // Get uploaded files
            $files = $request->get_file_params();
            if (empty($files) || !isset($files['file'])) {
                return static::error('no_file', 'No file provided for upload', 400);
            }

            $fileData = $files['file'];

            // Get upload options from request
            $options = [
                'metadata' => $request->get_param('metadata'),
                'linked_entity_type' => $request->get_param('linked_entity_type'),
                'linked_entity_id' => $request->get_param('linked_entity_id')
            ];

            // Get authenticated user from request
            $currentUser = $request->get_param('__auth_user');

            $result = FileStorageService::uploadFile($fileData, $options, $currentUser);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'], 400);
            }

            return static::success([
                'file' => [
                    'id' => $result['file']->id,
                    'file_name' => $result['file']->file_name,
                    'file_type' => $result['file']->file_type,
                    'file_size' => $result['file']->file_size,
                    'status' => $result['file']->status,
                    'version' => $result['file']->version,
                    'uploaded_at' => $result['file']->uploaded_at
                ]
            ], 201);

        } catch (\Exception $e) {
            error_log('File upload controller error: ' . $e->getMessage());
            return static::error('upload_error', 'File upload failed', 500);
        }
    }

    /**
     * Download a file
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function download(WP_REST_Request $request)
    {
        try {
            $fileId = $request->get_param('id');
            if (empty($fileId)) {
                return static::error('missing_id', 'File ID is required', 400);
            }

            // Get authenticated user from request
            $currentUser = $request->get_param('__auth_user');

            $result = FileStorageService::downloadFile($fileId, $currentUser);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'], 403);
            }

            // Set headers for file download
            header('Content-Type: ' . $result['mime_type']);
            header('Content-Disposition: attachment; filename="' . $result['file_name'] . '"');
            header('Content-Length: ' . $result['file_size']);
            header('Cache-Control: private, max-age=0, must-revalidate');
            header('Pragma: public');

            // Output file content
            readfile($result['file_path']);
            exit;

        } catch (\Exception $e) {
            error_log('File download controller error: ' . $e->getMessage());
            return static::error('download_error', 'File download failed', 500);
        }
    }

    /**
     * Get file metadata
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getFile(WP_REST_Request $request)
    {
        try {
            $fileId = $request->get_param('id');
            if (empty($fileId)) {
                return static::error('missing_id', 'File ID is required', 400);
            }

            // For now, just try to download (which includes access check)
            $result = FileStorageService::downloadFile($fileId);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            return static::success([
                'file' => [
                    'id' => $result['file']->id,
                    'file_name' => $result['file']->file_name,
                    'file_type' => $result['file']->file_type,
                    'file_size' => $result['file']->file_size,
                    'status' => $result['file']->status,
                    'version' => $result['file']->version,
                    'uploaded_at' => $result['file']->uploaded_at,
                    'owner_id' => $result['file']->owner_id
                ]
            ], 200);

        } catch (\Exception $e) {
            error_log('Get file controller error: ' . $e->getMessage());
            return static::error('file_error', 'Failed to retrieve file information', 500);
        }
    }

    /**
     * Get files for an entity
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getEntityFiles(WP_REST_Request $request)
    {
        try {
            $entityType = $request->get_param('entity_type');
            $entityId = $request->get_param('entity_id');

            if (empty($entityType) || empty($entityId)) {
                return static::error('missing_params', 'Entity type and ID are required', 400);
            }

            $result = FileStorageService::getEntityFiles($entityType, $entityId);

            if (is_wp_error($result)) {
                return static::respondWpError($result);
            }

            $files = array_map(function($file) {
                return [
                    'id' => $file->id,
                    'file_name' => $file->file_name,
                    'file_type' => $file->file_type,
                    'file_size' => $file->file_size,
                    'status' => $file->status,
                    'version' => $file->version,
                    'uploaded_at' => $file->uploaded_at,
                    'owner_id' => $file->owner_id
                ];
            }, $result['files']);

            return static::success([
                'files' => $files,
                'count' => $result['count']
            ], 200);

        } catch (\Exception $e) {
            error_log('Get entity files controller error: ' . $e->getMessage());
            return static::error('entity_files_error', 'Failed to retrieve entity files', 500);
        }
    }

    /**
     * Delete a file
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function delete(WP_REST_Request $request)
    {
        try {
            $fileId = $request->get_param('id');
            if (empty($fileId)) {
                return static::error('missing_id', 'File ID is required', 400);
            }

            // Get authenticated user from request
            $currentUser = $request->get_param('__auth_user');

            $result = FileStorageService::deleteFile($fileId, $currentUser);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'], 403);
            }

            return static::success(['message' => $result['message']], 200);

        } catch (\Exception $e) {
            error_log('File delete controller error: ' . $e->getMessage());
            return static::error('delete_error', 'File deletion failed', 500);
        }
    }

    /**
     * Link file to an entity
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function linkFile(WP_REST_Request $request)
    {
        try {
            $fileId = $request->get_param('file_id');
            $entityType = $request->get_param('entity_type');
            $entityId = $request->get_param('entity_id');

            if (empty($fileId) || empty($entityType) || empty($entityId)) {
                return static::error('missing_params', 'File ID, entity type, and entity ID are required', 400);
            }

            // Get authenticated user from request
            $currentUser = $request->get_param('__auth_user');

            $result = FileStorageService::linkFileToEntity($fileId, $entityType, $entityId, $currentUser);

            if (!$result['success']) {
                return static::error($result['error'], $result['message'], 403);
            }

            return static::success(['message' => $result['message']], 200);

        } catch (\Exception $e) {
            error_log('File link controller error: ' . $e->getMessage());
            return static::error('link_error', 'File linking failed', 500);
        }
    }

    /**
     * Archive a file
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function archive(WP_REST_Request $request)
    {
        try {
            $fileId = $request->get_param('id');
            if (empty($fileId)) {
                return static::error('missing_id', 'File ID is required', 400);
            }

            // Get file and archive it
            $file = File::findById($fileId);
            if (!$file) {
                return static::error('file_not_found', 'File not found', 404);
            }

            // Check ownership
            $currentUser = $request->get_param('__auth_user');
            if (!$currentUser || $file->owner_id !== $currentUser->profile_id) {
                return static::error('access_denied', 'Only file owner can archive files', 403);
            }

            if (!$file->archive()) {
                return static::error('archive_failed', 'Failed to archive file', 500);
            }

            return static::success(['message' => 'File archived successfully'], 200);

        } catch (\Exception $e) {
            error_log('File archive controller error: ' . $e->getMessage());
            return static::error('archive_error', 'File archiving failed', 500);
        }
    }

    /**
     * Restore a file
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function restore(WP_REST_Request $request)
    {
        try {
            $fileId = $request->get_param('id');
            if (empty($fileId)) {
                return static::error('missing_id', 'File ID is required', 400);
            }

            // Get file and restore it
            $file = File::findById($fileId);
            if (!$file) {
                return static::error('file_not_found', 'File not found', 404);
            }

            // Check ownership
            $currentUser = $request->get_param('__auth_user');
            if (!$currentUser || $file->owner_id !== $currentUser->profile_id) {
                return static::error('access_denied', 'Only file owner can restore files', 403);
            }

            if (!$file->restore()) {
                return static::error('restore_failed', 'Failed to restore file', 500);
            }

            return static::success(['message' => 'File restored successfully'], 200);

        } catch (\Exception $e) {
            error_log('File restore controller error: ' . $e->getMessage());
            return static::error('restore_error', 'File restoration failed', 500);
        }
    }
}
