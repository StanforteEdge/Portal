<?php

namespace App\Core\FileStorage\Models;

use App\Core\User\Models\User;
use App\Utils\BaseModel;
use App\Core\FileStorage\Models\FileLink;

/**
 * File Model
 *
 * Represents a stored file with metadata
 */
class File extends BaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sta_files';

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
        'owner_id',
        'file_name',
        'file_type',
        'file_size',
        'storage_path',
        'storage_provider',
        'status',
        'version',
        'parent_file_id',
        'metadata',
        'hash',
        'uploaded_at',
        'created_at',
        'updated_at'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'file_size' => 'integer',
        'version' => 'integer',
        'metadata' => 'array',
        'uploaded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the owner of the file.
     *
     * @return object|null User object or null
     */
    public function getOwner()
    {
        return $this->belongsTo(\App\Core\User\Models\User::class, 'owner_id');
    }

    /**
     * Get the parent file (for versioning).
     *
     * @return object|null File object or null
     */
    public function getParentFile()
    {
        if (!$this->parent_file_id) {
            return null;
        }
        return self::find($this->parent_file_id);
    }

    /**
     * Get child versions of this file.
     *
     * @return array Array of File objects
     */
    public function getVersions()
    {
        return self::where('parent_file_id', $this->id)
                  ->where('status', 'active')
                  ->orderBy('version', 'desc')
                  ->get();
    }

    /**
     * Get all files linked to this file.
     *
     * @return array Array of FileLink objects
     */
    public function getLinks()
    {
        $fileLink = new FileLink();
        return $fileLink->getForFile($this->id);
    }

    /**
     * Check if file is accessible by user.
     *
     * @param int $userId User ID
     * @return bool
     */
    public function isAccessibleBy(int $userId): bool
    {
        // Owner can always access their files
        if ($this->owner_id == $userId) {
            return true;
        }

        // Check if user has admin permissions
        // This would integrate with our RBAC system
        return false; // Placeholder - will implement proper permission checking
    }

    /**
     * Get file extension from file name.
     *
     * @return string
     */
    public function getExtension(): string
    {
        return strtolower(pathinfo($this->file_name, PATHINFO_EXTENSION));
    }

    /**
     * Get human-readable file size.
     *
     * @return string
     */
    public function getHumanReadableSize(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Soft delete the file.
     *
     * @return bool
     */
    public function softDelete(): bool
    {
        $this->status = 'deleted';
        $this->updated_at = current_time('mysql');
        return $this->update($this->id, [
            'status' => $this->status,
            'updated_at' => $this->updated_at
        ]) !== false;
    }

    /**
     * Archive the file.
     *
     * @return bool
     */
    public function archive(): bool
    {
        $this->status = 'archived';
        $this->updated_at = current_time('mysql');
        return $this->update($this->id, [
            'status' => $this->status,
            'updated_at' => $this->updated_at
        ]) !== false;
    }

    /**
     * Restore the file.
     *
     * @return bool
     */
    public function restore(): bool
    {
        $this->status = 'active';
        $this->updated_at = current_time('mysql');
        return $this->update($this->id, [
            'status' => $this->status,
            'updated_at' => $this->updated_at
        ]) !== false;
    }
}
