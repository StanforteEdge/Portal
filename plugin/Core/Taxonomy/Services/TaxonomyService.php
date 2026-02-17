<?php

namespace App\Core\Taxonomy\Services;

use App\Core\Taxonomy\Models\Taxonomy;
use App\Core\Taxonomy\Models\TaxonomyTerm;
use Exception;

class TaxonomyService
{
    protected $taxonomy;
    protected $term;

    public function __construct()
    {
        $this->taxonomy = new Taxonomy();
        $this->term = new TaxonomyTerm();
    }

    /**
     * Create a new taxonomy
     * 
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function createTaxonomy(array $data)
    {
        // Basic validation
        if (empty($data['name']) || empty($data['slug'])) {
            throw new Exception('Name and slug are required', 400);
        }

        // Check for duplicate slug
        if ($this->taxonomy->where('slug', $data['slug'])->first()) {
            throw new Exception('Taxonomy slug already exists', 400);
        }

        // Add default values
        if (!isset($data['hierarchical'])) {
            $data['hierarchical'] = 0;
        }
        if (!isset($data['is_system'])) {
            $data['is_system'] = 0;
        }

        $result = $this->taxonomy->create($data);

        if (!$result) {
            // Get the last database error for debugging
            global $wpdb;
            $error = $wpdb->last_error;
            error_log('Taxonomy create failed. DB Error: ' . $error);
            throw new Exception('Failed to create taxonomy: ' . ($error ?: 'Unknown database error'), 500);
        }

        return $result;
    }

    /**
     * Update an existing taxonomy
     * 
     * @param int $id
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function updateTaxonomy($id, array $data)
    {
        $taxonomy = $this->taxonomy->find($id);
        if (!$taxonomy) {
            throw new Exception('Taxonomy not found', 404);
        }

        // Slug uniqueness check if slug is changing
        $currentSlug = $taxonomy->slug ?? '';
        if (isset($data['slug']) && $data['slug'] !== $currentSlug) {
            if ($this->taxonomy->where('slug', $data['slug'])->where('id', '!=', $id)->first()) {
                throw new Exception('Taxonomy slug already exists', 400);
            }
        }

        // Prevent system taxonomy slug update
        $isSystem = $taxonomy->is_system ?? false;
        if ($isSystem && isset($data['slug']) && $data['slug'] !== $currentSlug) {
            throw new Exception('Cannot change slug of system taxonomy', 400);
        }

        $this->taxonomy->update($id, $data);
        return $this->taxonomy->find($id);
    }

    /**
     * Delete a taxonomy
     * 
     * @param int $id
     * @return bool
     * @throws Exception
     */
    public function deleteTaxonomy($id)
    {
        $taxonomy = $this->taxonomy->find($id);
        if (!$taxonomy) {
            throw new Exception('Taxonomy not found', 404);
        }

        if ($taxonomy->is_system) {
            throw new Exception('Cannot delete system taxonomy', 400);
        }

        // Delete all terms associated with this taxonomy
        $this->term->deleteBy('taxonomy_id', $id);

        return $this->taxonomy->delete($id);
    }

    /**
     * Get taxonomy by ID
     * 
     * @param int $id
     * @return object|null
     */
    public function getTaxonomyById($id)
    {
        return $this->taxonomy->find($id);
    }

    /**
     * Get taxonomy by Slug
     * 
     * @param string $slug
     * @return object|null
     */
    public function getTaxonomyBySlug($slug)
    {
        return $this->taxonomy->where('slug', $slug)->first();
    }

    /**
     * List taxonomies with filters
     * 
     * @param array $filters
     * @return array
     */
    public function listTaxonomies(array $filters = [])
    {

        $query = new Taxonomy();

        if (isset($filters['hierarchical'])) {
            $query->where('hierarchical', $filters['hierarchical']);
        }

        if (isset($filters['is_system'])) {
            $query->where('is_system', $filters['is_system']);
        }

        $page = isset($filters['page']) ? (int) $filters['page'] : 1;
        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->paginate($perPage, $page, ['*']);
    }

    /**
     * Create a new term
     * 
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function createTerm(array $data)
    {
        if (empty($data['name']) || empty($data['taxonomy_id'])) {
            throw new Exception('Name and Taxonomy ID are required', 400);
        }

        // Auto-generate slug if missing
        if (empty($data['slug'])) {
            $data['slug'] = \sanitize_title($data['name']);
        }

        // Check duplication within taxonomy
        if ($this->term->where('slug', $data['slug'])->where('taxonomy_id', $data['taxonomy_id'])->first()) {
            throw new Exception('Term slug already exists in this taxonomy', 400);
        }

        $result = $this->term->create($data);

        if (!$result) {
            // Get the last database error for debugging
            global $wpdb;
            $error = $wpdb->last_error;
            error_log('Term create failed. DB Error: ' . $error);
            throw new Exception('Failed to create term: ' . ($error ?: 'Unknown database error'), 500);
        }

        return $result;
    }

    /**
     * Update a term
     * 
     * @param int $id
     * @param array $data
     * @return object
     * @throws Exception
     */
    public function updateTerm($id, array $data)
    {
        $term = $this->term->find($id);
        if (!$term) {
            throw new Exception('Term not found', 404);
        }

        if (isset($data['slug']) && $data['slug'] !== $term->slug) {
            // Check uniqueness
            $taxId = isset($data['taxonomy_id']) ? $data['taxonomy_id'] : $term->taxonomy_id;
            if (
                $this->term->where('slug', $data['slug'])
                ->where('taxonomy_id', $taxId)
                ->where('id', '!=', $id)
                ->first()
            ) {
                throw new Exception('Term slug already exists in this taxonomy', 400);
            }
        }

        $this->term->update($id, $data);
        return $this->term->find($id);
    }

    /**
     * Delete a term
     * 
     * @param int $id
     * @return bool
     * @throws Exception
     */
    public function deleteTerm($id)
    {
        $term = $this->term->find($id);
        if (!$term) {
            throw new Exception('Term not found', 404);
        }

        // Re-parent children (move to parent or root)
        $children = (new TaxonomyTerm())->where('parent_id', $id)->get();
        foreach ($children as $child) {
            (new TaxonomyTerm())->update($child->id, ['parent_id' => $term->parent_id]);
        }

        return $this->term->delete($id);
    }

    /**
     * Get term by ID
     * 
     * @param int $id
     * @return object|null
     */
    public function getTermById($id)
    {
        return $this->term->find($id);
    }

    /**
     * Get terms by Taxonomy
     * 
     * @param int $taxonomyId
     * @param array $filters
     * @return array
     */
    public function getTermsByTaxonomy($taxonomyId, array $filters = [])
    {
        $query = new TaxonomyTerm();
        $query->where('taxonomy_id', $taxonomyId);

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['parent_id'])) {
            $query->where('parent_id', $filters['parent_id']);
        }

        // Default ordering by sort_order, then name
        $query->orderBy('sort_order', 'ASC')->orderBy('name', 'ASC');

        $page = isset($filters['page']) ? (int) $filters['page'] : 1;
        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->paginate($perPage, $page, ['*']);
    }

    /**
     * Get Term Tree (Hierarchical)
     * 
     * @param int $taxonomyId
     * @param array $filters
     * @return array
     */
    public function getTermTree($taxonomyId, array $filters = [])
    {
        $query = new TaxonomyTerm();
        $query->where('taxonomy_id', $taxonomyId);

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Fetch all (no pagination for tree)
        $terms = $query->get();
        if (empty($terms))
            return [];

        // Build Tree
        $tree = [];
        $termMap = [];

        foreach ($terms as $term) {
            $termMap[$term->id] = (array) $term; // Convert to array for easier manipulation
            $termMap[$term->id]['children'] = [];
        }

        foreach ($terms as $term) {
            if ($term->parent_id && isset($termMap[$term->parent_id])) {
                $termMap[$term->parent_id]['children'][] = &$termMap[$term->id];
            } else {
                $tree[] = &$termMap[$term->id];
            }
        }

        return $tree;
    }

    /**
     * Get child terms
     * 
     * @param int $parentId
     * @return array
     */
    public function getChildTerms($parentId)
    {
        return (new TaxonomyTerm())->where('parent_id', $parentId)->get();
    }
}
