<?php
namespace App\Core\Taxonomy\Services;

use App\Core\Taxonomy\Models\Tag;
use App\Core\Taxonomy\Models\TagRelationship;

class TagService 
{
    public function createTag($data)
    {
        $tag = new Tag();
        $tag->fill($data);
        $tag->usage_count = 0;
        $tag->save();
        
        return $tag;
    }
    
    public function updateTag($id, $data)
    {
        $tag = Tag::find($id);
        if (!$tag) {
            return false;
        }
        
        $tag->fill($data);
        $tag->save();
        
        return $tag;
    }
    
    public function deleteTag($id)
    {
        $tag = Tag::find($id);
        if (!$tag) {
            return false;
        }
        
        // Delete all relationships
        TagRelationship::where('tag_id', $id)->delete();
        
        return $tag->delete();
    }
    
    public function getTagById($id)
    {
        return Tag::find($id);
    }
    
    public function searchTags($query, $limit = 10)
    {
        return Tag::where('name', 'LIKE', "%{$query}%")
            ->orWhere('slug', 'LIKE', "%{$query}%")
            ->orderBy('usage_count', 'DESC')
            ->limit($limit)
            ->get();
    }
    
    public function getPopularTags($limit = 10)
    {
        return Tag::orderBy('usage_count', 'DESC')
            ->limit($limit)
            ->get();
    }
    
    public function getAllTags($page = 1, $perPage = 50)
    {
        return Tag::orderBy('name', 'ASC')
            ->paginate($perPage, ['*'], 'page', $page);
    }
    
    public function tagObject($tagId, $objectId, $objectType)
    {
        // Check if relationship already exists
        $exists = TagRelationship::where('tag_id', $tagId)
            ->where('object_id', $objectId)
            ->where('object_type', $objectType)
            ->exists();
            
        if ($exists) {
            return true;
        }
        
        // Create relationship
        $relationship = new TagRelationship();
        $relationship->tag_id = $tagId;
        $relationship->object_id = $objectId;
        $relationship->object_type = $objectType;
        $relationship->save();
        
        // Increment usage count
        $tag = Tag::find($tagId);
        if ($tag) {
            $tag->usage_count = $tag->usage_count + 1;
            $tag->save();
        }
        
        return true;
    }
    
    public function untagObject($tagId, $objectId, $objectType)
    {
        $relationship = TagRelationship::where('tag_id', $tagId)
            ->where('object_id', $objectId)
            ->where('object_type', $objectType)
            ->first();
            
        if (!$relationship) {
            return false;
        }
        
        // Decrement usage count
        $tag = Tag::find($tagId);
        if ($tag && $tag->usage_count > 0) {
            $tag->usage_count = $tag->usage_count - 1;
            $tag->save();
        }
        
        return $relationship->delete();
    }
    
    public function getObjectTags($objectId, $objectType)
    {
        return Tag::join('sta_tag_relationships', 'sta_tags.id', '=', 'sta_tag_relationships.tag_id')
            ->where('sta_tag_relationships.object_id', $objectId)
            ->where('sta_tag_relationships.object_type', $objectType)
            ->select('sta_tags.*')
            ->get();
    }
}
