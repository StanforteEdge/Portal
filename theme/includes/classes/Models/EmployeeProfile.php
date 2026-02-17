<?php
namespace Stanfort\Models;

class EmployeeProfile extends BaseModel {
    protected $table = 'employee_profiles';
    
    protected $fillable = [
        'wp_user_id',
        'employee_id',
        'first_name',
        'last_name',
        'other_names',
        'date_of_birth',
        'gender',
        'marital_status',
        'nationality',
        'national_id',
        'tax_id',
        'pension_id',
        'employment_type',
        'role',
        'position',
        'join_date',
        'end_date',
        'employment_status'
    ];
    
    public function contacts() {
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->wpdb->prefix}employee_contacts WHERE employee_id = %d",
                $this->id
            )
        );
    }
    
    public function emergencyContacts() {
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->wpdb->prefix}emergency_contacts WHERE employee_id = %d",
                $this->id
            )
        );
    }
    
    public function getFullName() {
        $name = $this->first_name . ' ' . $this->last_name;
        if (!empty($this->other_names)) {
            $name .= ' ' . $this->other_names;
        }
        return $name;
    }
    
    public function getAge() {
        if (empty($this->date_of_birth)) {
            return null;
        }
        return date_diff(
            date_create($this->date_of_birth),
            date_create('today')
        )->y;
    }
    
    public function getEmploymentDuration() {
        if (empty($this->join_date)) {
            return null;
        }
        return date_diff(
            date_create($this->join_date),
            date_create($this->end_date ?? 'today')
        );
    }
    
    public static function generateEmployeeId() {
        global $wpdb;
        
        // Get the last employee ID
        $last_id = $wpdb->get_var("
            SELECT employee_id 
            FROM {$wpdb->prefix}employee_profiles 
            ORDER BY id DESC 
            LIMIT 1
        ");
        
        if (!$last_id) {
            return 'EMP001';
        }
        
        // Extract the number part and increment
        $number = intval(substr($last_id, 3));
        $number++;
        
        // Format back to employee ID
        return 'EMP' . str_pad($number, 3, '0', STR_PAD_LEFT);
    }
    
    public function createWithUser(array $data) {
        // Create WordPress user first
        $userdata = [
            'user_login' => $data['email'],
            'user_email' => $data['email'],
            'user_pass'  => wp_generate_password(),
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'role'       => 'subscriber'
        ];
        
        $user_id = wp_insert_user($userdata);
        
        if (is_wp_error($user_id)) {
            return $user_id;
        }
        
        // Create employee profile
        $data['wp_user_id'] = $user_id;
        $data['employee_id'] = self::generateEmployeeId();
        
        return $this->create($data);
    }
}
