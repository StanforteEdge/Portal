<?php /* Template Name: Tasks: Edit */
get_header();
$b_link = '/tasks';
$b_title = 'Tasks';
$p_title = 'Edit Task';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <div class="intro-y flex items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Edit Task</h2>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <div class="intro-y col-span-12 lg:col-span-8">
            <!-- BEGIN: Task Form -->
            <div class="intro-y box p-5">
                <div class="mt-3">
                    <label for="task-title" class="form-label">Task Title</label>
                    <input id="task-title" type="text" class="form-control w-full" value="Develop Inclusive Education Materials">
                </div>

                <div class="mt-3">
                    <label for="task-description" class="form-label">Task Description</label>
                    <textarea id="task-description" class="form-control w-full" rows="4">Create educational materials that cater to diverse learning needs, including visual aids, audio resources, and interactive content.</textarea>
                </div>

                <div class="mt-3">
                    <label class="form-label">Related Project</label>
                    <select class="form-select w-full">
                        <option selected>Inclusive Education Initiative</option>
                        <option>Vocational Training Program</option>
                        <option>Community Awareness Campaign</option>
                    </select>
                </div>

                <div class="mt-3">
                    <label class="form-label">Assignee</label>
                    <select data-placeholder="Select assignee" class="tom-select w-full">
                        <option value="1" selected>Sarah Johnson (Special Education Coordinator)</option>
                        <option value="2">David Chen (Assistive Technology Specialist)</option>
                        <option value="3">Maria Rodriguez (Inclusive Education Expert)</option>
                        <option value="4">James Wilson (Community Liaison)</option>
                    </select>
                </div>

                <div class="mt-3">
                    <div class="grid grid-cols-12 gap-2">
                        <div class="col-span-6">
                            <label class="form-label">Due Date</label>
                            <input type="date" class="form-control w-full" value="2024-12-20">
                        </div>
                        <div class="col-span-6">
                            <label class="form-label">Estimated Hours</label>
                            <input type="number" class="form-control w-full" value="40">
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <label class="form-label">Priority</label>
                    <select class="form-select w-full">
                        <option value="high" selected>High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                <div class="mt-3">
                    <label class="form-label">Status</label>
                    <select class="form-select w-full">
                        <option value="todo">To Do</option>
                        <option value="in-progress" selected>In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                    </select>
                </div>

                <div class="mt-3">
                    <label class="form-label">Dependencies</label>
                    <select data-placeholder="Select dependent tasks" class="tom-select w-full" multiple>
                        <option value="1" selected>Task 1: Develop Learning Materials</option>
                        <option value="2">Task 2: Setup Training Environment</option>
                        <option value="3">Task 3: Coordinate with Schools</option>
                    </select>
                </div>

                <div class="mt-3">
                    <label>Attachments</label>
                    <div class="border-2 border-dashed dark:border-darkmode-400 rounded-md pt-4">
                        <div class="flex flex-wrap px-4">
                            <div class="w-24 h-24 relative image-fit mb-5 mr-5 cursor-pointer zoom-in">
                                <img alt="Document" class="rounded-md" src="dist/images/preview-1.jpg">
                                <div title="Remove this attachment?" class="tooltip w-5 h-5 flex items-center justify-center absolute rounded-full text-white bg-danger right-0 top-0 -mr-2 -mt-2">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </div>
                            </div>
                            <div class="w-24 h-24 relative image-fit mb-5 mr-5 cursor-pointer zoom-in">
                                <div class="flex items-center justify-center border-4 border-white w-full h-full rounded-md">
                                    <i data-lucide="plus" class="w-6 h-6"></i>
                                </div>
                            </div>
                        </div>
                        <div class="px-4 pb-4 flex items-center cursor-pointer relative">
                            <i data-lucide="upload" class="w-4 h-4 mr-2"></i>
                            <span class="text-primary mr-1">Upload files</span> or drag and drop
                        </div>
                    </div>
                </div>
            </div>
            <!-- END: Task Form -->

            <!-- BEGIN: Task Comments -->
            <div class="intro-y box p-5 mt-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Comments</div>
                </div>
                
                <!-- Comment List -->
                <div class="mt-5">
                    <!-- Comment Item -->
                    <div class="flex items-start mt-4">
                        <div class="w-10 h-10 flex-none image-fit rounded-full overflow-hidden">
                            <img alt="User" src="dist/images/profile-1.jpg">
                        </div>
                        <div class="ml-4 flex-1">
                            <div class="flex items-center">
                                <div class="font-medium">David Chen</div>
                                <div class="text-xs text-slate-500 ml-2">2 hours ago</div>
                            </div>
                            <div class="text-slate-500 mt-1">Visual aids are ready for review. Please check the attached files.</div>
                        </div>
                    </div>

                    <!-- Comment Item -->
                    <div class="flex items-start mt-4">
                        <div class="w-10 h-10 flex-none image-fit rounded-full overflow-hidden">
                            <img alt="User" src="dist/images/profile-2.jpg">
                        </div>
                        <div class="ml-4 flex-1">
                            <div class="flex items-center">
                                <div class="font-medium">Sarah Johnson</div>
                                <div class="text-xs text-slate-500 ml-2">3 hours ago</div>
                            </div>
                            <div class="text-slate-500 mt-1">Great progress! Let's review these in tomorrow's meeting.</div>
                        </div>
                    </div>

                    <!-- New Comment Input -->
                    <div class="mt-4 pt-4 border-t border-slate-200/60 dark:border-darkmode-400">
                        <textarea class="form-control w-full mt-2" rows="3" placeholder="Write a comment..."></textarea>
                        <button type="button" class="btn btn-primary mt-2">Post Comment</button>
                    </div>
                </div>
            </div>
            <!-- END: Task Comments -->

            <!-- BEGIN: Task History -->
            <div class="intro-y box p-5 mt-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Activity History</div>
                </div>
                
                <div class="mt-5">
                    <div class="relative flex items-center mb-3">
                        <div class="w-2 h-2 bg-primary rounded-full mr-3 absolute"></div>
                        <div class="ml-6">
                            <div class="flex items-center">
                                <div class="font-medium">Status updated to In Progress</div>
                                <div class="text-xs text-slate-500 ml-2">2 hours ago</div>
                            </div>
                            <div class="text-slate-500 mt-1">by Sarah Johnson</div>
                        </div>
                    </div>
                    <div class="relative flex items-center mb-3">
                        <div class="w-2 h-2 bg-primary rounded-full mr-3 absolute"></div>
                        <div class="ml-6">
                            <div class="flex items-center">
                                <div class="font-medium">New attachment added</div>
                                <div class="text-xs text-slate-500 ml-2">3 hours ago</div>
                            </div>
                            <div class="text-slate-500 mt-1">by David Chen</div>
                        </div>
                    </div>
                    <div class="relative flex items-center mb-3">
                        <div class="w-2 h-2 bg-primary rounded-full mr-3 absolute"></div>
                        <div class="ml-6">
                            <div class="flex items-center">
                                <div class="font-medium">Task created</div>
                                <div class="text-xs text-slate-500 ml-2">1 day ago</div>
                            </div>
                            <div class="text-slate-500 mt-1">by Sarah Johnson</div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- END: Task History -->

            <!-- BEGIN: Action Buttons -->
            <div class="flex justify-end mt-5">
                <button type="button" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                <button type="button" class="btn btn-primary w-24">Save Changes</button>
            </div>
            <!-- END: Action Buttons -->
        </div>

        <!-- BEGIN: Task Info Sidebar -->
        <div class="col-span-12 lg:col-span-4">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Task Information</div>
                </div>
                <div class="mt-4">
                    <div class="flex items-center">
                        <i data-lucide="calendar" class="w-4 h-4 text-slate-500 mr-2"></i>
                        <div class="text-slate-500">Created: Dec 15, 2024</div>
                    </div>
                    <div class="flex items-center mt-3">
                        <i data-lucide="clock" class="w-4 h-4 text-slate-500 mr-2"></i>
                        <div class="text-slate-500">Time Spent: 12h 30m</div>
                    </div>
                    <div class="flex items-center mt-3">
                        <i data-lucide="check-square" class="w-4 h-4 text-slate-500 mr-2"></i>
                        <div class="text-slate-500">Progress: 60%</div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-200/60 dark:border-darkmode-400">
                    <div class="font-medium text-base mb-2">Watchers</div>
                    <div class="flex flex-wrap">
                        <div class="w-8 h-8 image-fit mr-2 mb-2">
                            <img alt="User" class="rounded-full" src="dist/images/profile-1.jpg">
                        </div>
                        <div class="w-8 h-8 image-fit mr-2 mb-2">
                            <img alt="User" class="rounded-full" src="dist/images/profile-2.jpg">
                        </div>
                        <div class="w-8 h-8 image-fit mr-2 mb-2">
                            <img alt="User" class="rounded-full" src="dist/images/profile-3.jpg">
                        </div>
                        <button class="w-8 h-8 rounded-full border border-dashed flex items-center justify-center ml-2">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Task Info Sidebar -->
    </div>
</div>
<!-- END: Content -->

<?php get_footer(); ?>
