<?php
namespace App\Modules\HR\Attendance\Database;

class AttendanceTable
{
    private $wpdb;
    private $table_name;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $wpdb->prefix . 'attendance_records';
    }

    public function create_table()
    {
        $charset_collate = $this->wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            date date NOT NULL,
            check_in datetime DEFAULT NULL,
            check_out datetime DEFAULT NULL,
            status varchar(20) NOT NULL DEFAULT 'present',
            work_mode varchar(20) NOT NULL DEFAULT 'office',
            notes text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_date (user_id, date)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function record_attendance($user_id, $status = 'present', $work_mode = 'office')
    {
        $date = current_time('Y-m-d');

        $existing = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE user_id = %d AND date = %s",
            $user_id,
            $date
        ));

        if (!$existing) {
            return $this->wpdb->insert(
                $this->table_name,
                array(
                    'user_id' => $user_id,
                    'date' => $date,
                    'check_in' => current_time('mysql'),
                    'status' => $status,
                    'work_mode' => $work_mode
                ),
                array('%d', '%s', '%s', '%s', '%s')
            );
        }

        return false;
    }

    public function update_check_out($user_id)
    {
        $date = current_time('Y-m-d');

        return $this->wpdb->update(
            $this->table_name,
            array('check_out' => current_time('mysql')),
            array('user_id' => $user_id, 'date' => $date),
            array('%s'),
            array('%d', '%s')
        );
    }

    public function get_user_attendance($user_id, $start_date, $end_date)
    {
        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
            WHERE user_id = %d 
            AND date BETWEEN %s AND %s 
            ORDER BY date DESC",
            $user_id,
            $start_date,
            $end_date
        ));
    }
}
