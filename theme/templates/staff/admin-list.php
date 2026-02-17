<?php /* Template Name: Staff: Admin - Staff List */
?>

<?php
get_header();
$b_link = '/admin';
$b_title = 'Administration';
$p_title = 'Staff Management';

include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Admin Menu -->
    <?php include get_template_directory() . "/layout/admin-menu.php"; ?>
    <!-- END: Admin Menu -->
    
    <div class="col-span-12 ">
        <!-- BEGIN: Staff List -->
        <div class="intro-y box mt-5">
            <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                <h2 class="font-medium text-base mr-auto">Staff List</h2>
                <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                    <a href="<?php echo home_url('/admin/staff/management'); ?>" class="btn btn-primary shadow-md mr-2">Add New Staff</a>
                    <div class="dropdown ml-auto sm:ml-0">
                        <button class="dropdown-toggle btn px-2 box" aria-expanded="false">
                            <span class="w-5 h-5 flex items-center justify-center">
                                <i class="w-4 h-4" data-lucide="download"></i>
                            </span>
                        </button>
                        <div class="dropdown-menu w-40">
                            <ul class="dropdown-content">
                                <li>
                                    <a href="" class="dropdown-item">
                                        <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export to Excel
                                    </a>
                                </li>
                                <li>
                                    <a href="" class="dropdown-item">
                                        <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Export to PDF
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-5">
                <div class="overflow-x-auto">
                    <table class="table table-report -mt-2">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Staff</th>
                                <th class="whitespace-nowrap">Position</th>
                                <th class="text-center whitespace-nowrap">Department</th>
                                <th class="text-center whitespace-nowrap">Team</th>
                                <th class="text-center whitespace-nowrap">Status</th>
                                <th class="text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php 
                            $demo_staff = [
                                [
                                    'first_name' => 'John',
                                    'last_name' => 'Doe',
                                    'email' => 'john.doe@stanforte.com',
                                    'pic' => 'https://via.placeholder.com/200',
                                    'position' => 'Senior Developer',
                                    'department' => 'Technology',
                                    'team_name' => 'Backend Team',
                                    'status' => 'active',
                                    '_ID' => '1'
                                ],
                                [
                                    'first_name' => 'Jane',
                                    'last_name' => 'Smith',
                                    'email' => 'jane.smith@stanforte.com',
                                    'pic' => 'https://via.placeholder.com/200',
                                    'position' => 'UX Designer',
                                    'department' => 'Design',
                                    'team_name' => 'Creative Team',
                                    'status' => 'active',
                                    '_ID' => '2'
                                ],
                                [
                                    'first_name' => 'Michael',
                                    'last_name' => 'Johnson',
                                    'email' => 'michael.j@stanforte.com',
                                    'pic' => 'https://via.placeholder.com/200',
                                    'position' => 'Project Manager',
                                    'department' => 'Operations',
                                    'team_name' => 'Project Management',
                                    'status' => 'inactive',
                                    '_ID' => '3'
                                ]
                            ];
                            
                            foreach ($demo_staff as $member): 
                                $member = (object) $member; // Convert array to object
                            ?>
                            <tr class="intro-x">
                                <td class="w-40">
                                    <div class="flex">
                                        <div class="w-10 h-10 image-fit zoom-in">
                                            <img alt="<?php echo esc_attr($member->first_name . ' ' . $member->last_name); ?>" 
                                                 class="tooltip rounded-full" 
                                                 src="<?php echo esc_url($member->pic); ?>" 
                                                 title="<?php echo esc_attr($member->first_name . ' ' . $member->last_name); ?>">
                                        </div>
                                        <div class="ml-4">
                                            <div class="font-medium whitespace-nowrap">
                                                <?php echo esc_html($member->first_name . ' ' . $member->last_name); ?>
                                            </div>
                                            <div class="text-slate-500 text-xs whitespace-nowrap">
                                                <?php echo esc_html($member->email); ?>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="font-medium whitespace-nowrap">
                                        <?php echo esc_html($member->position); ?>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <?php echo esc_html($member->department); ?>
                                </td>
                                <td class="text-center">
                                    <?php echo esc_html($member->team_name); ?>
                                </td>
                                <td class="w-40">
                                    <div class="flex items-center justify-center <?php echo $member->status === 'active' ? 'text-success' : 'text-danger'; ?>">
                                        <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> 
                                        <?php echo ucfirst(esc_html($member->status)); ?>
                                    </div>
                                </td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <a class="flex items-center mr-3" href="<?php echo home_url('/admin/staff/management?id=' . $member->_ID); ?>">
                                            <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                                        </a>
                                        <a class="flex items-center text-danger" href="javascript:;" data-tw-toggle="modal" data-tw-target="#delete-confirmation-modal">
                                            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <!-- END: Staff List -->
    </div>
</div>

<!-- BEGIN: Delete Confirmation Modal -->
<div id="delete-confirmation-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body p-0">
                <div class="p-5 text-center">
                    <i data-lucide="x-circle" class="w-16 h-16 text-danger mx-auto mt-3"></i>
                    <div class="text-3xl mt-5">Are you sure?</div>
                    <div class="text-slate-500 mt-2">Do you really want to delete this staff member? <br>This process cannot be undone.</div>
                </div>
                <div class="px-5 pb-8 text-center">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-24 mr-1">Cancel</button>
                    <button type="button" class="btn btn-danger w-24">Delete</button>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END: Delete Confirmation Modal -->

<?php get_footer(); ?>
