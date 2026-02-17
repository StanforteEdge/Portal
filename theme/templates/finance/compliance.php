<?php /* Template Name: Finance: Compliance */
?>

<?php
get_header();
$b_link = '/finance';
$b_title = 'Finance';
$p_title = 'Compliance';

include get_template_directory() . "/templates/layout/menu.php";
include get_template_directory() . "/layout/components.php";

// Check user role
if (!in_array('accountant', (array) $user->roles) && !in_array('ceo', (array) $user->roles) && !in_array('coo', (array) $user->roles)) {
    header("Location: " . home_url());
    exit();
}

global $wpdb;

// Demo compliance documents
$demo_documents = [
    [
        'title' => 'Annual Tax Return 2024',
        'description' => 'Annual corporate tax filing document',
        'type' => 'Tax Document',
        'status' => 'active',
        'uploaded_by' => 'Sarah Johnson',
        'upload_date' => '2024-01-15',
        'expiry_date' => '2025-01-15',
        'file_url' => '#'
    ],
    [
        'title' => 'Q4 2024 Financial Audit Report',
        'description' => 'External auditor\'s quarterly review',
        'type' => 'Audit Report',
        'status' => 'pending_review',
        'uploaded_by' => 'David Chen',
        'upload_date' => '2024-12-01',
        'expiry_date' => '2025-03-01',
        'file_url' => '#'
    ],
    [
        'title' => 'Business License Renewal',
        'description' => 'Annual business operation license',
        'type' => 'Regulatory Filing',
        'status' => 'expiring_soon',
        'uploaded_by' => 'Michael Brown',
        'upload_date' => '2024-06-15',
        'expiry_date' => '2025-01-30',
        'file_url' => '#'
    ],
    [
        'title' => 'Employee Benefits Compliance Report',
        'description' => 'Annual benefits compliance certification',
        'type' => 'Regulatory Filing',
        'status' => 'active',
        'uploaded_by' => 'Emma Wilson',
        'upload_date' => '2024-11-20',
        'expiry_date' => '2025-11-20',
        'file_url' => '#'
    ],
    [
        'title' => 'VAT Returns Q4 2024',
        'description' => 'Quarterly VAT submission document',
        'type' => 'Tax Document',
        'status' => 'active',
        'uploaded_by' => 'Sarah Johnson',
        'upload_date' => '2024-12-10',
        'expiry_date' => '2025-03-31',
        'file_url' => '#'
    ]
];

// Calculate statistics
$total_documents = count($demo_documents);
$pending_reviews = count(array_filter($demo_documents, function($doc) { return $doc['status'] === 'pending_review'; }));
$expiring_soon = count(array_filter($demo_documents, function($doc) { return $doc['status'] === 'expiring_soon'; }));
$compliant_items = count(array_filter($demo_documents, function($doc) { return $doc['status'] === 'active'; }));

?>


        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <h2 class="text-lg font-medium mr-auto">
                Compliance Management
            </h2>
            <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-document-modal">
                    Upload Document
                </button>
            </div>
        </div>

        <!-- Compliance Overview -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="file-check" class="report-box__icon text-primary"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo $total_documents; ?></div>
                        <div class="text-base text-slate-500 mt-1">Total Documents</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="alert-circle" class="report-box__icon text-pending"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo $pending_reviews; ?></div>
                        <div class="text-base text-slate-500 mt-1">Pending Reviews</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="clock" class="report-box__icon text-warning"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo $expiring_soon; ?></div>
                        <div class="text-base text-slate-500 mt-1">Expiring Soon</div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
                <div class="report-box zoom-in">
                    <div class="box p-5">
                        <div class="flex">
                            <i data-lucide="check-circle" class="report-box__icon text-success"></i>
                        </div>
                        <div class="text-3xl font-medium leading-8 mt-6"><?php echo $compliant_items; ?></div>
                        <div class="text-base text-slate-500 mt-1">Compliant Items</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Document Categories -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="col-span-12 sm:col-span-6 xl:col-span-4 intro-y">
                <div class="box p-5">
                    <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                        <div class="font-medium text-base truncate">Tax Documents</div>
                    </div>
                    <div class="mt-5">
                        <!-- Tax documents list -->
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-4 intro-y">
                <div class="box p-5">
                    <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                        <div class="font-medium text-base truncate">Audit Reports</div>
                    </div>
                    <div class="mt-5">
                        <!-- Audit reports list -->
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-6 xl:col-span-4 intro-y">
                <div class="box p-5">
                    <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                        <div class="font-medium text-base truncate">Regulatory Filings</div>
                    </div>
                    <div class="mt-5">
                        <!-- Regulatory filings list -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Documents List -->
        <div class="grid grid-cols-12 gap-6 mt-5">
            <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
                <table class="table table-report -mt-2">
                    <thead>
                        <tr>
                            <th class="whitespace-nowrap">DOCUMENT</th>
                            <th class="text-center whitespace-nowrap">TYPE</th>
                            <th class="text-center whitespace-nowrap">STATUS</th>
                            <th class="text-center whitespace-nowrap">UPLOADED BY</th>
                            <th class="text-center whitespace-nowrap">UPLOAD DATE</th>
                            <th class="text-center whitespace-nowrap">EXPIRY DATE</th>
                            <th class="text-center whitespace-nowrap">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($demo_documents as $doc) : 
                            $status_class = match($doc['status']) {
                                'active' => 'text-success',
                                'pending_review' => 'text-pending',
                                'expiring_soon' => 'text-warning',
                                default => 'text-slate-500'
                            };
                            $status_text = match($doc['status']) {
                                'active' => 'Active',
                                'pending_review' => 'Pending Review',
                                'expiring_soon' => 'Expiring Soon',
                                default => 'Unknown'
                            };
                        ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <div class="flex">
                                        <div class="w-10 h-10 image-fit zoom-in">
                                            <i data-lucide="file-text" class="w-10 h-10"></i>
                                        </div>
                                        <div class="ml-4">
                                            <div class="font-medium whitespace-nowrap"><?php echo $doc['title']; ?></div>
                                            <div class="text-slate-500 text-xs whitespace-nowrap"><?php echo $doc['description']; ?></div>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center"><?php echo $doc['type']; ?></td>
                                <td class="w-40">
                                    <div class="flex items-center justify-center <?php echo $status_class; ?>">
                                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> <?php echo $status_text; ?>
                                    </div>
                                </td>
                                <td class="text-center"><?php echo $doc['uploaded_by']; ?></td>
                                <td class="text-center"><?php echo date('d M Y', strtotime($doc['upload_date'])); ?></td>
                                <td class="text-center"><?php echo date('d M Y', strtotime($doc['expiry_date'])); ?></td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <a href="<?php echo $doc['file_url']; ?>" target="_blank" class="flex items-center mr-3">
                                            <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View
                                        </a>
                                        <button class="flex items-center text-danger" data-tw-toggle="modal" data-tw-target="#delete-modal">
                                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>


<!-- Add Document Modal -->
<div id="add-document-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Upload Compliance Document</h2>
            </div>
            <form method="POST" enctype="multipart/form-data">
                <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                    <div class="col-span-12">
                        <label for="document-title" class="form-label">Document Title</label>
                        <input id="document-title" name="title" type="text" class="form-control w-full" placeholder="Enter document title">
                    </div>
                    <div class="col-span-12">
                        <label for="document-type" class="form-label">Document Type</label>
                        <select id="document-type" name="type" class="form-select w-full">
                            <option value="tax">Tax Document</option>
                            <option value="audit">Audit Report</option>
                            <option value="regulatory">Regulatory Filing</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="col-span-12">
                        <label for="document-file" class="form-label">Document File</label>
                        <input id="document-file" name="document" type="file" class="form-control w-full">
                    </div>
                    <div class="col-span-12">
                        <label for="expiry-date" class="form-label">Expiry Date (Optional)</label>
                        <input id="expiry-date" name="expiry_date" type="date" class="form-control w-full">
                    </div>
                    <div class="col-span-12">
                        <label for="description" class="form-label">Description</label>
                        <textarea id="description" name="description" class="form-control w-full" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer text-right">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                    <button type="submit" name="upload_document" class="btn btn-primary w-24">Upload</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php get_footer(); ?>
