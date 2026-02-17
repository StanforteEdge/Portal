<?php
/* Template Name: Documents: Main */

get_header();
$b_link = '/documents';
$b_title = 'Documents';
$p_title = 'All Documents';

include get_template_directory() . "/templates/layout/menu.php";
?>
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Documents</h2>
    </div>
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Policy Documents -->
        <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
            <div class="box">
                <div class="p-5">
                    <div class="h-40 2xl:h-56 image-fit rounded-md overflow-hidden">
                        <img class="rounded-md" src="preview-13.jpg">
                    </div>
                    <div class="text-slate-600 dark:text-slate-500 mt-5">
                        <div class="flex items-center">
                            <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Policy Documents
                        </div>
                        <div class="flex items-center mt-2">
                            <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Last Updated: Dec 15, 2024
                        </div>
                    </div>
                </div>
                <div class="flex justify-center lg:justify-end items-center p-5 border-t border-slate-200/60">
                    <a class="btn btn-primary" href="<?php echo home_url('/documents/policy'); ?>">View Documents</a>
                </div>
            </div>
        </div>
        <!-- Strategic Documents -->
        <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
            <div class="box">
                <div class="p-5">
                    <div class="h-40 2xl:h-56 image-fit rounded-md overflow-hidden">
                        <img class="rounded-md" src="preview-13.jpg">
                    </div>
                    <div class="text-slate-600 dark:text-slate-500 mt-5">
                        <div class="flex items-center">
                            <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Strategic Documents
                        </div>
                        <div class="flex items-center mt-2">
                            <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Last Updated: Dec 15, 2024
                        </div>
                    </div>
                </div>
                <div class="flex justify-center lg:justify-end items-center p-5 border-t border-slate-200/60">
                    <a class="btn btn-primary" href="<?php echo home_url('/documents/strategic'); ?>">View Documents</a>
                </div>
            </div>
        </div>
        <!-- Board Reports -->
        <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
            <div class="box">
                <div class="p-5">
                    <div class="h-40 2xl:h-56 image-fit rounded-md overflow-hidden">
                        <img class="rounded-md" src="preview-13.jpg">
                    </div>
                    <div class="text-slate-600 dark:text-slate-500 mt-5">
                        <div class="flex items-center">
                            <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Board Reports
                        </div>
                        <div class="flex items-center mt-2">
                            <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Last Updated: Dec 15, 2024
                        </div>
                    </div>
                </div>
                <div class="flex justify-center lg:justify-end items-center p-5 border-t border-slate-200/60">
                    <a class="btn btn-primary" href="<?php echo home_url('/documents/board'); ?>">View Documents</a>
                </div>
            </div>
        </div>
    </div>
</div>
<?php get_footer(); ?>
