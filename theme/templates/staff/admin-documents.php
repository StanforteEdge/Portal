<?php /* Template Name: Staff: Admin - Document Management */ ?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'Staff Documents';

include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12">
        <!-- BEGIN: Document Stats -->
        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="file-check" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">142</div>
                        <div class="text-base text-slate-500 mt-1">Valid Documents</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="alert-circle" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">15</div>
                        <div class="text-base text-slate-500 mt-1">Expiring Soon</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="x-circle" class="report-box__icon text-danger"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">5</div>
                        <div class="text-base text-slate-500 mt-1">Expired Documents</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="clock" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6">8</div>
                        <div class="text-base text-slate-500 mt-1">Pending Review</div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Document Stats -->

        <!-- BEGIN: Document Categories -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Document Categories</h2>
                <div class="w-full sm:w-auto flex">
                    <button class="btn btn-primary shadow-md" onclick="showCategoryModal()">Add Category</button>
                </div>
            </div>
            <div class="p-5">
                <div class="grid grid-cols-12 gap-6">
                    <?php
                    $categories = [
                        ['name' => 'Contracts', 'icon' => 'file-text', 'count' => 45],
                        ['name' => 'ID Documents', 'icon' => 'credit-card', 'count' => 32],
                        ['name' => 'Certifications', 'icon' => 'award', 'count' => 28],
                        ['name' => 'Training', 'icon' => 'book', 'count' => 15]
                    ];
                    
                    foreach ($categories as $category):
                    ?>
                    <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                        <div class="box p-5 text-center">
                            <div class="text-slate-500">
                                <i data-lucide="<?php echo $category['icon']; ?>" class="block w-8 h-8 mx-auto"></i>
                            </div>
                            <div class="font-medium mt-3"><?php echo $category['name']; ?></div>
                            <div class="text-slate-500 mt-1"><?php echo $category['count']; ?> documents</div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <!-- END: Document Categories -->

        <!-- BEGIN: Recent Documents -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Recent Documents</h2>
                <div class="w-full sm:w-auto flex">
                    <button class="btn btn-outline-secondary" onclick="showUploadModal()">
                        <i data-lucide="upload" class="w-4 h-4 mr-2"></i> Upload Document
                    </button>
                </div>
            </div>
            <div class="p-5">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">Employee</th>
                            <th class="whitespace-nowrap">Document</th>
                            <th class="whitespace-nowrap">Category</th>
                            <th class="whitespace-nowrap">Upload Date</th>
                            <th class="whitespace-nowrap">Status</th>
                            <th class="whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $documents = $wpdb->get_results("
                            SELECT d.*, u.display_name, c.name as category_name
                            FROM {$wpdb->prefix}staff_documents d
                            LEFT JOIN {$wpdb->users} u ON d.employee_id = u.ID
                            LEFT JOIN {$wpdb->prefix}staff_document_categories c ON d.category_id = c.id
                            ORDER BY d.upload_date DESC
                            LIMIT 10
                        ");

                        if ($documents): foreach ($documents as $doc):
                        ?>
                        <tr class="intro-x">
                            <td class="w-40">
                                <div class="flex">
                                    <div class="w-10 h-10 image-fit zoom-in">
                                        <img alt="<?php echo esc_attr($doc->display_name); ?>" class="rounded-full" 
                                             src="<?php echo get_avatar_url($doc->employee_id); ?>">
                                    </div>
                                    <div class="ml-4">
                                        <div class="font-medium whitespace-nowrap"><?php echo esc_html($doc->display_name); ?></div>
                                    </div>
                                </div>
                            </td>
                            <td><?php echo esc_html($doc->title); ?></td>
                            <td><?php echo esc_html($doc->category_name); ?></td>
                            <td><?php echo date('M d, Y', strtotime($doc->upload_date)); ?></td>
                            <td>
                                <div class="flex items-center whitespace-nowrap text-<?php 
                                    echo $doc->status === 'valid' ? 'success' : 
                                        ($doc->status === 'expired' ? 'danger' : 'warning'); 
                                ?>">
                                    <i data-lucide="circle" class="w-4 h-4 mr-2"></i>
                                    <?php echo ucfirst($doc->status); ?>
                                </div>
                            </td>
                            <td class="table-report__action w-56">
                                <div class="flex items-center">
                                    <a class="flex items-center mr-3" href="<?php echo esc_url($doc->file_url); ?>" target="_blank">
                                        <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View
                                    </a>
                                    <a class="flex items-center text-danger" href="#" 
                                       onclick="deleteDocument(<?php echo esc_attr($doc->id); ?>)">
                                        <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <!-- END: Recent Documents -->
    </div>
</div>

<!-- BEGIN: Upload Modal -->
<div id="uploadModal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Upload Document</h2>
            </div>
            <form id="uploadForm">
                <div class="modal-body p-5">
                    <div class="preview">
                        <div class="dropzone">
                            <div class="fallback">
                                <input name="file" type="file" />
                            </div>
                            <div class="dz-message" data-dz-message>
                                <div class="text-lg font-medium">Drop files here or click to upload.</div>
                                <div class="text-slate-500">Max file size 10MB</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <label class="form-label">Employee</label>
                        <select name="employee_id" class="form-select w-full">
                            <?php
                            $employees = $wpdb->get_results("
                                SELECT ID, display_name 
                                FROM {$wpdb->users} 
                                ORDER BY display_name
                            ");
                            foreach ($employees as $employee) {
                                echo '<option value="' . esc_attr($employee->ID) . '">' . 
                                     esc_html($employee->display_name) . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                    
                    <div class="mt-3">
                        <label class="form-label">Category</label>
                        <select name="category_id" class="form-select w-full">
                            <?php
                            $categories = $wpdb->get_results("
                                SELECT id, name 
                                FROM {$wpdb->prefix}staff_document_categories 
                                ORDER BY name
                            ");
                            foreach ($categories as $category) {
                                echo '<option value="' . esc_attr($category->id) . '">' . 
                                     esc_html($category->name) . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                    
                    <div class="mt-3">
                        <label class="form-label">Expiry Date (if applicable)</label>
                        <input type="date" name="expiry_date" class="form-control">
                    </div>
                </div>
                <div class="modal-footer text-right">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                    <button type="submit" class="btn btn-primary w-20">Upload</button>
                </div>
            </form>
        </div>
    </div>
</div>
<!-- END: Upload Modal -->

<!-- BEGIN: Category Modal -->
<div id="categoryModal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add Document Category</h2>
            </div>
            <form id="categoryForm">
                <div class="modal-body p-5">
                    <div class="preview">
                        <div>
                            <label class="form-label">Category Name</label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        <div class="mt-3">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-control" rows="3"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer text-right">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                    <button type="submit" class="btn btn-primary w-20">Save</button>
                </div>
            </form>
        </div>
    </div>
</div>
<!-- END: Category Modal -->

<script>
jQuery(document).ready(function($) {
    // Initialize dropzone
    var myDropzone = new Dropzone(".dropzone", {
        url: ajaxurl,
        paramName: "file",
        maxFilesize: 10,
        acceptedFiles: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
        addRemoveLinks: true,
        dictRemoveFile: "Remove",
        init: function() {
            this.on("sending", function(file, xhr, formData) {
                formData.append("action", "upload_staff_document");
                formData.append("employee_id", $('select[name="employee_id"]').val());
                formData.append("category_id", $('select[name="category_id"]').val());
                formData.append("expiry_date", $('input[name="expiry_date"]').val());
                formData.append("_ajax_nonce", '<?php echo wp_create_nonce("upload_staff_document"); ?>');
            });
            
            this.on("success", function(file, response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert('Error uploading document');
                }
            });
        }
    });

    // Handle category form submission
    $('#categoryForm').on('submit', function(e) {
        e.preventDefault();
        
        $.post(ajaxurl, {
            action: 'add_document_category',
            name: $('input[name="name"]').val(),
            description: $('textarea[name="description"]').val(),
            _ajax_nonce: '<?php echo wp_create_nonce("add_document_category"); ?>'
        }, function(response) {
            if (response.success) {
                location.reload();
            } else {
                alert('Error adding category');
            }
        });
    });
});

function showUploadModal() {
    const modal = tailwind.Modal.getInstance(document.querySelector("#uploadModal"));
    modal.show();
}

function showCategoryModal() {
    const modal = tailwind.Modal.getInstance(document.querySelector("#categoryModal"));
    modal.show();
}

function deleteDocument(id) {
    if (confirm('Are you sure you want to delete this document?')) {
        jQuery.post(ajaxurl, {
            action: 'delete_staff_document',
            id: id,
            _ajax_nonce: '<?php echo wp_create_nonce("delete_staff_document"); ?>'
        }, function(response) {
            if (response.success) {
                location.reload();
            } else {
                alert('Error deleting document');
            }
        });
    }
}
</script>

<?php get_footer(); ?>
