<?php

namespace App\Core\Notification\Services;

use App\Core\Notification\Models\Template;
use WP_Error;

/**
 * Template Service
 * 
 * Handles business logic for notification templates
 */
class TemplateService
{

    /**
     * Get a template by ID
     *
     * @param string $id
     * @return object|WP_Error
     */
    public static function getTemplate($id)
    {
        $model = new Template();
        $template = $model->find($id);

        if (!$template) {
            return new WP_Error(
                'template_not_found',
                'Template not found',
                ['status' => 404]
            );
        }

        return $template;
    }

    /**
     * Get a template by name, type, and language
     *
     * @param string $name
     * @param string $templateType
     * @param string $language
     * @return \App\Core\Notification\Models\Template|WP_Error
     */
    public static function getTemplateByName($name, $templateType = 'notification', $language = 'en')
    {
        $template = Template::getByName($name, $templateType, $language);
        if (!$template) {
            return new WP_Error(
                'template_not_found',
                'Template not found',
                ['status' => 404]
            );
        }
        return $template;
    }

    /**
     * Get templates with optional filters
     *
     * @param array $filters Optional filters (template_type, language, is_active, etc.)
     * @param int $limit Optional limit
     * @param int $offset Optional offset
     * @return array Array of template objects
     */
    public static function getTemplates($filters = [], $limit = null, $offset = 0)
    {
        try {
            $template = new Template();
            
            // Apply filters
            if (!empty($filters['template_type'])) {
                $template->where('template_type', $filters['template_type']);
            }
            
            if (!empty($filters['language'])) {
                $template->where('language', $filters['language']);
            }
            
            if (isset($filters['is_active'])) {
                $template->where('is_active', (bool)$filters['is_active']);
            }
            
            if (!empty($filters['notification_type'])) {
                $template->where('notification_type', $filters['notification_type']);
            }
            
            // Apply ordering
            $template->orderBy('created_at', 'desc');
            
            // Apply pagination
            if ($limit) {
                $template->limit($limit);
                
                if ($offset) {
                    $template->offset($offset);
                }
            }
            
            // Execute the query and return results
            return $template->get();
            
        } catch (\Exception $e) {
            error_log('Error in TemplateService::getTemplates: ' . $e->getMessage());
            return new WP_Error(
                'templates_error',
                'Failed to retrieve templates',
                ['status' => 500, 'details' => $e->getMessage()]
            );
        }
    }

    /**
     * Render a template with the given data
     *
     * @param string $name
     * @param array $data
     * @param string $templateType
     * @param string $language
     * @return array|WP_Error
     */
    public static function renderTemplate($name, $data = [], $templateType = 'notification', $language = 'en')
    {
        $template = self::getTemplateByName($name, $templateType, $language);

        if (is_wp_error($template)) {
            return $template;
        }

        try {
            return $template->render($data);
        } catch (\Exception $e) {
            return new WP_Error(
                'template_render_error',
                'Failed to render template: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Create a new template
     *
     * @param array $data
     * @return object|WP_Error
     */
    public static function createTemplate($data)
    {
        try {
            // Generate UUID if not provided
            if (empty($data['id'])) {
                $data['id'] = wp_generate_uuid4();
            }

            $model = new Template();
            $created = $model->create($data);
            if ($created === false) {
                return new WP_Error(
                    'template_creation_failed',
                    'Failed to create template',
                    ['status' => 500]
                );
            }

            return $created;
        } catch (\Exception $e) {
            return new WP_Error(
                'template_creation_failed',
                'Failed to create template: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Update an existing template
     *
     * @param string $id
     * @param array $data
     * @return object|WP_Error
     */
    public static function updateTemplate($id, $data)
    {
        try {
            $existing = self::getTemplate($id);
            if (is_wp_error($existing)) {
                return $existing;
            }

            $model = new Template();
            $updated = $model->update($id, $data);
            return $updated;
        } catch (\Exception $e) {
            return new WP_Error(
                'template_update_failed',
                'Failed to update template: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    /**
     * Delete a template
     *
     * @param string $id
     * @return int|bool|WP_Error Number of rows deleted or false
     */
    public static function deleteTemplate($id)
    {
        try {
            $existing = self::getTemplate($id);
            if (is_wp_error($existing)) {
                return $existing;
            }

            $model = new Template();
            return $model->delete($id);
        } catch (\Exception $e) {
            return new WP_Error(
                'template_deletion_failed',
                'Failed to delete template: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }
}
