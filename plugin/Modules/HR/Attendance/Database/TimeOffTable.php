<?php
namespace App\Modules\HR\Attendance\Database;

class TimeOffTable
{
    private $wpdb;
    private $table_name;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_name = $wpdb->prefix . 'time_off_requests';
    }

    public function create_table()
    {
        $charset_collate = $this->wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL,
            type varchar(50) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            reason text,
            approved_by bigint(20) DEFAULT NULL,
            approved_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_dates (user_id, start_date, end_date)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function create_request($data)
    {
        return $this->wpdb->insert(
            $this->table_name,
            array(
                'user_id' => $data['user_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'type' => $data['type'],
                'reason' => $data['reason']
            ),
            array('%d', '%s', '%s', '%s', '%s')
        );
    }

    public function update_request_status($request_id, $status, $approved_by)
    {
        return $this->wpdb->update(
            $this->table_name,
            array(
                'status' => $status,
                'approved_by' => $approved_by,
                'approved_at' => current_time('mysql')
            ),
            array('id' => $request_id),
            array('%s', '%d', '%s'),
            array('%d')
        );
    }

    public function get_user_requests($user_id, $status = null)
    {
        $query = "SELECT * FROM {$this->table_name} WHERE user_id = %d";
        $params = array($user_id);

        if ($status) {
            $query .= " AND status = %s";
            $params[] = $status;
        }

        $query .= " ORDER BY created_at DESC";

        return $this->wpdb->get_results(
            $this->wpdb->prepare($query, $params)
        );
    }

    public function get_pending_requests()
    {
        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT r.*, u.display_name 
            FROM {$this->table_name} r
            JOIN {$this->wpdb->users} u ON r.user_id = u.ID
            WHERE r.status = %s
            ORDER BY r.created_at ASC",
            'pending'
        ));
    }
}
