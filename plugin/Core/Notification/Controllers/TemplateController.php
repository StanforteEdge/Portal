<?php

namespace App\Core\Notification\Controllers;

use App\Core\Notification\Services\TemplateService;
use App\Utils\BaseController;
use WP_REST_Request;

class TemplateController extends BaseController
{

        /**
     * List templates with optional filters
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function list($request)
    {


        try {

            error_log('TemplateController::list - Request: ' . json_encode($request->get_params()));
            // Get and sanitize parameters
            $filters = [
                'template_type' => sanitize_text_field($request->get_param('template_type') ?? 'account'),
                'language' => sanitize_text_field($request->get_param('language') ?? 'en'),
                'is_active' => $request->get_param('active_only') !== 'false'
            ];
            
            // Get templates from service
            $templates = TemplateService::getTemplates($filters);

            // $templates = [];

            if (is_wp_error($templates)) {
                return static::error($templates);
            }
            
            // Format response with unified shape: data + meta
            return static::success(['data' => $templates], 200, [
                'count' => count($templates),
                'filters' => $filters
            ]);
            
        } catch (\Exception $e) {
            // Log the error for debugging
            error_log('TemplateController::list - Error: ' . $e->getMessage());
            
            // Return error response
            return static::error('templates_error', 'Failed to retrieve templates', 500, [
                'details' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get a template by ID
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get($request)
    {
        $id = $request->get_param('id');
        $template = TemplateService::getTemplate($id);
        
        if (is_wp_error($template)) {
            return static::error($template);
        }
        
        return static::success(['data' => $template], 200);
    }

    /**
     * Create a new template
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function create($request)
    {
        $data = $request->get_json_params();
        $result = TemplateService::createTemplate($data);
        
        if (is_wp_error($result)) {
            return static::error($result);
        }
        
        return static::success(['data' => $result], 201);
    }

    /**
     * Update an existing template
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function update($request)
    {
        $id = $request->get_param('id');
        $data = $request->get_json_params();
        
        $result = TemplateService::updateTemplate($id, $data);
        
        if (is_wp_error($result)) {
            return static::error($result);
        }
        
        return static::success(['data' => $result], 200);
    }

    /**
     * Delete a template
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function delete($request)
    {
        $id = $request->get_param('id');
        $result = TemplateService::deleteTemplate($id);
        
        if (is_wp_error($result)) {
            return static::error($result);
        }
        
        return static::success(null, 204);
    }

    /**
     * Render a template with the given data
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function render($request)
    {
        $name = $request->get_param('name');
        $templateType = $request->get_param('template_type') ?? 'notification';
        $language = $request->get_param('language') ?? 'en';
        $data = $request->get_json_params()['data'] ?? [];
        
        $result = TemplateService::renderTemplate($name, $data, $templateType, $language);
        
        if (is_wp_error($result)) {
            return static::error($result);
        }
        
        // Wrap render output under data per standard
        return static::success(['data' => $result], 200);
    }
}
