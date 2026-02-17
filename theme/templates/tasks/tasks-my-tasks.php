<?php /* Template Name: Tasks: My Tasks */
get_header();
$b_link = '/tasks';
$b_title = 'Tasks';
$p_title = 'My Tasks';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <!-- BEGIN: Task Filters -->
    <div class="intro-y grid grid-cols-12 gap-6 mt-5">
        <div class="col-span-12">
            <div class="flex flex-wrap items-center">
                <div class="mr-4 mb-2">
                    <div class="dropdown">
                        <button class="dropdown-toggle btn px-2 box" aria-expanded="false" data-tw-toggle="dropdown">
                            <span class="w-32 text-left">Filter by Status</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 ml-2"></i>
                        </button>
                        <div class="dropdown-menu w-40">
                            <ul class="dropdown-content">
                                <li><a href="" class="dropdown-item">All</a></li>
                                <li><a href="" class="dropdown-item">To Do</a></li>
                                <li><a href="" class="dropdown-item">In Progress</a></li>
                                <li><a href="" class="dropdown-item">Review</a></li>
                                <li><a href="" class="dropdown-item">Done</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="mr-4 mb-2">
                    <div class="dropdown">
                        <button class="dropdown-toggle btn px-2 box" aria-expanded="false" data-tw-toggle="dropdown">
                            <span class="w-32 text-left">Filter by Priority</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 ml-2"></i>
                        </button>
                        <div class="dropdown-menu w-40">
                            <ul class="dropdown-content">
                                <li><a href="" class="dropdown-item">All</a></li>
                                <li><a href="" class="dropdown-item">High</a></li>
                                <li><a href="" class="dropdown-item">Medium</a></li>
                                <li><a href="" class="dropdown-item">Low</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="mr-4 mb-2">
                    <div class="dropdown">
                        <button class="dropdown-toggle btn px-2 box" aria-expanded="false" data-tw-toggle="dropdown">
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
                </div>
                <div class="w-64 mr-4 mb-2">
                    <div class="relative w-full">
                        <input type="text" class="form-control w-full box pr-10" placeholder="Search tasks...">
                        <i data-lucide="search" class="w-4 h-4 absolute my-auto inset-y-0 mr-3 right-0"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Task Filters -->

    <!-- BEGIN: Tasks List -->
    <div class="intro-y grid grid-cols-12 gap-6 mt-5">
        <div class="col-span-12">
            <!-- Task Item -->
            <div class="intro-y box p-5 mb-4">
                <div class="flex flex-col lg:flex-row">
                    <div class="flex items-center flex-1">
                        <div class="ml-4 mr-auto">
                            <div class="flex items-center">
                                <div class="font-medium text-base">Develop Inclusive Education Materials</div>
                                <div class="bg-success/20 text-success rounded px-2 ml-2">High Priority</div>
                            </div>
                            <div class="text-slate-500 mt-1">Create educational materials that cater to diverse learning needs</div>
                            <div class="flex items-center mt-2 text-xs">
                                <div class="mr-3">Project: Inclusive Education Initiative</div>
                                <div class="mr-3">Due: Dec 20, 2024</div>
                                <div>Status: In Progress</div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center lg:ml-auto mt-3 lg:mt-0">
                        <a href="" class="btn btn-primary mr-2">View Details</a>
                        <div class="dropdown">
                            <button class="dropdown-toggle btn btn-outline-secondary" aria-expanded="false" data-tw-toggle="dropdown">
                                <i data-lucide="more-vertical" class="w-5 h-5"></i>
                            </button>
                            <div class="dropdown-menu w-40">
                                <ul class="dropdown-content">
                                    <li><a href="" class="dropdown-item">Mark as Complete</a></li>
                                    <li><a href="" class="dropdown-item">Edit Task</a></li>
                                    <li><a href="" class="dropdown-item">Add Comment</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task Item -->
            <div class="intro-y box p-5 mb-4">
                <div class="flex flex-col lg:flex-row">
                    <div class="flex items-center flex-1">
                        <div class="ml-4 mr-auto">
                            <div class="flex items-center">
                                <div class="font-medium text-base">Coordinate Teacher Training Workshop</div>
                                <div class="bg-warning/20 text-warning rounded px-2 ml-2">Medium Priority</div>
                            </div>
                            <div class="text-slate-500 mt-1">Organize workshop for teachers on inclusive teaching methods</div>
                            <div class="flex items-center mt-2 text-xs">
                                <div class="mr-3">Project: Inclusive Education Initiative</div>
                                <div class="mr-3">Due: Dec 25, 2024</div>
                                <div>Status: To Do</div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center lg:ml-auto mt-3 lg:mt-0">
                        <a href="" class="btn btn-primary mr-2">View Details</a>
                        <div class="dropdown">
                            <button class="dropdown-toggle btn btn-outline-secondary" aria-expanded="false" data-tw-toggle="dropdown">
                                <i data-lucide="more-vertical" class="w-5 h-5"></i>
                            </button>
                            <div class="dropdown-menu w-40">
                                <ul class="dropdown-content">
                                    <li><a href="" class="dropdown-item">Mark as Complete</a></li>
                                    <li><a href="" class="dropdown-item">Edit Task</a></li>
                                    <li><a href="" class="dropdown-item">Add Comment</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END: Tasks List -->

    <!-- BEGIN: Pagination -->
    <div class="intro-y flex flex-wrap sm:flex-row sm:flex-nowrap items-center mt-6">
        <nav class="w-full sm:w-auto sm:mr-auto">
            <ul class="pagination">
                <li class="page-item">
                    <a class="page-link" href="#">
                        <i class="w-4 h-4" data-lucide="chevrons-left"></i>
                    </a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="#">
                        <i class="w-4 h-4" data-lucide="chevron-left"></i>
                    </a>
                </li>
                <li class="page-item active"><a class="page-link" href="#">1</a></li>
                <li class="page-item"><a class="page-link" href="#">2</a></li>
                <li class="page-item"><a class="page-link" href="#">3</a></li>
                <li class="page-item"><a class="page-link" href="#">...</a></li>
                <li class="page-item">
                    <a class="page-link" href="#">
                        <i class="w-4 h-4" data-lucide="chevron-right"></i>
                    </a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="#">
                        <i class="w-4 h-4" data-lucide="chevrons-right"></i>
                    </a>
                </li>
            </ul>
        </nav>
        <select class="w-20 form-select box mt-3 sm:mt-0">
            <option>10</option>
            <option>25</option>
            <option>35</option>
            <option>50</option>
        </select>
    </div>
    <!-- END: Pagination -->
</div>
<!-- END: Content -->

<?php get_footer(); ?>
