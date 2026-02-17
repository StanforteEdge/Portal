<?php

namespace App\Core\Forms\Models;

use App\Utils\BaseModel;

class FormSection extends BaseModel
{
    protected $table = 'sta_form_sections';
    protected $primaryKey = 'id';

    protected $fillable = [
        'form_id',
        'section_title',
        'section_description',
        'display_order',
        'is_collapsible',
        'is_repeatable'
    ];

    protected $casts = [
        'is_collapsible' => 'boolean',
        'is_repeatable' => 'boolean'
    ];

    /**
     * Get the form this section belongs to
     *
     * @return object|null
     */
    public function getForm()
    {
        return $this->belongsTo(Form::class, 'form_id');
    }

    /**
     * Get all fields in this section
     *
     * @return array
     */
    public function getFields()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'sta_form_fields';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} WHERE section_id = %s ORDER BY display_order ASC",
            $this->id
        ));
    }

    /**
     * Get all sections for a form
     *
     * @param string $formId
     * @return array
     */
    public static function getByForm($formId)
    {
        global $wpdb;
        $model = new self();
        $table = $model->getTableName();

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} WHERE form_id = %s ORDER BY display_order ASC",
            $formId
        ));
    }
}
