<?php
namespace App\Core\Taxonomy\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use App\Core\Taxonomy\Services\TaxonomyService;
use App\Utils\BaseController;

class TaxonomyController extends BaseController
{
    /** @var TaxonomyService */
    protected static $taxonomyService;

    /**
     * Initialize the controller
     */
    public static function init()
    {
        self::$taxonomyService = new TaxonomyService();
    }

    /**
     * List all taxonomies
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function listTaxonomies(WP_REST_Request $request)
    {
        try {
            $filters = [
                'page' => $request->get_param('page') ? (int) $request->get_param('page') : 1,
                'per_page' => $request->get_param('per_page') ? (int) $request->get_param('per_page') : 20,
            ];

            if ($request->get_param('hierarchical') !== null) {
                $filters['hierarchical'] = (bool) $request->get_param('hierarchical');
            }

            if ($request->get_param('is_system') !== null) {
                $filters['is_system'] = (bool) $request->get_param('is_system');
            }

            $taxonomies = self::$taxonomyService->listTaxonomies($filters);

            // BaseController::success wraps data in 'data' key or uses supplied array structure effectively
            // But paginated results usually have top-level keys like data, total, etc.
            // listTaxonomies returns array from paginate().

            return static::success($taxonomies['data'], 200, [
                'total' => $taxonomies['total'],
                'per_page' => $taxonomies['per_page'],
                'current_page' => $taxonomies['current_page'],
                'last_page' => $taxonomies['last_page'],
            ]);

        } catch (\Exception $e) {
            error_log('Error listing taxonomies: ' . $e->getMessage());
            return static::error('taxonomies_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Get taxonomy by ID
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function getTaxonomy(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Taxonomy ID is required', 400);
            }

            $taxonomy = self::$taxonomyService->getTaxonomyById($id);
            if (!$taxonomy) {
                return static::error('not_found', 'Taxonomy not found', 404);
            }

            return static::success(['data' => $taxonomy], 200);

        } catch (\Exception $e) {
            error_log('Error getting taxonomy: ' . $e->getMessage());
            return static::error('taxonomy_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Create new taxonomy
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function createTaxonomy(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            $taxonomy = self::$taxonomyService->createTaxonomy($data);
            return static::success(['data' => $taxonomy], 201);

        } catch (\Exception $e) {
            error_log('Error creating taxonomy: ' . $e->getMessage());
            return static::error('taxonomy_create_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Update taxonomy
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function updateTaxonomy(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Taxonomy ID is required', 400);
            }

            $data = $request->get_json_params();
            $result = self::$taxonomyService->updateTaxonomy($id, $data);

            if (!$result) {
                return static::error('not_found', 'Taxonomy not found', 404);
            }

            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error updating taxonomy: ' . $e->getMessage());
            return static::error('taxonomy_update_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Delete taxonomy
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function deleteTaxonomy(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Taxonomy ID is required', 400);
            }

            $result = self::$taxonomyService->deleteTaxonomy($id);
            if (!$result) {
                return static::error('not_found', 'Taxonomy not found', 404);
            }

            return static::success(null, 204);

        } catch (\Exception $e) {
            error_log('Error deleting taxonomy: ' . $e->getMessage());
            return static::error('taxonomy_delete_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * List terms for a taxonomy
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function listTerms(WP_REST_Request $request)
    {
        try {
            $taxonomy_id = $request->get_param('taxonomy_id');
            if (empty($taxonomy_id)) {
                return static::error('bad_request', 'Taxonomy ID is required', 400);
            }

            $filters = [
                'page' => $request->get_param('page') ? (int) $request->get_param('page') : 1,
                'per_page' => $request->get_param('per_page') ? (int) $request->get_param('per_page') : 20,
            ];

            if ($request->get_param('is_active') !== null) {
                $filters['is_active'] = (bool) $request->get_param('is_active');
            }

            if ($request->get_param('parent_id') !== null) {
                $filters['parent_id'] = $request->get_param('parent_id');
            }

            $terms = self::$taxonomyService->getTermsByTaxonomy($taxonomy_id, $filters);

            return static::success([
                'data' => $terms['data']
            ], 200, [
                'total' => $terms['total'],
                'per_page' => $terms['per_page'],
                'current_page' => $terms['current_page'],
                'last_page' => $terms['last_page'],
            ]);

        } catch (\Exception $e) {
            error_log('Error listing terms: ' . $e->getMessage());
            return static::error('terms_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Get term tree
     */
    public static function getTermTree(WP_REST_Request $request)
    {
        try {
            $taxonomy_id = $request->get_param('taxonomy_id');
            if (empty($taxonomy_id)) {
                return static::error('bad_request', 'Taxonomy ID is required', 400);
            }

            $filters = [];
            if ($request->get_param('is_active') !== null) {
                $filters['is_active'] = (bool) $request->get_param('is_active');
            }

            $tree = self::$taxonomyService->getTermTree($taxonomy_id, $filters);
            return static::success(['data' => $tree], 200);

        } catch (\Exception $e) {
            error_log('Error getting term tree: ' . $e->getMessage());
            return static::error('term_tree_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Create new term
     */
    public static function createTerm(WP_REST_Request $request)
    {
        try {
            $data = $request->get_json_params();
            $term = self::$taxonomyService->createTerm($data);
            return static::success(['data' => $term], 201);

        } catch (\Exception $e) {
            error_log('Error creating term: ' . $e->getMessage());
            return static::error('term_create_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Get term by ID
     */
    public static function getTerm(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Term ID is required', 400);
            }

            $term = self::$taxonomyService->getTermById($id);
            if (!$term) {
                return static::error('not_found', 'Term not found', 404);
            }
            return static::success(['data' => $term], 200);

        } catch (\Exception $e) {
            error_log('Error getting term: ' . $e->getMessage());
            return static::error('term_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Update term
     */
    public static function updateTerm(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Term ID is required', 400);
            }

            $data = $request->get_json_params();
            $result = self::$taxonomyService->updateTerm($id, $data);

            if (!$result) {
                return static::error('not_found', 'Term not found', 404);
            }
            return static::success(['data' => $result], 200);

        } catch (\Exception $e) {
            error_log('Error updating term: ' . $e->getMessage());
            return static::error('term_update_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Delete term
     */
    public static function deleteTerm(WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');
            if (empty($id)) {
                return static::error('bad_request', 'Term ID is required', 400);
            }

            $result = self::$taxonomyService->deleteTerm($id);
            if (!$result) {
                return static::error('not_found', 'Term not found', 404);
            }
            return static::success(null, 204);

        } catch (\Exception $e) {
            error_log('Error deleting term: ' . $e->getMessage());
            return static::error('term_delete_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * Get child terms
     */
    public static function getChildTerms(WP_REST_Request $request)
    {
        try {
            $parent_id = $request->get_param('parent_id');
            if (empty($parent_id)) {
                return static::error('bad_request', 'Parent ID is required', 400);
            }

            $terms = self::$taxonomyService->getChildTerms($parent_id);
            return static::success(['data' => $terms], 200);

        } catch (\Exception $e) {
            error_log('Error getting children: ' . $e->getMessage());
            return static::error('term_children_error', $e->getMessage(), $e->getCode() ?: 500);
        }
    }
}

// Initialize
TaxonomyController::init();
