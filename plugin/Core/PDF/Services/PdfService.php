<?php

namespace App\Core\PDF\Services;

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * PdfService
 * 
 * Generic PDF generation service for the entire application
 * Can be used by any module (Requests, Finance, HR, etc.)
 */
class PdfService
{
    /**
     * Generate PDF from configuration
     * 
     * @param array $config Configuration array
     * @return Dompdf PDF instance
     */
    public static function generate($config)
    {
        // Extract configuration
        $template = $config['template'] ?? null;
        $layout = $config['layout'] ?? 'letter';
        $data = $config['data'] ?? [];
        $options = $config['options'] ?? [];

        if (!$template) {
            throw new \Exception('PDF template is required');
        }

        // Render HTML from template
        $html = PdfTemplateEngine::render($template, $data, $layout);

        // Initialize Dompdf
        $dompdfOptions = new Options();
        $dompdfOptions->set('isHtml5ParserEnabled', true);
        $dompdfOptions->set('isRemoteEnabled', true);
        $dompdfOptions->set('defaultFont', 'Arial');
        
        // Merge custom options
        foreach ($options as $key => $value) {
            $dompdfOptions->set($key, $value);
        }

        $dompdf = new Dompdf($dompdfOptions);
        
        // Set paper size and orientation
        $size = $options['size'] ?? 'A4';
        $orientation = $options['orientation'] ?? 'portrait';
        
        $dompdf->setPaper($size, $orientation);
        $dompdf->loadHtml($html);
        $dompdf->render();

        return $dompdf;
    }

    /**
     * Generate and download PDF
     * 
     * @param array $config Configuration array
     * @param string $filename Filename for download
     * @return void
     */
    public static function download($config, $filename)
    {
        $dompdf = self::generate($config);
        
        // Force download
        $dompdf->stream($filename, ['Attachment' => true]);
        exit;
    }

    /**
     * Generate and output PDF inline (view in browser)
     * 
     * @param array $config Configuration array
     * @param string $filename Filename
     * @return void
     */
    public static function inline($config, $filename)
    {
        $dompdf = self::generate($config);
        
        // Display inline
        $dompdf->stream($filename, ['Attachment' => false]);
        exit;
    }

    /**
     * Generate and save PDF to file
     * 
     * @param array $config Configuration array
     * @param string $path Full path to save file
     * @return bool Success status
     */
    public static function save($config, $path)
    {
        try {
            $dompdf = self::generate($config);
            
            // Get PDF output
            $output = $dompdf->output();
            
            // Ensure directory exists
            $dir = dirname($path);
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
            
            // Save to file
            file_put_contents($path, $output);
            
            return true;
        } catch (\Exception $e) {
            error_log('PdfService: Error saving PDF: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate and return PDF as base64 string
     * 
     * @param array $config Configuration array
     * @return string Base64 encoded PDF
     */
    public static function toBase64($config)
    {
        $dompdf = self::generate($config);
        $output = $dompdf->output();
        
        return base64_encode($output);
    }

    /**
     * Generate and return raw PDF output
     * 
     * @param array $config Configuration array
     * @return string Raw PDF content
     */
    public static function toOutput($config)
    {
        $dompdf = self::generate($config);
        return $dompdf->output();
    }

    /**
     * Load logo as base64
     * 
     * @param string|null $logoPath Path to logo file
     * @return string Base64 encoded logo or empty string
     */
    public static function loadLogo($logoPath = null)
    {
        if (!$logoPath) {
            // Try default locations
            $themePath = get_template_directory();
            $possiblePaths = [
                $themePath . '/assets/images/logo.png',
                $themePath . '/assets/images/logo.jpg',
                $themePath . '/assets/images/logo.svg'
            ];
            
            foreach ($possiblePaths as $path) {
                if (file_exists($path)) {
                    $logoPath = $path;
                    break;
                }
            }
        }

        if ($logoPath && file_exists($logoPath)) {
            $imageData = file_get_contents($logoPath);
            $extension = pathinfo($logoPath, PATHINFO_EXTENSION);
            $mimeType = 'image/' . ($extension === 'svg' ? 'svg+xml' : $extension);
            
            return 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
        }

        return '';
    }

    /**
     * Load image as base64
     * 
     * @param string $imagePath Path to image file
     * @return string Base64 encoded image or empty string
     */
    public static function loadImage($imagePath)
    {
        if (file_exists($imagePath)) {
            $imageData = file_get_contents($imagePath);
            $extension = pathinfo($imagePath, PATHINFO_EXTENSION);
            $mimeType = 'image/' . ($extension === 'svg' ? 'svg+xml' : $extension);
            
            return 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
        }

        return '';
    }

    /**
     * Get default CSS for PDFs
     * 
     * @return string CSS styles
     */
    public static function getDefaultStyles()
    {
        return '
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.6;
                    color: #333;
                }
                
                .pdf-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #333;
                }
                
                .pdf-header .logo {
                    max-width: 150px;
                    margin-bottom: 10px;
                }
                
                .pdf-header h1 {
                    font-size: 24px;
                    margin-bottom: 5px;
                }
                
                .pdf-header .subtitle {
                    font-size: 14px;
                    color: #666;
                }
                
                .pdf-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                
                .pdf-table th {
                    background-color: #f5f5f5;
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                    font-weight: bold;
                }
                
                .pdf-table td {
                    padding: 8px 10px;
                    border: 1px solid #ddd;
                }
                
                .pdf-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                
                .signature-block {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                    page-break-inside: avoid;
                }
                
                .signature-item {
                    text-align: center;
                    width: 30%;
                }
                
                .signature-label {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .signature-name {
                    margin: 10px 0;
                }
                
                .signature-img {
                    max-width: 100px;
                    max-height: 50px;
                    margin: 10px 0;
                }
                
                .signature-date {
                    font-size: 10px;
                    color: #666;
                }
                
                .pdf-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 10px;
                    color: #666;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .text-center {
                    text-align: center;
                }
                
                .mb-10 {
                    margin-bottom: 10px;
                }
                
                .mb-20 {
                    margin-bottom: 20px;
                }
                
                .mt-20 {
                    margin-top: 20px;
                }
            </style>
        ';
    }
}
