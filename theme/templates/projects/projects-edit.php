<?php /* Template Name: Projects: Edit Project */
get_header();
$b_link = '/projects/edit';
$b_title = 'Edit Project';
$p_title = '';

include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="intro-y col-span-12 flex flex-wrap sm:flex-nowrap items-center mt-2">
        <h2 class="text-lg font-medium mr-auto">Edit Project</h2>
    </div>

    <!-- Project Edit Form -->
    <div class="intro-y col-span-12">
        <div class="box">
            <div class="flex flex-col p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <form id="edit-project-form" class="grid grid-cols-12 gap-4">
                    <input type="hidden" id="project_id" name="project_id" value="<?php echo isset($_GET['id']) ? esc_attr($_GET['id']) : ''; ?>">
                    
                    <!-- Basic Project Information -->
                    <div class="col-span-12 lg:col-span-6">
                        <label for="project_name" class="form-label">Project Name</label>
                        <input id="project_name" name="project_name" type="text" class="form-control" required>
                    </div>
                    
                    <div class="col-span-12 lg:col-span-6">
                        <label for="project_code" class="form-label">Project Code</label>
                        <input id="project_code" name="project_code" type="text" class="form-control" required>
                    </div>

                    <!-- Project Details -->
                    <div class="col-span-12">
                        <label for="description" class="form-label">Project Description</label>
                        <textarea id="description" name="description" class="form-control" rows="4" required></textarea>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label for="start_date" class="form-label">Start Date</label>
                        <input id="start_date" name="start_date" type="date" class="form-control" required>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label for="end_date" class="form-label">End Date</label>
                        <input id="end_date" name="end_date" type="date" class="form-control" required>
                    </div>

                    <!-- Project Status and Priority -->
                    <div class="col-span-12 lg:col-span-6">
                        <label for="status" class="form-label">Project Status</label>
                        <select id="status" name="status" class="form-select" required>
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label for="priority" class="form-label">Priority</label>
                        <select id="priority" name="priority" class="form-select" required>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    <!-- Budget Information -->
                    <div class="col-span-12 lg:col-span-6">
                        <label for="budget" class="form-label">Budget</label>
                        <input id="budget" name="budget" type="number" step="0.01" class="form-control" required>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label for="currency" class="form-label">Currency</label>
                        <select id="currency" name="currency" class="form-select" required>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>

                    <!-- Team Members -->
                    <div class="col-span-12">
                        <label class="form-label">Team Members</label>
                        <div id="team_members" class="grid grid-cols-12 gap-2">
                            <!-- Team members will be populated dynamically -->
                        </div>
                        <button type="button" id="add_team_member" class="btn btn-outline-primary mt-3">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Add Team Member
                        </button>
                    </div>

                    <!-- Documents and Attachments -->
                    <div class="col-span-12">
                        <label class="form-label">Project Documents</label>
                        <div id="document_list" class="border rounded-md p-4">
                            <!-- Existing documents will be listed here -->
                        </div>
                        <input type="file" id="project_documents" name="project_documents[]" class="form-control mt-2" multiple>
                    </div>

                    <!-- Form Actions -->
                    <div class="col-span-12 mt-6 flex justify-end">
                        <button type="button" onclick="history.back()" class="btn btn-outline-secondary w-24 mr-2">Cancel</button>
                        <button type="submit" class="btn btn-primary w-24">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // Demo data
    const demoProject = {
        name: "Inclusive Education Initiative",
        code: "IEI-2025",
        description: "A comprehensive initiative to enhance inclusive education practices across the institution.",
        start_date: "2025-01-01",
        end_date: "2025-03-20",
        status: "active",
        progress: 45,
        budget: 75000,
        currency: "USD",
        project_lead: {
            name: "Sarah Johnson",
            role: "Special Education Coordinator"
        },
        team_members: [
            {
                name: "Sarah Johnson",
                role: "Special Education Coordinator",
                image: "dist/images/user-1.jpg"
            },
            {
                name: "David Chen",
                role: "Assistive Technology Specialist",
                image: "dist/images/user-2.jpg"
            }
        ]
    };

    // Populate form with demo data
    $('#project_name').val(demoProject.name);
    $('#project_code').val(demoProject.code);
    $('#description').val(demoProject.description);
    $('#start_date').val(demoProject.start_date);
    $('#end_date').val(demoProject.end_date);
    $('#status').val(demoProject.status);
    $('#budget').val(demoProject.budget);
    $('#currency').val(demoProject.currency);

    // Populate team members
    const teamMembersContainer = $('#team_members');
    demoProject.team_members.forEach((member, index) => {
        const memberHtml = `
            <div class="col-span-12 team-member-item">
                <div class="flex items-center border rounded p-3">
                    <div class="w-10 h-10 image-fit">
                        <img alt="${member.name}" class="rounded-full" src="${member.image}">
                    </div>
                    <div class="ml-4 flex-grow">
                        <input type="text" name="team_member_name[]" class="form-control" value="${member.name}">
                        <input type="text" name="team_member_role[]" class="form-control mt-2" value="${member.role}">
                    </div>
                    <button type="button" class="btn btn-outline-secondary ml-2 remove-team-member">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        teamMembersContainer.append(memberHtml);
    });

    // Add new team member
    $('#add_team_member').click(function() {
        const newMemberHtml = `
            <div class="col-span-12 team-member-item">
                <div class="flex items-center border rounded p-3">
                    <div class="w-10 h-10 image-fit">
                        <img alt="New Member" class="rounded-full" src="dist/images/default-avatar.jpg">
                    </div>
                    <div class="ml-4 flex-grow">
                        <input type="text" name="team_member_name[]" class="form-control" placeholder="Member Name">
                        <input type="text" name="team_member_role[]" class="form-control mt-2" placeholder="Member Role">
                    </div>
                    <button type="button" class="btn btn-outline-secondary ml-2 remove-team-member">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        teamMembersContainer.append(newMemberHtml);
        feather.replace();
    });

    // Remove team member
    $(document).on('click', '.remove-team-member', function() {
        $(this).closest('.team-member-item').remove();
    });

    // Handle form submission
    $('#edit-project-form').on('submit', function(e) {
        e.preventDefault();
        // Add your form submission logic here
        console.log('Form submitted');
    });

    // Initialize feather icons
    feather.replace();
});
</script>

<?php get_footer(); ?>
