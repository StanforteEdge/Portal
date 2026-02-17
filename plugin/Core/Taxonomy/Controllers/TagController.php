<?php
namespace App\Core\Taxonomy\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use App\Core\Taxonomy\Services\TagService;
use App\Utils\BaseController;

class TagController extends BaseController
{
    protected static $tagService;
    
    /**
     * Initialize the controller
     */
    public static function init()
    {
        self::$tagService = new TagService();
    }
    
    /**
     * List all tags
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function listTags(WP_REST_Request $request)
    {
        try {
            $page = $request->get_param('page') ? (int) $request->get_param('page') : 1;
            $perPage = $request->get_param('per_page') ? (int) $request->get_param('per_page') : 50;
            
            $tags = self::$tagService->getAllTags($page, $perPage);
            
            return static::success([
                'data' => $tags->items()
            ], 200, [
                'total' => $tags->total(),
                'per_page' => $tags->perPage(),
                'current_page' => $tags->currentPage(),
                'last_page' => $tags->lastPage(),
            ]);
            
        } catch (\Exception $e) {
            error_log('Error listing tags: ' . $e->getMessage());
            return static::error('tags_error', 'Failed to retrieve tags', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get popular tags
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getPopularTags(WP_REST_Request $request)
    {
        try {
            $limit = $request->get_param('limit') ? (int) $request->get_param('limit') : 10;
            
            $tags = self::$tagService->getPopularTags($limit);
            
            return static::success(['data' => $tags], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting popular tags: ' . $e->getMessage());
            return static::error('tags_popular_error', 'Failed to retrieve popular tags', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Search tags
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function searchTags(WP_REST_Request $request)
    {
        try {
            $query = $request->get_param('query');
            if (empty($query)) {
                return static::error('bad_request', 'Search query is required', 400);
            }
            
            $limit = $request->get_param('limit') ? (int) $request->get_param('limit') : 10;
            
            $tags = self::$tagService->searchTags($query, $limit);
            
            return static::success(['data' => $tags], 200);
            
        } catch (\Exception $e) {
            error_log('Error searching tags: ' . $e->getMessage());
            return static::error('tags_search_error', 'Failed to search tags', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get tag by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getTag(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Tag ID is required', 400);
            }
            
            $tag = self::$tagService->getTagById($id);
            if (!$tag) {
                return static::error('not_found', 'Tag not found', 404);
            }
            
            return static::success(['data' => $tag], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting tag: ' . $e->getMessage());
            return static::error('tag_error', 'Failed to retrieve tag', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create new tag
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function createTag(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data['name'])) {
                return static::error('bad_request', 'Tag name is required', 400);
            }
            
            $tag = self::$tagService->createTag($data);
            
            return static::success(['data' => $tag], 201);
            
        } catch (\Exception $e) {
            error_log('Error creating tag: ' . $e->getMessage());
            return static::error('tag_create_error', 'Failed to create tag', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update tag
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function updateTag(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Tag ID is required', 400);
            }
            
            $data = $request->get_json_params();
            if (empty($data)) {
                return static::error('bad_request', 'No data provided for update', 400);
            }
            
            $result = self::$tagService->updateTag($id, $data);
            
            if (!$result) {
                return static::error('not_found', 'Tag not found', 404);
            }
            
            return static::success(['data' => $result], 200);
            
        } catch (\Exception $e) {
            error_log('Error updating tag: ' . $e->getMessage());
            return static::error('tag_update_error', 'Failed to update tag', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete tag
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function deleteTag(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Tag ID is required', 400);
            }
            
            $result = self::$tagService->deleteTag($id);
            
            if (!$result) {
                return static::error('not_found', 'Tag not found', 404);
            }
            
            return static::success(null, 204);
            
        } catch (\Exception $e) {
            error_log('Error deleting tag: ' . $e->getMessage());
            return static::error('tag_delete_error', 'Failed to delete tag', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Tag an object
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function tagObject(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data['tag_id']) || empty($data['object_id']) || empty($data['object_type'])) {
                return static::error('bad_request', 'Tag ID, object ID, and object type are required', 400);
            }
            
            $result = self::$tagService->tagObject(
                $data['tag_id'],
                $data['object_id'],
                $data['object_type']
            );
            
            return static::success(['data' => ['success' => $result]], 200);
            
        } catch (\Exception $e) {
            error_log('Error tagging object: ' . $e->getMessage());
            return static::error('tag_object_error', 'Failed to tag object', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Untag an object
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function untagObject(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            
            if (empty($data['tag_id']) || empty($data['object_id']) || empty($data['object_type'])) {
                return static::error('bad_request', 'Tag ID, object ID, and object type are required', 400);
            }
            
            $result = self::$tagService->untagObject(
                $data['tag_id'],
                $data['object_id'],
                $data['object_type']
            );
            
            return static::success(['data' => ['success' => $result]], 200);
            
        } catch (\Exception $e) {
            error_log('Error untagging object: ' . $e->getMessage());
            return static::error('untag_object_error', 'Failed to untag object', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get object tags
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getObjectTags(WP_REST_Request $request)
    {
        try {
            $object_id = $request->get_param('object_id');
            $object_type = $request->get_param('object_type');
            
            if (empty($object_id) || empty($object_type)) {
                return static::error('bad_request', 'Object ID and object type are required', 400);
            }
            
            $tags = self::$tagService->getObjectTags($object_id, $object_type);
            
            return static::success(['data' => $tags], 200);
            
        } catch (\Exception $e) {
            error_log('Error getting object tags: ' . $e->getMessage());
            return static::error('object_tags_error', 'Failed to retrieve object tags', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }
}

// Initialize the controller
TagController::init();
