<?php /* Template Name: Tasks: Create */
get_header();
$b_link = '/tasks';
$b_title = 'Tasks';
$p_title = 'Create Task';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <div class="intro-y flex items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Create New Task</h2>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <div class="intro-y col-span-12 lg:col-span-8">
            <!-- BEGIN: Task Form -->
            <div class="intro-y box p-5">
                <div class="mt-3">
                    <label for="task-title" class="form-label">Task Title</label>
                    <input id="task-title" type="text" class="form-control w-full" placeholder="Enter task title">
                </div>

                <div class="mt-3">
                    <label for="task-description" class="form-label">Task Description</label>
                    <textarea id="task-description" class="form-control w-full" rows="4" placeholder="Describe the task details, requirements, and objectives"></textarea>
                </div>

                <div class="mt-3">
                    <label class="form-label">Related Project</label>
                    <select class="form-select w-full">
                        <option value="">Select Project</option>
                        <option>Inclusive Education Initiative</option>
                        <option>Vocational Training Program</option>
                        <option>Community Awareness Campaign</option>
                    </select>
                </div>

                <div class="mt-3">
                    <label class="form-label">Assignee</label>
                    <select data-placeholder="Select assignee" class="tom-select w-full">
                        <option value="">Select team member</option>
                        <option value="1">Sarah Johnson (Special Education Coordinator)</option>
                        <option value="2">David Chen (Assistive Technology Specialist)</option>
                        <option value="3">Maria Rodriguez (Inclusive Education Expert)</option>
                        <option value="4">James Wilson (Community Liaison)</option>
                    </select>
                </div>

                <div class="mt-3">
                    <div class="grid grid-cols-12 gap-2">
                        <div class="col-span-6">
                            <label class="form-label">Due Date</label>
                            <input type="date" class="form-control w-full">
                        </div>
                        <div class="col-span-6">
                            <label class="form-label">Estimated Hours</label>
                            <input type="number" class="form-control w-full" placeholder="Enter estimated hours">
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <label class="form-label">Priority</label>
                    <select class="form-select w-full">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                <div class="mt-3">
                    <label class="form-label">Dependencies</label>
                    <select data-placeholder="Select dependent tasks" class="tom-select w-full" multiple>
                        <option value="1">Task 1: Develop Learning Materials</option>
                        <option value="2">Task 2: Setup Training Environment</option>
                        <option value="3">Task 3: Coordinate with Schools</option>
                    </select>
                </div>

                <div class="mt-3">
                    <label>Attachments</label>
                    <div class="border-2 border-dashed dark:border-darkmode-400 rounded-md pt-4">
                        <div class="flex flex-wrap px-4">
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

            <!-- BEGIN: Action Buttons -->
            <div class="flex justify-end mt-5">
                <button type="button" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                <button type="button" class="btn btn-primary w-24">Create Task</button>
            </div>
            <!-- END: Action Buttons -->
        </div>

        <!-- BEGIN: Task Guidelines -->
        <div class="col-span-12 lg:col-span-4">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Task Guidelines</div>
                </div>
                <div class="mt-5">
                    <div class="flex items-center text-slate-500 mb-2">
                        <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> 
                        Provide a clear and specific task title
                    </div>
                    <div class="flex items-center text-slate-500 mb-2">
                        <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> 
                        Include detailed description with requirements
                    </div>
                    <div class="flex items-center text-slate-500 mb-2">
                        <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> 
                        Set realistic due dates and time estimates
                    </div>
                    <div class="flex items-center text-slate-500 mb-2">
                        <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> 
                        Assign to appropriate team member
                    </div>
                    <div class="flex items-center text-slate-500">
                        <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> 
                        Attach relevant documents if needed
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Task Guidelines -->
    </div>
</div>
<!-- END: Content -->

<?php get_footer(); ?>
