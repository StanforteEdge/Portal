<?php

namespace App\Core\FileStorage\Models;

use App\Utils\BaseModel;
use App\Core\FileStorage\Models\File;

/**
 * FileLink Model
 *
 * Represents the link between a file and an entity (request, user, workflow, etc.)
 */
class FileLink extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_file_links';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'file_id',
        'linked_entity_type',
        'linked_entity_id',
        'linked_by',
        'linked_at',
        'created_at',
        'updated_at'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'linked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the associated file.
     *
     * @return object|null File object or null
     */
    public function getFile()
    {
        return $this->belongsTo(\App\Core\FileStorage\Models\File::class, 'file_id');
    }

    /**
     * Get the linked by user.
     *
     * @return object|null User object or null
     */
    public function getLinkedByUser()
    {
        return $this->belongsTo(\App\Core\User\Models\User::class, 'linked_by');
    }

    /**
     * Get all file links for a specific entity.
     *
     * @param string $entityType Type of entity (request, user, workflow, etc.)
     * @param string $entityId ID of the entity
     * @return array Array of FileLink objects
     */
    public static function getForEntity(string $entityType, string $entityId): array
    {
        $instance = new static();
        return $instance->where('linked_entity_type', $entityType)
            ->where('linked_entity_id', $entityId)
            ->get();
    }

    /**
     * Get all file links for a specific file.
     *
     * @param string $fileId File ID
     * @return array Array of FileLink objects
     */
    public static function getForFile(string $fileId): array
    {
        return self::where('file_id', $fileId)->get();
    }

    /**
     * Create a new file link.
     *
     * @param string $fileId File ID
     * @param string $entityType Entity type
     * @param string $entityId Entity ID
     * @param int $linkedBy User ID who created the link
     * @return object|bool FileLink object on success, false on failure
     */
    public static function createLink(string $fileId, string $entityType, string $entityId, int $linkedBy)
    {
        $link = new self([
            'id' => wp_generate_uuid4(),
            'file_id' => $fileId,
            'linked_entity_type' => $entityType,
            'linked_entity_id' => $entityId,
            'linked_by' => $linkedBy,
            'linked_at' => current_time('mysql')
        ]);

        return $link->create($link->attributes) ? $link : false;
    }

    /**
     * Remove a file link.
     *
     * @param string $fileId File ID
     * @param string $entityType Entity type
     * @param string $entityId Entity ID
     * @return bool True on success, false on failure
     */
    public static function removeLink(string $fileId, string $entityType, string $entityId): bool
    {
        $link = self::where('file_id', $fileId)
            ->where('linked_entity_type', $entityType)
            ->where('linked_entity_id', $entityId)
            ->first();

        if (!$link) {
            return false;
        }

        return $link->delete();
    }

    /**
     * Get linked entity display name.
     *
     * @return string
     */
    public function getEntityDisplayName(): string
    {
        switch ($this->linked_entity_type) {
            case 'request':
                return "Request #{$this->linked_entity_id}";
            case 'user':
                return "User Profile";
            case 'workflow':
                return "Workflow #{$this->linked_entity_id}";
            case 'group':
                return "Group #{$this->linked_entity_id}";
            case 'comment':
                return "Comment #{$this->linked_entity_id}";
            default:
                return ucfirst($this->linked_entity_type) . " #{$this->linked_entity_id}";
        }
    }
}
