<?php /* Template Name: Projects Create */
get_header();
$b_link = '/projects';
$b_title = 'Projects';
$p_title = 'Create Project';

include get_template_directory() . "/templates/layout/menu.php";
?>

<!-- BEGIN: Content -->
<div class="content">
    <div class="intro-y flex items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Create Project</h2>
    </div>
    <div class="grid grid-cols-12 gap-6 mt-5">
        <div class="intro-y col-span-12 lg:col-span-8">
            <!-- BEGIN: Form Layout -->
            <div class="intro-y box p-5">
                <div>
                    <label for="project-name" class="form-label">Project Name</label>
                    <input id="project-name" type="text" class="form-control w-full" placeholder="e.g., Inclusive Education Initiative">
                </div>
                <div class="mt-3">
                    <label for="project-description" class="form-label">Project Description</label>
                    <textarea id="project-description" class="form-control w-full" rows="5" placeholder="Describe the project's goals, objectives, and expected impact on persons with disabilities"></textarea>
                </div>
                <div class="mt-3">
                    <label class="form-label">Project Category</label>
                    <select class="form-select w-full">
                        <option>Education & Empowerment</option>
                        <option>Skills Development</option>
                        <option>Advocacy & Awareness</option>
                        <option>Healthcare & Wellbeing</option>
                        <option>Economic Empowerment</option>
                        <option>Accessibility & Infrastructure</option>
                        <option>Social Inclusion</option>
                    </select>
                </div>
                <div class="mt-3">
                    <label class="form-label">Target Beneficiaries</label>
                    <select data-placeholder="Select target beneficiaries" class="tom-select w-full" multiple>
                        <option value="1">Children with Disabilities</option>
                        <option value="2">Adults with Disabilities</option>
                        <option value="3">Families and Caregivers</option>
                        <option value="4">Educational Institutions</option>
                        <option value="5">Community Organizations</option>
                        <option value="6">Healthcare Providers</option>
                    </select>
                </div>
                <div class="mt-3">
                    <label class="form-label">Project Team</label>
                    <select data-placeholder="Select team members" class="tom-select w-full" multiple>
                        <option value="1">John Doe (Project Manager)</option>
                        <option value="2">Jane Smith (Disability Rights Advocate)</option>
                        <option value="3">Robert Johnson (Special Education Expert)</option>
                        <option value="4">Emily Davis (Community Outreach)</option>
                        <option value="5">Michael Wilson (Training Coordinator)</option>
                    </select>
                </div>
                <div class="mt-3">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-control w-full">
                </div>
                <div class="mt-3">
                    <label class="form-label">End Date</label>
                    <input type="date" class="form-control w-full">
                </div>
                <div class="mt-3">
                    <label class="form-label">Budget (USD)</label>
                    <input type="number" class="form-control w-full" placeholder="Enter project budget">
                </div>
                <div class="mt-3">
                    <label>Project Documents</label>
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
                <div class="text-right mt-5">
                    <button type="button" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                    <button type="button" class="btn btn-primary w-24">Save</button>
                </div>
            </div>
            <!-- END: Form Layout -->
        </div>
        <div class="intro-y col-span-12 lg:col-span-4">
            <!-- BEGIN: Project Information -->
            <div class="intro-y box p-5">
                <div class="border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                    <div class="font-medium text-base">Project Guidelines</div>
                    <div class="text-slate-500 mt-2">
                        Create projects that promote inclusion, accessibility, and empowerment of persons with disabilities. Focus on sustainable impact and community engagement.
                    </div>
                </div>
                <div class="border-b border-slate-200/60 dark:border-darkmode-400 py-5">
                    <div class="font-medium text-base">Key Considerations</div>
                    <div class="text-slate-500 mt-2">
                        <div>• Accessibility requirements</div>
                        <div>• Cultural sensitivity</div>
                        <div>• Stakeholder engagement</div>
                        <div>• Sustainability plan</div>
                        <div>• Impact measurement</div>
                    </div>
                </div>
                <div class="pt-5">
                    <div class="font-medium text-base">Required Documents</div>
                    <div class="text-slate-500 mt-2">
                        <div>• Project proposal</div>
                        <div>• Budget breakdown</div>
                        <div>• Implementation timeline</div>
                        <div>• Risk assessment</div>
                        <div>• Monitoring & evaluation plan</div>
                    </div>
                </div>
            </div>
            <!-- END: Project Information -->
        </div>
    </div>
</div>
<!-- END: Content -->

<?php get_footer(); ?>
