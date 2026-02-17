<?php
namespace App\Core\Forms\Models;

use App\Core\BaseModel;

class FormAnswer extends BaseModel
{
    protected $table = 'sta_form_answers';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'submission_id',
        'field_id',
        'answer_value'
    ];

    public function submission()
    {
        return $this->belongsTo(FormSubmission::class, 'submission_id');
    }

    public function field()
    {
        return $this->belongsTo(FormField::class, 'field_id');
    }
}
