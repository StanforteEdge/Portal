<?php /* Template Name: Projects Overview */
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = 'Projects Overview';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Projects Overview</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <a href="create" class="btn btn-primary shadow-md mr-2">Add New Project</a>
        </div>
    </div>

    <!-- BEGIN: Projects Layout -->
    <div class="intro-y grid grid-cols-12 gap-6 mt-5">
        <!-- BEGIN: Project Card -->
        <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
            <div class="box">
                <div class="flex items-start px-5 pt-5">
                    <div class="w-full flex flex-col lg:flex-row items-center">
                        <div class="w-16 h-16 image-fit">
                            <img alt="Project Logo" class="rounded-full" src="dist/images/project-1.jpg">
                        </div>
                        <div class="lg:ml-4 text-center lg:text-left mt-3 lg:mt-0">
                            <a href="view/1" class="font-medium">Inclusive Education Initiative</a>
                            <div class="text-slate-500 text-xs mt-0.5">Education & Empowerment</div>
                        </div>
                    </div>
                    <div class="absolute right-0 top-0 mr-5 mt-3 dropdown">
                        <a class="dropdown-toggle w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown">
                            <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i>
                        </a>
                        <div class="dropdown-menu w-40">
                            <div class="dropdown-content">
                                <a href="edit/1" class="dropdown-item">
                                    <i data-lucide="edit-2" class="w-4 h-4 mr-2"></i> Edit
                                </a>
                                <a href="view/1" class="dropdown-item">
                                    <i data-lucide="eye" class="w-4 h-4 mr-2"></i> View
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="text-center lg:text-left p-5">
                    <div>Enhancing educational access for children with disabilities through inclusive teaching methods and assistive technologies.</div>
                    <div class="flex items-center justify-center lg:justify-start text-slate-500 mt-5">
                        <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Due: 20 Mar 2025
                    </div>
                    <div class="flex items-center justify-center lg:justify-start text-slate-500 mt-1">
                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Progress: 45%
                    </div>
                </div>
                <div class="text-center lg:text-right p-5 border-t border-slate-200/60 dark:border-darkmode-400">
                    <div class="flex items-center justify-center lg:justify-end">
                        <div class="flex -mx-1">
                            <div class="w-8 h-8 image-fit">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-1.jpg">
                            </div>
                            <div class="w-8 h-8 image-fit -ml-4">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-2.jpg">
                            </div>
                            <div class="w-8 h-8 image-fit -ml-4">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-3.jpg">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Project Card -->

        <!-- BEGIN: Project Card -->
        <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
            <div class="box">
                <div class="flex items-start px-5 pt-5">
                    <div class="w-full flex flex-col lg:flex-row items-center">
                        <div class="w-16 h-16 image-fit">
                            <img alt="Project Logo" class="rounded-full" src="dist/images/project-2.jpg">
                        </div>
                        <div class="lg:ml-4 text-center lg:text-left mt-3 lg:mt-0">
                            <a href="view/2" class="font-medium">Vocational Training Program</a>
                            <div class="text-slate-500 text-xs mt-0.5">Skills Development</div>
                        </div>
                    </div>
                    <div class="absolute right-0 top-0 mr-5 mt-3 dropdown">
                        <a class="dropdown-toggle w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown">
                            <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i>
                        </a>
                        <div class="dropdown-menu w-40">
                            <div class="dropdown-content">
                                <a href="edit/2" class="dropdown-item">
                                    <i data-lucide="edit-2" class="w-4 h-4 mr-2"></i> Edit
                                </a>
                                <a href="view/2" class="dropdown-item">
                                    <i data-lucide="eye" class="w-4 h-4 mr-2"></i> View
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="text-center lg:text-left p-5">
                    <div>Providing vocational training and employment skills to young adults with disabilities, focusing on digital skills and entrepreneurship.</div>
                    <div class="flex items-center justify-center lg:justify-start text-slate-500 mt-5">
                        <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Due: 15 Apr 2025
                    </div>
                    <div class="flex items-center justify-center lg:justify-start text-slate-500 mt-1">
                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Progress: 65%
                    </div>
                </div>
                <div class="text-center lg:text-right p-5 border-t border-slate-200/60 dark:border-darkmode-400">
                    <div class="flex items-center justify-center lg:justify-end">
                        <div class="flex -mx-1">
                            <div class="w-8 h-8 image-fit">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-4.jpg">
                            </div>
                            <div class="w-8 h-8 image-fit -ml-4">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-5.jpg">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Project Card -->

        <!-- BEGIN: Project Card -->
        <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
            <div class="box">
                <div class="flex items-start px-5 pt-5">
                    <div class="w-full flex flex-col lg:flex-row items-center">
                        <div class="w-16 h-16 image-fit">
                            <img alt="Project Logo" class="rounded-full" src="dist/images/project-3.jpg">
                        </div>
                        <div class="lg:ml-4 text-center lg:text-left mt-3 lg:mt-0">
                            <a href="view/3" class="font-medium">Community Awareness Campaign</a>
                            <div class="text-slate-500 text-xs mt-0.5">Advocacy & Awareness</div>
                        </div>
                    </div>
                    <div class="absolute right-0 top-0 mr-5 mt-3 dropdown">
                        <a class="dropdown-toggle w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown">
                            <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i>
                        </a>
                        <div class="dropdown-menu w-40">
                            <div class="dropdown-content">
                                <a href="edit/3" class="dropdown-item">
                                    <i data-lucide="edit-2" class="w-4 h-4 mr-2"></i> Edit
                                </a>
                                <a href="view/3" class="dropdown-item">
                                    <i data-lucide="eye" class="w-4 h-4 mr-2"></i> View
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="text-center lg:text-left p-5">
                    <div>Raising community awareness about disability rights and inclusion through workshops, events, and media campaigns.</div>
                    <div class="flex items-center justify-center lg:justify-start text-slate-500 mt-5">
                        <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Due: 30 May 2025
                    </div>
                    <div class="flex items-center justify-center lg:justify-start text-slate-500 mt-1">
                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> Progress: 25%
                    </div>
                </div>
                <div class="text-center lg:text-right p-5 border-t border-slate-200/60 dark:border-darkmode-400">
                    <div class="flex items-center justify-center lg:justify-end">
                        <div class="flex -mx-1">
                            <div class="w-8 h-8 image-fit">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-6.jpg">
                            </div>
                            <div class="w-8 h-8 image-fit -ml-4">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-7.jpg">
                            </div>
                            <div class="w-8 h-8 image-fit -ml-4">
                                <img alt="Team Member" class="rounded-full" src="dist/images/user-8.jpg">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Project Card -->
    </div>
    <!-- END: Projects Layout -->
</div>
<!-- END: Content -->

<?php get_footer(); ?>
