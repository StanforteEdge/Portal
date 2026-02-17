<?php

namespace App\Core\PDF\Services;

/**
 * PdfTemplateEngine
 * 
 * Template rendering engine for PDF generation
 * Handles loading templates, components, and layouts
 */
class PdfTemplateEngine
{
    /**
     * Render template with data
     * 
     * @param string $template Template path (e.g., 'requests/request-pdf')
     * @param array $data Data to pass to template
     * @param string|null $layout Layout to use
     * @return string Rendered HTML
     */
    public static function render($template, $data = [], $layout = null)
    {
        // Render template content
        $content = self::renderTemplate($template, $data);
        
        // Wrap in layout if specified
        if ($layout) {
            $content = self::applyLayout($layout, $content, $data);
        }
        
        return $content;
    }

    /**
     * Render a template file
     * 
     * @param string $template Template path
     * @param array $data Data to pass to template
     * @return string Rendered HTML
     */
    private static function renderTemplate($template, $data = [])
    {
        $templatePath = self::resolveTemplatePath($template);
        
        if (!file_exists($templatePath)) {
            throw new \Exception("PDF template not found: {$template} (looked in: {$templatePath})");
        }

        // Extract data to variables
        extract($data);
        
        // Start output buffering
        ob_start();
        
        // Include template file
        include $templatePath;
        
        // Get contents and clean buffer
        $html = ob_get_clean();
        
        return $html;
    }

    /**
     * Apply layout to content
     * 
     * @param string $layout Layout name
     * @param string $content Content to wrap
     * @param array $data Additional data
     * @return string Rendered HTML with layout
     */
    private static function applyLayout($layout, $content, $data = [])
    {
        $layoutPath = self::resolveLayoutPath($layout);
        
        if (!file_exists($layoutPath)) {
            // If layout doesn't exist, return content as-is
            error_log("PDF layout not found: {$layout}, using content without layout");
            return $content;
        }

        // Extract data to variables
        extract($data);
        
        // Make content available to layout
        $layoutContent = $content;
        
        // Start output buffering
        ob_start();
        
        // Include layout file
        include $layoutPath;
        
        // Get contents and clean buffer
        $html = ob_get_clean();
        
        return $html;
    }

    /**
     * Render a component
     * 
     * @param string $component Component name
     * @param array $data Data to pass to component
     * @return string Rendered component HTML
     */
    public static function component($component, $data = [])
    {
        $componentPath = self::resolveComponentPath($component);
        
        if (!file_exists($componentPath)) {
            error_log("PDF component not found: {$component}");
            return '';
        }

        // Extract data to variables
        extract($data);
        
        // Start output buffering
        ob_start();
        
        // Include component file
        include $componentPath;
        
        // Get contents and clean buffer
        $html = ob_get_clean();
        
        return $html;
    }

    /**
     * Resolve template path
     * 
     * @param string $template Template name (e.g., 'requests/request-pdf')
     * @return string Full path to template
     */
    private static function resolveTemplatePath($template)
    {
        $pluginPath = plugin_dir_path(dirname(dirname(__DIR__)));
        
        // Check if template is in a module
        if (strpos($template, '/') !== false) {
            list($module, $templateName) = explode('/', $template, 2);
            
            // Try module-specific template first
            $modulePath = $pluginPath . 'Modules/' . ucfirst($module) . '/Templates/' . $templateName . '.php';
            if (file_exists($modulePath)) {
                return $modulePath;
            }
            
            // Try Core module template
            $corePath = $pluginPath . 'Core/' . ucfirst($module) . '/Templates/' . $templateName . '.php';
            if (file_exists($corePath)) {
                return $corePath;
            }
        }
        
        // Try generic template in Core/PDF/Templates
        return $pluginPath . 'Core/PDF/Templates/' . $template . '.php';
    }

    /**
     * Resolve layout path
     * 
     * @param string $layout Layout name
     * @return string Full path to layout
     */
    private static function resolveLayoutPath($layout)
    {
        $pluginPath = plugin_dir_path(dirname(dirname(__DIR__)));
        return $pluginPath . 'Core/PDF/Templates/layouts/' . $layout . '.php';
    }

    /**
     * Resolve component path
     * 
     * @param string $component Component name
     * @return string Full path to component
     */
    private static function resolveComponentPath($component)
    {
        $pluginPath = plugin_dir_path(dirname(dirname(__DIR__)));
        return $pluginPath . 'Core/PDF/Templates/components/' . $component . '.php';
    }

    /**
     * Format currency
     * 
     * @param float $amount Amount
     * @param string $currency Currency code
     * @return string Formatted currency
     */
    public static function formatCurrency($amount, $currency = 'NGN')
    {
        $symbols = [
            'NGN' => '₦',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£'
        ];
        
        $symbol = $symbols[$currency] ?? $currency;
        return $symbol . number_format($amount, 2);
    }

    /**
     * Format date
     * 
     * @param string $date Date string
     * @param string $format Format
     * @return string Formatted date
     */
    public static function formatDate($date, $format = 'M d, Y')
    {
        if (!$date) {
            return '';
        }
        
        return date($format, strtotime($date));
    }

    /**
     * Escape HTML
     * 
     * @param string $text Text to escape
     * @return string Escaped text
     */
    public static function escape($text)
    {
        return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    }
}
