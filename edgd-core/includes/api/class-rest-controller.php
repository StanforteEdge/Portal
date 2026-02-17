<?php
/**
 * Base REST API Controller
 *
 * @package    EDGD\Core\API
 * @since      1.0.0
 */

namespace EDGD\Core\API;

use WP_REST_Controller;
use WP_REST_Server;
use WP_REST_Response;
use WP_Error;

/**
 * Base REST API controller class.
 *
 * @package EDGD\Core\API
 * @since 1.0.0
 */
abstract class REST_Controller extends WP_REST_Controller {
    /**
     * Endpoint namespace.
     *
     * @var string
     */
    protected $namespace = 'edgd/v1';

    /**
     * Route base.
     *
     * @var string
     */
    protected $rest_base = '';

    /**
     * Permission check for requests.
     *
     * @param  WP_REST_Request $request Request data.
     * @return bool|WP_Error
     */
    public function check_permissions($request) {
        // Default implementation allows all requests.
        // Override in child classes for specific permission checks.
        return true;
    }

    /**
     * Check if a given request has access to read items.
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return WP_Error|boolean
     */
    public function get_items_permissions_check($request) {
        return $this->check_permissions($request);
    }

    /**
     * Check if a given request has access to create items.
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return WP_Error|boolean
     */
    public function create_item_permissions_check($request) {
        return $this->check_permissions($request);
    }

    /**
     * Check if a given request has access to read an item.
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return WP_Error|boolean
     */
    public function get_item_permissions_check($request) {
        return $this->check_permissions($request);
    }

    /**
     * Check if a given request has access to update an item.
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return WP_Error|boolean
     */
    public function update_item_permissions_check($request) {
        return $this->check_permissions($request);
    }

    /**
     * Check if a given request has access to delete an item.
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return WP_Error|boolean
     */
    public function delete_item_permissions_check($request) {
        return $this->check_permissions($request);
    }

    /**
     * Format a response for API success.
     *
     * @param  mixed   $data    Response data.
     * @param  integer $status  HTTP status code.
     * @return WP_REST_Response
     */
    protected function success($data = null, $status = 200) {
        $response = [
            'success' => true,
            'data'    => $data,
        ];

        return new WP_REST_Response($response, $status);
    }

    /**
     * Format a response for API error.
     *
     * @param  string  $message Error message.
     * @param  string  $code    Error code.
     * @param  integer $status  HTTP status code.
     * @param  array   $data    Additional error data.
     * @return WP_Error
     */
    protected function error($message, $code = 'error', $status = 400, $data = []) {
        return new WP_Error(
            $code,
            $message,
            array_merge(['status' => $status], $data)
        );
    }

    /**
     * Get the query params for collections.
     *
     * @return array
     */
    public function get_collection_params() {
        return [
            'page'     => [
                'description'       => __('Current page of the collection.', 'edgd-core'),
                'type'              => 'integer',
                'default'           => 1,
                'sanitize_callback' => 'absint',
                'validate_callback' => 'rest_validate_request_arg',
                'minimum'           => 1,
            ],
            'per_page' => [
                'description'       => __('Maximum number of items to be returned in result set.', 'edgd-core'),
                'type'              => 'integer',
                'default'           => 10,
                'minimum'           => 1,
                'maximum'           => 100,
                'sanitize_callback' => 'absint',
                'validate_callback' => 'rest_validate_request_arg',
            ],
            'orderby'  => [
                'description'       => __('Sort collection by object attribute.', 'edgd-core'),
                'type'              => 'string',
                'default'           => 'id',
                'sanitize_callback' => 'sanitize_key',
                'validate_callback' => 'rest_validate_request_arg',
            ],
            'order'    => [
                'description'       => __('Order sort attribute ascending or descending.', 'edgd-core'),
                'type'              => 'string',
                'default'           => 'desc',
                'enum'              => ['asc', 'desc'],
                'validate_callback' => 'rest_validate_request_arg',
            ],
        ];
    }
}
