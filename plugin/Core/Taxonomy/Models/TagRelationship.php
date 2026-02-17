<?php
namespace App\Core\Taxonomy\Models;

use App\Utils\BaseModel;

class TagRelationship extends BaseModel
{
    protected $table = 'sta_tag_relationships';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'tag_id',
        'object_id',
        'object_type',
        'created_at'
    ];
    
    protected $casts = [
        'created_at' => 'datetime'
    ];
    
    // Relationships
    public function tag()
    {
        return $this->belongsTo(Tag::class, 'tag_id');
    }
}
