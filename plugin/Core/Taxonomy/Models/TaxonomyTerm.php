<?php

namespace App\Core\Taxonomy\Models;

use App\Utils\BaseModel;

class TaxonomyTerm extends BaseModel
{
    protected $table = 'sta_taxonomy_terms';
    protected $primaryKey = 'id';

    protected $fillable = [
        'taxonomy_id',
        'name',
        'slug',
        'description',
        'parent_id',
        'meta',
        'sort_order',
        'is_active',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'meta' => 'json',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships

    /**
     * Get the taxonomy that owns the term.
     */
    public function taxonomy()
    {
        return $this->belongsTo(Taxonomy::class, 'taxonomy_id');
    }

    /**
     * Get the parent term.
     */
    public function parent()
    {
        return $this->belongsTo(TaxonomyTerm::class, 'parent_id');
    }

    /**
     * Get child terms.
     */
    public function children()
    {
        return $this->hasMany(TaxonomyTerm::class, 'parent_id');
    }
}
