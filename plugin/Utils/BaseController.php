<?php

namespace App\Utils;

use \WP_Error;
use \WP_REST_Response;

abstract class BaseController {
    protected $service;

    /**
     * Success response helper (unified)
     *
     * Controllers should call this to return a standardized success payload.
     * If $data is an associative array with custom keys, it will be used as-is.
     * Otherwise, data is wrapped under a `data` key. Optional meta is appended.
     */
    public static function success($data = null, int $status = 200, ?array $meta = null): WP_REST_Response
    {
        $body = [
            'success' => true,  // Always true for success() method
            'data' => $data ?? []
        ];
        if ($meta !== null) {
            $body['meta'] = $meta;
        }
        return new WP_REST_Response($body, $status);
    }

    /**
     * Error response helper (unified)
     *
     * Accepts either a WP_Error instance or explicit code/message/status/details.
     * Example usages:
     *  - BaseController::error(new WP_Error('not_found', 'Not found', ['status' => 404]));
     *  - BaseController::error('invalid_request', 'Missing fields', 422, ['fields' => ['email']]);
     */
    public static function error($error, string $message = '', int $status = 400, ?array $details = null): WP_REST_Response
    {
        $errorData = [];
        
        if ($error instanceof WP_Error) {
            $errorData = [
                'code' => $error->get_error_code() ?: 'error',
                'message' => $error->get_error_message() ?: 'An error occurred',
                'details' => $error->get_error_data() ?: null
            ];
            $status = $error->get_error_data()['status'] ?? $status;
        } else {
            $errorData = [
                'code' => $error,
                'message' => $message,
                'details' => $details
            ];
        }
        
        return new WP_REST_Response([
            'success' => false,
            'error' => $errorData
        ], $status);
    }

    /**
     * Unified success responder. Prefer this over success() in new code.
     *
     * @param mixed $data
     * @param int $status
     * @param array|null $meta
     * @return WP_REST_Response
     */
    public static function respond($data = null, int $status = 200, ?array $meta = null): WP_REST_Response
    {
        $body = is_array($data) && array_keys($data) !== range(0, count($data) - 1)
            ? $data
            : ['data' => $data];
        if ($meta !== null) {
            $body['meta'] = $meta;
        }
        return new WP_REST_Response($body, $status);
    }

    /**
     * Respond with entity-specific key e.g. respondData('document', $doc)
     */
    public static function respondData(string $key, $data, int $status = 200, ?array $meta = null): WP_REST_Response
    {
        $body = [$key => $data];
        if ($meta !== null) {
            $body['meta'] = $meta;
        }
        return new WP_REST_Response($body, $status);
    }

    /**
     * Convert WP_Error into unified error response.
     */
    public static function respondWpError(WP_Error $error): WP_REST_Response
    {
        $status = (int) ($error->get_error_data()['status'] ?? 400);
        $details = $error->get_error_data() ?: [];
        return new WP_REST_Response([
            'error' => [
                'code' => $error->get_error_code(),
                'message' => $error->get_error_message(),
                'details' => $details,
            ]
        ], $status ?: 400);
    }

    /**
     * Respond with explicit code/message without constructing WP_Error.
     */
    public static function respondErrorMessage(string $code, string $message, int $status = 400, array $details = []): WP_REST_Response
    {
        return new WP_REST_Response([
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ]
        ], $status);
    }
}
