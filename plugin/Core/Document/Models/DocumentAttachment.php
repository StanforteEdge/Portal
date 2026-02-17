<?php
namespace App\Core\Document\Models;

use App\Utils\BaseModel;

/**
 * DocumentAttachment Model
 *
 * Links documents to files in the centralized file storage system
 * Updated to integrate with the new FileStorage system
 */
class DocumentAttachment extends BaseModel
{
    protected $table = 'sta_document_attachments';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'document_id',
        'file_id',
        'attachment_type',
        'uploaded_at'
    ];

    protected $casts = [
        'uploaded_at' => 'datetime'
    ];

    /**
     * @var File|null File model instance (lazy loaded)
     */
    private $fileModel = null;

    /**
     * Get the associated file from FileStorage
     *
     * @return object|null File object or null
     */
    public function getFile()
    {
        return $this->belongsTo(\App\Core\FileStorage\Models\File::class, 'file_id');
    }

    /**
     * Get File model instance (lazy loaded)
     *
     * @return \App\Core\FileStorage\Models\File
     */
    private function getFileModel()
    {
        if (!$this->fileModel) {
            $this->fileModel = new \App\Core\FileStorage\Models\File();
        }
        return $this->fileModel;
    }

    /**
     * Get the associated document
     *
     * @return object|null Document object or null
     */
    public function getDocument()
    {
        return $this->belongsTo(\App\Core\Document\Models\Document::class, 'document_id');
    }

    /**
     * Get all attachments for a document
     *
     * @param string $document_id Document ID
     * @param string $attachment_type Optional filter by attachment type
     * @return array Array of attachment objects
     */
    public function getDocumentAttachments($document_id, $attachment_type = null)
    {
        $query = $this->where('document_id', $document_id);

        if ($attachment_type) {
            $query->where('attachment_type', $attachment_type);
        }

        return $query->orderBy('uploaded_at', 'desc')->get();
    }

    /**
     * Get primary attachment for a document
     *
     * @param string $document_id Document ID
     * @return object|null Primary attachment object or null if not found
     */
    public function getPrimaryAttachment($document_id)
    {
        return $this->where('document_id', $document_id)
                   ->where('attachment_type', 'primary')
                   ->orderBy('uploaded_at', 'desc')
                   ->first();
    }

    /**
     * Delete all attachments for a document
     *
     * @param string $document_id Document ID
     * @return int|false Number of rows deleted or false on failure
     */
    public function deleteDocumentAttachments($document_id)
    {
        return $this->where('document_id', $document_id)->deleteWhere(['document_id' => $document_id]);
    }

    /**
     * Get attachment count for a document
     *
     * @param string $document_id Document ID
     * @param string $attachment_type Optional filter by attachment type
     * @return int Attachment count
     */
    public function getAttachmentCount($document_id, $attachment_type = null)
    {
        $query = $this->where('document_id', $document_id);

        if ($attachment_type) {
            $query->where('attachment_type', $attachment_type);
        }

        return $query->count();
    }

    /**
     * Check if file is already attached to document
     *
     * @param string $document_id Document ID
     * @param string $file_id File ID
     * @return bool True if file is attached, false otherwise
     */
    public function isFileAttached($document_id, $file_id)
    {
        $count = $this->where('document_id', $document_id)
                     ->where('file_id', $file_id)
                     ->count();

        return $count > 0;
    }

    /**
     * Create a document attachment with FileStorage integration
     *
     * @param string $document_id Document ID
     * @param string $file_id File ID from FileStorage
     * @param string $attachment_type Type of attachment (primary, supporting, etc.)
     * @param int $user_id User creating the attachment
     * @return object|false Created attachment or false on failure
     */
    public function createAttachment($document_id, $file_id, $attachment_type = 'supporting', $user_id = null)
    {
        // Validate that the file exists in FileStorage
        $fileModel = $this->getFileModel();
        $file = $fileModel->find($file_id);

        if (!$file) {
            return false;
        }

        // Get the owner ID from the file
        $owner_id = $file->owner_id ?? $user_id;

        // Create the attachment
        $attachment = $this->create([
            'id' => wp_generate_uuid4(),
            'document_id' => $document_id,
            'file_id' => $file_id,
            'attachment_type' => $attachment_type,
            'uploaded_at' => current_time('mysql')
        ]);

        if ($attachment) {
            // Create file link to document
            \App\Core\FileStorage\Models\FileLink::createLink(
                $file_id,
                'document',
                $document_id,
                $owner_id
            );
        }

        return $attachment;
    }
}
