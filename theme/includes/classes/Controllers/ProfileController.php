<?php
namespace Stanfort\Controllers;

use Stanfort\Models\EmployeeProfile;

class ProfileController {
    protected $employee;
    
    public function __construct() {
        // Get current user's employee profile
        $user_id = get_current_user_id();
        $this->employee = (new EmployeeProfile())->where('wp_user_id', $user_id)[0] ?? null;
        
        // Add menu pages
        add_action('admin_menu', [$this, 'addMenuPages']);
        
        // Add AJAX handlers
        add_action('wp_ajax_update_profile', [$this, 'handleProfileUpdate']);
        add_action('wp_ajax_update_contact', [$this, 'handleContactUpdate']);
        add_action('wp_ajax_update_emergency_contact', [$this, 'handleEmergencyContactUpdate']);
    }
    
    public function addMenuPages() {
        // Main Profile Page
        add_menu_page(
            'My Profile',
            'My Profile',
            'read',
            'profile',
            [$this, 'renderProfilePage'],
            'dashicons-admin-users',
            30
        );
        
        // Overview
        add_submenu_page(
            'profile',
            'My Profile',
            'Overview',
            'read',
            'profile',
            [$this, 'renderProfilePage']
        );
        
        // Documents
        add_submenu_page(
            'profile',
            'My Documents',
            'Documents',
            'read',
            'profile-documents',
            [$this, 'renderDocumentsPage']
        );
        
        // Bio & Skills
        add_submenu_page(
            'profile',
            'Bio & Skills',
            'Bio & Skills',
            'read',
            'profile-bio',
            [$this, 'renderBioPage']
        );
        
        // Job Description
        add_submenu_page(
            'profile',
            'Job Description',
            'Job Description',
            'read',
            'profile-jd',
            [$this, 'renderJdPage']
        );
    }
    
    public function renderProfilePage() {
        if (!$this->employee) {
            echo '<div class="notice notice-error"><p>Employee profile not found. Please contact HR.</p></div>';
            return;
        }
        
        include get_template_directory() . '/templates/staff/profile.php';
    }
    
    public function renderDocumentsPage() {
        include get_template_directory() . '/templates/staff/profile-documents.php';
    }
    
    public function renderBioPage() {
        include get_template_directory() . '/templates/staff/profile-bio.php';
    }
    
    public function renderJdPage() {
        include get_template_directory() . '/templates/staff/profile-jd.php';
    }
    
    public function handleProfileUpdate() {
        check_ajax_referer('profile_update', 'nonce');
        
        if (!$this->employee) {
            wp_send_json_error('Employee profile not found');
        }
        
        $data = array_intersect_key($_POST, array_flip([
            'first_name',
            'last_name',
            'other_names',
            'date_of_birth',
            'gender',
            'marital_status',
            'nationality',
            'national_id',
            'tax_id',
            'pension_id'
        ]));
        
        $updated = $this->employee->update($this->employee->id, $data);
        
        if ($updated) {
            wp_send_json_success('Profile updated successfully');
        } else {
            wp_send_json_error('Failed to update profile');
        }
    }
    
    public function handleContactUpdate() {
        check_ajax_referer('contact_update', 'nonce');
        
        if (!$this->employee) {
            wp_send_json_error('Employee profile not found');
        }
        
        // Implementation for contact update
        wp_send_json_success('Contact updated successfully');
    }
    
    public function handleEmergencyContactUpdate() {
        check_ajax_referer('emergency_contact_update', 'nonce');
        
        if (!$this->employee) {
            wp_send_json_error('Employee profile not found');
        }
        
        // Implementation for emergency contact update
        wp_send_json_success('Emergency contact updated successfully');
    }
}
