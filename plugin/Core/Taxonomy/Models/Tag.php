<?php
namespace App\Core\Taxonomy\Models;

use App\Utils\BaseModel;
use App\Core\Taxonomy\Models\TagRelationship;

class Tag extends BaseModel
{
    protected $table = 'sta_tags';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'name',
        'slug',
        'description',
        'usage_count',
        'created_at',
        'updated_at'
    ];
    
    protected $casts = [
        'usage_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Relationships
    public function relationships()
    {
        return $this->hasMany(TagRelationship::class, 'tag_id');
    }
}
