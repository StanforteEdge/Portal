<?php /* Template Name: Staff: Profile Documents */
?>

<?php
get_header();
$b_link = '/profile';
$b_title = 'Profile';
$p_title = 'Documents';

include get_template_directory() . "/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <?php include get_template_directory() . "/layout/menu-profile.php"; ?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 box lg:col-span-8 2xl:col-span-9">
        <div class="flex items-center px-5 py-5 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 class="font-medium text-base mr-auto">My Documents</h2>
            <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-document-modal">
                <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Upload Document
            </button>
        </div>
        <div class="p-5">
            <div class="grid grid-cols-12 gap-6">
                <!-- Document Cards will be dynamically populated here -->
                <?php
                // Example document structure
                $documents = array(
                    array(
                        'title' => 'Resume',
                        'type' => 'PDF',
                        'date' => '2024-03-15',
                        'size' => '2.5 MB'
                    ),
                    array(
                        'title' => 'Certifications',
                        'type' => 'ZIP',
                        'date' => '2024-03-10',
                        'size' => '5.2 MB'
                    )
                );

                foreach ($documents as $doc) :
                ?>
                    <div class="col-span-12 sm:col-span-6 2xl:col-span-4">
                        <div class="box p-5">
                            <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                                <div class="w-10 h-10 flex-none image-fit rounded-md overflow-hidden">
                                    <i data-lucide="file-text" class="w-full h-full text-primary"></i>
                                </div>
                                <div class="ml-4 mr-auto">
                                    <div class="font-medium"><?= $doc['title'] ?></div>
                                    <div class="text-slate-500 text-xs mt-0.5"><?= $doc['type'] ?> • <?= $doc['size'] ?></div>
                                </div>
                                <div class="dropdown">
                                    <button class="dropdown-toggle w-5 h-5 text-slate-500" aria-expanded="false" data-tw-toggle="dropdown">
                                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                    </button>
                                    <div class="dropdown-menu w-40">
                                        <ul class="dropdown-content">
                                            <li>
                                                <a href="" class="dropdown-item">
                                                    <i data-lucide="download" class="w-4 h-4 mr-2"></i> Download
                                                </a>
                                            </li>
                                            <li>
                                                <a href="" class="dropdown-item">
                                                    <i data-lucide="trash" class="w-4 h-4 mr-2"></i> Delete
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center mt-5">
                                <div class="text-slate-500 text-xs">Last Updated: <?= $doc['date'] ?></div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<!-- BEGIN: Add Document Modal -->
<div id="add-document-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Upload Document</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                <div class="col-span-12">
                    <label for="doc-title" class="form-label">Document Title</label>
                    <input id="doc-title" type="text" class="form-control" placeholder="Enter document title">
                </div>
                <div class="col-span-12">
                    <label for="doc-type" class="form-label">Document Type</label>
                    <select id="doc-type" class="form-select">
                        <option value="resume">Resume</option>
                        <option value="certificate">Certificate</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="col-span-12">
                    <label class="form-label">Upload File</label>
                    <div class="border-2 border-dashed dark:border-darkmode-400 rounded-md pt-4">
                        <div class="flex flex-wrap px-4">
                            <div class="w-full text-center">
                                <i data-lucide="cloud-upload" class="w-12 h-12 mx-auto text-primary"></i>
                                <div class="text-gray-600 dark:text-gray-500 mt-2">Click to upload or drag and drop</div>
                            </div>
                        </div>
                        <div class="px-4 pb-4 mt-2 flex items-center justify-center">
                            <button class="btn btn-primary mr-2">Upload</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END: Add Document Modal -->

<?php get_footer(); ?>
