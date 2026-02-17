<?php /* Template Name: Projects View */
get_header();
$b_link = '/projects';
$b_title = 'Projects';
$p_title = 'View Project';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Inclusive Education Initiative</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <a href="../edit/1" class="btn btn-primary shadow-md mr-2">Edit Project</a>
            <div class="dropdown ml-auto sm:ml-0">
                <button class="dropdown-toggle btn px-2 box" aria-expanded="false" data-tw-toggle="dropdown">
                    <span class="w-5 h-5 flex items-center justify-center">
                        <i class="w-4 h-4" data-lucide="plus"></i>
                    </span>
                </button>
                <div class="dropdown-menu w-40">
                    <ul class="dropdown-content">
                        <li>
                            <a href="" class="dropdown-item">
                                <i data-lucide="users" class="w-4 h-4 mr-2"></i> Add Stakeholder
                            </a>
                        </li>
                        <li>
                            <a href="" class="dropdown-item">
                                <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Add Milestone
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <div class="intro-y grid grid-cols-12 gap-6 mt-5">
        <!-- BEGIN: Project Information -->
        <div class="col-span-12 lg:col-span-4">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Project Information</div>
                </div>
                <div class="flex items-center mt-5">
                    <i data-lucide="clipboard" class="w-4 h-4 text-slate-500 mr-2"></i> 
                    Project Status: <span class="bg-success/20 text-success rounded px-2 ml-2">In Progress</span>
                </div>
                <div class="flex items-center mt-5">
                    <i data-lucide="calendar" class="w-4 h-4 text-slate-500 mr-2"></i> 
                    Start Date: 01 Jan 2025
                </div>
                <div class="flex items-center mt-5">
                    <i data-lucide="calendar" class="w-4 h-4 text-slate-500 mr-2"></i> 
                    Due Date: 20 Mar 2025
                </div>
                <div class="flex items-center mt-5">
                    <i data-lucide="check-square" class="w-4 h-4 text-slate-500 mr-2"></i> 
                    Progress: 45%
                </div>
                <div class="flex items-center mt-5">
                    <i data-lucide="user" class="w-4 h-4 text-slate-500 mr-2"></i> 
                    Project Lead: Sarah Johnson (Special Education Coordinator)
                </div>
                <div class="flex items-center mt-5">
                    <i data-lucide="dollar-sign" class="w-4 h-4 text-slate-500 mr-2"></i> 
                    Budget: $75,000
                </div>
            </div>
            <div class="box p-5 mt-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Project Team</div>
                    <a href="javascript:;" class="ml-auto text-primary">Add Member</a>
                </div>
                <div class="mt-5">
                    <div class="flex items-center mt-3 first:mt-0">
                        <div class="w-10 h-10 image-fit">
                            <img alt="Team Member" class="rounded-full" src="dist/images/user-1.jpg">
                        </div>
                        <div class="ml-4">
                            <div class="font-medium">Sarah Johnson</div>
                            <div class="text-slate-500 text-xs mt-0.5">Special Education Coordinator</div>
                        </div>
                    </div>
                    <div class="flex items-center mt-3">
                        <div class="w-10 h-10 image-fit">
                            <img alt="Team Member" class="rounded-full" src="dist/images/user-2.jpg">
                        </div>
                        <div class="ml-4">
                            <div class="font-medium">David Chen</div>
                            <div class="text-slate-500 text-xs mt-0.5">Assistive Technology Specialist</div>
                        </div>
                    </div>
                    <div class="flex items-center mt-3">
                        <div class="w-10 h-10 image-fit">
                            <img alt="Team Member" class="rounded-full" src="dist/images/user-3.jpg">
                        </div>
                        <div class="ml-4">
                            <div class="font-medium">Maria Garcia</div>
                            <div class="text-slate-500 text-xs mt-0.5">Community Outreach Coordinator</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="box p-5 mt-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Stakeholders</div>
                </div>
                <div class="mt-5">
                    <div class="flex items-center mt-3 first:mt-0">
                        <i data-lucide="building" class="w-4 h-4 text-slate-500 mr-2"></i>
                        <div>Local Special Education Schools</div>
                    </div>
                    <div class="flex items-center mt-3">
                        <i data-lucide="users" class="w-4 h-4 text-slate-500 mr-2"></i>
                        <div>Parent Support Groups</div>
                    </div>
                    <div class="flex items-center mt-3">
                        <i data-lucide="briefcase" class="w-4 h-4 text-slate-500 mr-2"></i>
                        <div>Education Department</div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Project Information -->
        <!-- BEGIN: Project Details -->
        <div class="col-span-12 lg:col-span-8">
            <div class="box p-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Project Description</div>
                </div>
                <div class="mt-5">
                    <p>The Inclusive Education Initiative aims to enhance educational access and quality for children with disabilities through comprehensive support systems and innovative teaching methods. The project focuses on:</p>
                    <ul class="list-disc list-inside mt-3">
                        <li>Implementing assistive technology in classrooms</li>
                        <li>Training teachers in inclusive education practices</li>
                        <li>Developing individualized learning programs</li>
                        <li>Creating accessible learning materials</li>
                        <li>Establishing support networks for families</li>
                    </ul>
                    
                    <div class="font-medium text-base mt-5">Expected Outcomes:</div>
                    <ul class="list-disc list-inside mt-3">
                        <li>Increased enrollment of children with disabilities</li>
                        <li>Improved academic performance and participation</li>
                        <li>Enhanced teacher capacity in inclusive education</li>
                        <li>Stronger school-family partnerships</li>
                        <li>More accessible learning environments</li>
                    </ul>
                </div>
            </div>
            <div class="box p-5 mt-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Project Milestones</div>
                    <button class="btn btn-outline-secondary ml-auto">Add Milestone</button>
                </div>
                <div class="mt-5">
                    <div class="flex items-center p-3 border rounded-md dark:border-darkmode-400">
                        <input type="checkbox" class="form-check-input" checked>
                        <div class="ml-4 mr-auto">
                            <div class="font-medium">Needs Assessment & Stakeholder Consultation</div>
                            <div class="text-slate-500 text-xs mt-0.5">Due: 15 Jan 2025</div>
                        </div>
                        <div class="text-success">Completed</div>
                    </div>
                    <div class="flex items-center p-3 border rounded-md dark:border-darkmode-400 mt-3">
                        <input type="checkbox" class="form-check-input" checked>
                        <div class="ml-4 mr-auto">
                            <div class="font-medium">Teacher Training Program Development</div>
                            <div class="text-slate-500 text-xs mt-0.5">Due: 30 Jan 2025</div>
                        </div>
                        <div class="text-success">Completed</div>
                    </div>
                    <div class="flex items-center p-3 border rounded-md dark:border-darkmode-400 mt-3">
                        <input type="checkbox" class="form-check-input">
                        <div class="ml-4 mr-auto">
                            <div class="font-medium">Assistive Technology Implementation</div>
                            <div class="text-slate-500 text-xs mt-0.5">Due: 28 Feb 2025</div>
                        </div>
                        <div class="text-warning">In Progress</div>
                    </div>
                    <div class="flex items-center p-3 border rounded-md dark:border-darkmode-400 mt-3">
                        <input type="checkbox" class="form-check-input">
                        <div class="ml-4 mr-auto">
                            <div class="font-medium">Parent Support Network Launch</div>
                            <div class="text-slate-500 text-xs mt-0.5">Due: 15 Mar 2025</div>
                        </div>
                        <div class="text-pending">Pending</div>
                    </div>
                </div>
            </div>
            <div class="box p-5 mt-5">
                <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base truncate">Impact Metrics</div>
                </div>
                <div class="mt-5">
                    <div class="flex items-center">
                        <div class="flex-1">Number of Schools Engaged</div>
                        <div class="font-medium">12</div>
                    </div>
                    <div class="flex items-center mt-3">
                        <div class="flex-1">Teachers Trained</div>
                        <div class="font-medium">45</div>
                    </div>
                    <div class="flex items-center mt-3">
                        <div class="flex-1">Students Benefiting</div>
                        <div class="font-medium">150</div>
                    </div>
                    <div class="flex items-center mt-3">
                        <div class="flex-1">Assistive Devices Deployed</div>
                        <div class="font-medium">75</div>
                    </div>
                </div>
            </div>
        </div>
        <!-- END: Project Details -->
    </div>
</div>
<!-- END: Content -->

<?php get_footer(); ?>
