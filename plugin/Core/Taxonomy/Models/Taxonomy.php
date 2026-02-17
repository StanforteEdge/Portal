<?php

namespace App\Core\Taxonomy\Models;

use App\Utils\BaseModel;

class Taxonomy extends BaseModel
{
    protected $table = 'sta_taxonomies';
    protected $primaryKey = 'id';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'hierarchical',
        'is_system',
        'feature',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'hierarchical' => 'boolean',
        'is_system' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function terms()
    {
        return $this->hasMany(TaxonomyTerm::class, 'taxonomy_id');
    }
}
