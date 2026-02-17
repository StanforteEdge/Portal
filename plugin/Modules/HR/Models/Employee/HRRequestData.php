<?php

namespace App\Modules\HR\Models\Employee;

use App\Utils\BaseModel;

/**
 * HRRequestData Model (EAV)
 * 
 * Stores HR request field values with type-specific columns
 */
class HRRequestData extends BaseModel
{
    protected $table = 'sta_hr_request_data';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'request_id',
        'field_id',
        'field_key',
        'value_text',
        'value_number',
        'value_date',
        'value_datetime',
        'value_file_url',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'value_number' => 'decimal:4',
        'value_date' => 'date',
        'value_datetime' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get data by request ID
     * 
     * @param string $requestId
     * @return array
     */
    public static function getByRequest($requestId)
    {
        $instance = new static();
        return $instance->where('request_id', $requestId)->get();
    }

    /**
     * Get data as key-value array
     * 
     * @param string $requestId
     * @return array
     */
    public static function getDataArray($requestId)
    {
        $data = self::getByRequest($requestId);
        $result = [];

        foreach ($data as $item) {
            $value = null;
            if ($item->value_text !== null)
                $value = $item->value_text;
            elseif ($item->value_number !== null)
                $value = $item->value_number;
            elseif ($item->value_datetime !== null)
                $value = $item->value_datetime;
            elseif ($item->value_date !== null)
                $value = $item->value_date;
            elseif ($item->value_file_url !== null)
                $value = $item->value_file_url;

            $result[$item->field_key] = $value;
        }

        return $result;
    }

    /**
     * Search requests by field value
     * 
     * @param string $fieldKey
     * @param mixed $value
     * @param string $operator
     * @return array
     */
    public static function searchByField($fieldKey, $value, $operator = '=')
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_hr_request_data';

        $column = 'value_text';
        if (is_numeric($value)) {
            $column = 'value_number';
        } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            $column = 'value_date';
        }

        $sql = $wpdb->prepare(
            "SELECT DISTINCT request_id FROM {$table} 
             WHERE field_key = %s AND {$column} {$operator} %s",
            $fieldKey,
            $value
        );

        return $wpdb->get_col($sql);
    }

    /**
     * Get value for a specific field
     * 
     * @param string $requestId
     * @param string $fieldKey
     * @return mixed
     */
    public static function getValue($requestId, $fieldKey)
    {
        $instance = new static();
        $record = $instance->where('request_id', $requestId)
            ->where('field_key', $fieldKey)
            ->first();

        if (!$record)
            return null;

        if ($record->value_text !== null)
            return $record->value_text;
        if ($record->value_number !== null)
            return $record->value_number;
        if ($record->value_datetime !== null)
            return $record->value_datetime;
        if ($record->value_date !== null)
            return $record->value_date;
        if ($record->value_file_url !== null)
            return $record->value_file_url;

        return null;
    }
}
