<?php
namespace Stanfort\Controllers\Admin;

use Stanfort\Models\EmployeeProfile;

class StaffController {
    protected $employee;
    
    public function __construct() {
        $this->employee = new EmployeeProfile();
        
        // Add menu pages
        add_action('admin_menu', [$this, 'addMenuPages']);
        
        // Add AJAX handlers
        add_action('wp_ajax_admin_create_employee', [$this, 'handleEmployeeCreate']);
        add_action('wp_ajax_admin_update_employee', [$this, 'handleEmployeeUpdate']);
        add_action('wp_ajax_admin_delete_employee', [$this, 'handleEmployeeDelete']);
    }
    
    public function addMenuPages() {
        // Only visible to HR and admin roles
        if (!current_user_can('manage_options') && !current_user_can('hr_role')) {
            return;
        }
        
        // Main Staff Management Page
        add_menu_page(
            'Staff Management',
            'Staff',
            'manage_options',
            'staff',
            [$this, 'renderStaffListPage'],
            'dashicons-groups',
            31
        );
        
        // Staff Directory
        add_submenu_page(
            'staff',
            'Staff Directory',
            'Directory',
            'manage_options',
            'staff',
            [$this, 'renderStaffListPage']
        );
        
        // Add/Edit Staff
        add_submenu_page(
            'staff',
            'Add Employee',
            'Add Employee',
            'manage_options',
            'staff-form',
            [$this, 'renderStaffFormPage']
        );
        
        // Documents
        add_submenu_page(
            'staff',
            'Staff Documents',
            'Documents',
            'manage_options',
            'staff-documents',
            [$this, 'renderDocumentsPage']
        );
        
        // HR Reports
        add_submenu_page(
            'staff',
            'HR Reports',
            'Reports',
            'manage_options',
            'staff-reports',
            [$this, 'renderReportsPage']
        );
    }
    
    public function renderStaffListPage() {
        include get_template_directory() . '/templates/staff/admin-list.php';
    }
    
    public function renderStaffFormPage() {
        $employee_id = $_GET['id'] ?? null;
        if (!$employee_id) {
            require_once get_template_directory() . '/templates/staff/admin-form.php';
        } else {
            $employee = $this->employee->find($employee_id);
            if (!$employee) {
                wp_die('Employee not found');
            }
            require_once get_template_directory() . '/templates/staff/admin-form.php';
        }
    }
    
    public function renderDocumentsPage() {
        include get_template_directory() . '/templates/staff/admin-documents.php';
    }
    
    public function renderReportsPage() {
        include get_template_directory() . '/templates/staff/hr-reports.php';
    }
    
    public function handleEmployeeCreate() {
        check_ajax_referer('employee_create', 'nonce');
        
        if (!current_user_can('manage_options') && !current_user_can('hr_role')) {
            wp_send_json_error('Insufficient permissions');
        }
        
        $data = $this->validateEmployeeData($_POST);
        if (is_wp_error($data)) {
            wp_send_json_error($data->get_error_message());
        }
        
        $employee_id = $this->employee->createWithUser($data);
        
        if (is_wp_error($employee_id)) {
            wp_send_json_error($employee_id->get_error_message());
        }
        
        wp_send_json_success([
            'message' => 'Employee created successfully',
            'employee_id' => $employee_id
        ]);
    }
    
    public function handleEmployeeUpdate() {
        check_ajax_referer('employee_update', 'nonce');
        
        if (!current_user_can('manage_options') && !current_user_can('hr_role')) {
            wp_send_json_error('Insufficient permissions');
        }
        
        $employee_id = $_POST['id'] ?? null;
        if (!$employee_id) {
            wp_send_json_error('Employee ID is required');
        }
        
        $data = $this->validateEmployeeData($_POST);
        if (is_wp_error($data)) {
            wp_send_json_error($data->get_error_message());
        }
        
        $updated = $this->employee->update($employee_id, $data);
        
        if ($updated) {
            wp_send_json_success('Employee updated successfully');
        } else {
            wp_send_json_error('Failed to update employee');
        }
    }
    
    public function handleEmployeeDelete() {
        check_ajax_referer('employee_delete', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }
        
        $employee_id = $_POST['id'] ?? null;
        if (!$employee_id) {
            wp_send_json_error('Employee ID is required');
        }
        
        // Don't actually delete, just mark as inactive
        $updated = $this->employee->update($employee_id, [
            'employment_status' => 'inactive',
            'end_date' => date('Y-m-d')
        ]);
        
        if ($updated) {
            wp_send_json_success('Employee deactivated successfully');
        } else {
            wp_send_json_error('Failed to deactivate employee');
        }
    }
    
    protected function validateEmployeeData($data) {
        $required = [
            'first_name',
            'last_name',
            'email',
            'employment_type',
            'position'
        ];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return new \WP_Error(
                    'missing_required',
                    sprintf('Field %s is required', str_replace('_', ' ', $field))
                );
            }
        }
        
        if (!is_email($data['email'])) {
            return new \WP_Error('invalid_email', 'Invalid email address');
        }
        
        return array_intersect_key($data, array_flip($this->employee->getFillable()));
    }
}
