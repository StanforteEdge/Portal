<?php /* Template Name: Tasks: Board */
get_header();
$b_link = '/tasks';
$b_title = 'Tasks';
$p_title = 'Task Board';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <!-- BEGIN: Board Filters -->
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Task Board</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <div class="dropdown mr-2">
                <button class="dropdown-toggle btn box" aria-expanded="false" data-tw-toggle="dropdown">
                    <span class="w-32 text-left">Filter by Project</span>
                    <i data-lucide="chevron-down" class="w-4 h-4 ml-2"></i>
                </button>
                <div class="dropdown-menu w-40">
                    <ul class="dropdown-content">
                        <li><a href="" class="dropdown-item">All Projects</a></li>
                        <li><a href="" class="dropdown-item">Inclusive Education</a></li>
                        <li><a href="" class="dropdown-item">Vocational Training</a></li>
                        <li><a href="" class="dropdown-item">Community Awareness</a></li>
                    </ul>
                </div>
            </div>
            <div class="dropdown mr-2">
                <button class="dropdown-toggle btn box" aria-expanded="false" data-tw-toggle="dropdown">
                    <span class="w-32 text-left">Filter by Assignee</span>
                    <i data-lucide="chevron-down" class="w-4 h-4 ml-2"></i>
                </button>
                <div class="dropdown-menu w-40">
                    <ul class="dropdown-content">
                        <li><a href="" class="dropdown-item">All Members</a></li>
                        <li><a href="" class="dropdown-item">Ademibolanle Adesida</a></li>
                        <li><a href="" class="dropdown-item">Micheal Ojediran</a></li>
                        <li><a href="" class="dropdown-item">Allen Abu</a></li>
                    </ul>
                </div>
            </div>
            <a href="/tasks/create" class="btn btn-primary shadow-md mr-2">
                <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Add Task
            </a>
        </div>
    </div>
    <!-- END: Board Filters -->

    <!-- BEGIN: Task Board -->
    <div class="mt-5 flex gap-3 flex-col lg:flex-row">
        <!-- BEGIN: To Do Column -->
        <div class="intro-y lg:mr-4 pb-4 lg:pb-0 lg:w-1/4">
            <div class="bg-slate-100 text-slate-600 font-medium text-base rounded-md p-3">
                To Do (3)
            </div>
            <div class="mt-4">
                <!-- Task Card -->
                <div class="intro-y box relative mb-3 cursor-move">
                    <div class="p-3">
                        <div class="flex items-center">
                            <div class="font-medium text-base mr-auto">Coordinate Teacher Training Workshop</div>
                            <div class="dropdown ml-3">
                                <button class="dropdown-toggle w-5 h-5 text-slate-500" aria-expanded="false" data-tw-toggle="dropdown">
                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                </button>
                                <div class="dropdown-menu w-40">
                                    <ul class="dropdown-content">
                                        <li><a href="" class="dropdown-item">Edit</a></li>
                                        <li><a href="" class="dropdown-item">Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="text-slate-500 mt-2">Organize workshop for teachers on inclusive teaching methods</div>
                        <div class="flex items-center mt-3">
                            <div class="bg-warning/20 text-warning rounded px-2 mr-2">Medium Priority</div>
                            <div class="text-xs">Due: Dec 25, 2024</div>
                        </div>
                        <div class="flex items-center mt-3">
                            <div class="w-6 h-6 image-fit rounded-full">
                                <img alt="User" class="rounded-full" src="dist/images/profile-1.jpg">
                            </div>
                            <div class="text-xs text-slate-500 ml-2">Sarah Johnson</div>
                        </div>
                    </div>
                </div>

                <!-- Task Card -->
                <div class="intro-y box relative mb-3 cursor-move">
                    <div class="p-3">
                        <div class="flex items-center">
                            <div class="font-medium text-base mr-auto">Setup Training Facilities</div>
                            <div class="dropdown ml-3">
                                <button class="dropdown-toggle w-5 h-5 text-slate-500" aria-expanded="false" data-tw-toggle="dropdown">
                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                </button>
                                <div class="dropdown-menu w-40">
                                    <ul class="dropdown-content">
                                        <li><a href="" class="dropdown-item">Edit</a></li>
                                        <li><a href="" class="dropdown-item">Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="text-slate-500 mt-2">Prepare training rooms with necessary equipment</div>
                        <div class="flex items-center mt-3">
                            <div class="bg-success/20 text-success rounded px-2 mr-2">Low Priority</div>
                            <div class="text-xs">Due: Dec 22, 2024</div>
                        </div>
                        <div class="flex items-center mt-3">
                            <div class="w-6 h-6 image-fit rounded-full">
                                <img alt="User" class="rounded-full" src="dist/images/profile-2.jpg">
                            </div>
                            <div class="text-xs text-slate-500 ml-2">David Chen</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: To Do Column -->

        <!-- BEGIN: In Progress Column -->
        <div class="intro-y lg:mr-4 pb-4 lg:pb-0 lg:w-1/4">
            <div class="bg-slate-100 text-slate-600 font-medium text-base rounded-md p-3">
                In Progress (2)
            </div>
            <div class="mt-4">
                <!-- Task Card -->
                <div class="intro-y box relative mb-3 cursor-move">
                    <div class="p-3">
                        <div class="flex items-center">
                            <div class="font-medium text-base mr-auto">Develop Inclusive Education Materials</div>
                            <div class="dropdown ml-3">
                                <button class="dropdown-toggle w-5 h-5 text-slate-500" aria-expanded="false" data-tw-toggle="dropdown">
                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                </button>
                                <div class="dropdown-menu w-40">
                                    <ul class="dropdown-content">
                                        <li><a href="" class="dropdown-item">Edit</a></li>
                                        <li><a href="" class="dropdown-item">Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="text-slate-500 mt-2">Create educational materials for diverse learning needs</div>
                        <div class="flex items-center mt-3">
                            <div class="bg-danger/20 text-danger rounded px-2 mr-2">High Priority</div>
                            <div class="text-xs">Due: Dec 20, 2024</div>
                        </div>
                        <div class="flex items-center mt-3">
                            <div class="w-6 h-6 image-fit rounded-full">
                                <img alt="User" class="rounded-full" src="dist/images/profile-3.jpg">
                            </div>
                            <div class="text-xs text-slate-500 ml-2">Maria Rodriguez</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: In Progress Column -->

        <!-- BEGIN: Review Column -->
        <div class="intro-y lg:mr-4 pb-4 lg:pb-0 lg:w-1/4">
            <div class="bg-slate-100 text-slate-600 font-medium text-base rounded-md p-3">
                Review (1)
            </div>
            <div class="mt-4">
                <!-- Task Card -->
                <div class="intro-y box relative mb-3 cursor-move">
                    <div class="p-3">
                        <div class="flex items-center">
                            <div class="font-medium text-base mr-auto">Review Training Curriculum</div>
                            <div class="dropdown ml-3">
                                <button class="dropdown-toggle w-5 h-5 text-slate-500" aria-expanded="false" data-tw-toggle="dropdown">
                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                </button>
                                <div class="dropdown-menu w-40">
                                    <ul class="dropdown-content">
                                        <li><a href="" class="dropdown-item">Edit</a></li>
                                        <li><a href="" class="dropdown-item">Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="text-slate-500 mt-2">Review and approve training materials</div>
                        <div class="flex items-center mt-3">
                            <div class="bg-warning/20 text-warning rounded px-2 mr-2">Medium Priority</div>
                            <div class="text-xs">Due: Dec 18, 2024</div>
                        </div>
                        <div class="flex items-center mt-3">
                            <div class="w-6 h-6 image-fit rounded-full">
                                <img alt="User" class="rounded-full" src="dist/images/profile-4.jpg">
                            </div>
                            <div class="text-xs text-slate-500 ml-2">James Wilson</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Review Column -->

        <!-- BEGIN: Done Column -->
        <div class="intro-y lg:mr-4 pb-4 lg:pb-0 lg:w-1/4">
            <div class="bg-slate-100 text-slate-600 font-medium text-base rounded-md p-3">
                Done (2)
            </div>
            <div class="mt-4">
                <!-- Task Card -->
                <div class="intro-y box relative mb-3 cursor-move">
                    <div class="p-3">
                        <div class="flex items-center">
                            <div class="font-medium text-base mr-auto">Initial Project Planning</div>
                            <div class="dropdown ml-3">
                                <button class="dropdown-toggle w-5 h-5 text-slate-500" aria-expanded="false" data-tw-toggle="dropdown">
                                    <i data-lucide="more-vertical" class="w-4 h-4"></i>
                                </button>
                                <div class="dropdown-menu w-40">
                                    <ul class="dropdown-content">
                                        <li><a href="" class="dropdown-item">Edit</a></li>
                                        <li><a href="" class="dropdown-item">Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="text-slate-500 mt-2">Complete initial project planning phase</div>
                        <div class="flex items-center mt-3">
                            <div class="bg-success/20 text-success rounded px-2 mr-2">Completed</div>
                            <div class="text-xs">Completed: Dec 10, 2024</div>
                        </div>
                        <div class="flex items-center mt-3">
                            <div class="w-6 h-6 image-fit rounded-full">
                                <img alt="User" class="rounded-full" src="dist/images/profile-5.jpg">
                            </div>
                            <div class="text-xs text-slate-500 ml-2">Sarah Johnson</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Done Column -->
    </div>
    <!-- END: Task Board -->
</div>
<!-- END: Content -->

<!-- BEGIN: JS Assets -->
<script>
// Initialize drag and drop functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add drag and drop functionality here
    // You'll need to include a library like Sortable.js or implement custom drag and drop
});
</script>
<!-- END: JS Assets -->

<?php get_footer(); ?>
