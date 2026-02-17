<?php
namespace Stanfort\Models;

abstract class BaseModel {
    protected $wpdb;
    protected $table;
    protected $primary_key = 'id';
    protected $fillable = [];
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table = $wpdb->prefix . $this->table;
    }
    
    public function find($id) {
        return $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE {$this->primary_key} = %d",
                $id
            )
        );
    }
    
    public function create(array $data) {
        $data = array_intersect_key($data, array_flip($this->fillable));
        
        $this->wpdb->insert($this->table, $data);
        return $this->wpdb->insert_id;
    }
    
    public function update($id, array $data) {
        $data = array_intersect_key($data, array_flip($this->fillable));
        
        return $this->wpdb->update(
            $this->table,
            $data,
            [$this->primary_key => $id]
        );
    }
    
    public function delete($id) {
        return $this->wpdb->delete(
            $this->table,
            [$this->primary_key => $id]
        );
    }
    
    public function all() {
        return $this->wpdb->get_results("SELECT * FROM {$this->table}");
    }
    
    public function where($column, $value) {
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE {$column} = %s",
                $value
            )
        );
    }
    
    public function whereIn($column, array $values) {
        $placeholders = array_fill(0, count($values), '%s');
        $placeholders = implode(',', $placeholders);
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE {$column} IN ({$placeholders})",
                $values
            )
        );
    }
}
