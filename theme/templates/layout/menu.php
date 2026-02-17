<?php
$user_id = get_current_user_id();
if (empty($user_id)) {
    re_direct(home_url());
    exit();
}

$user = wp_get_current_user();
$staff = $wpdb->get_row("SELECT a._ID, a.user_id, a.role, a.first_name, a.middle_name, a.last_name, a.sex, a.address, a.email, a.personal_email, a.type, a.phone, a.phone_2, a.status, a.city, a.state, a.pic, a.cover, a.religion, a.bio, a.marital, a.languages, b.position, b.summary, b.responsibility, c.team, c.team_status, d.name as team_name 
FROM staff_jet_cct_profiles a 
LEFT JOIN staff_jet_cct_job_descriptions b ON b._ID = a.role
LEFT JOIN staff_jet_cct_team_members c ON a._ID = c.staff
LEFT JOIN staff_jet_cct_teams d ON d._ID = c.team
WHERE a.user_id = $user_id");

?>
<style>
    .scrollable__content {
        padding: 0 !important;
    }
</style>

<body class="py-5 md:py-0 bg-black/[0.15] dark:bg-transparent">
    <!-- BEGIN: Mobile Menu -->
    <div class="mobile-menu md:hidden">
        <div class="mobile-menu-bar">
            <a href="/" class="flex mr-auto">
                <img alt="Stanfort Edge" class="w-12" src="https://staff.stanforteedge.com/wp-content/uploads/2024/01/cropped-Stanforteedge-Identity_Stanforteedge-Icon-2.png">
            </a>
            <a href="javascript:;" class="mobile-menu-toggler"> <i data-lucide="bar-chart-2" class="w-8 h-8 text-white transform -rotate-90"></i> </a>
        </div>
        <div class="scrollable">
            <div class="mobile-menu-bar mx-4">
                <a href="/" class="flex mr-auto">
                    <img alt="CYFI" class="w-12" src="https://staff.stanforteedge.com/wp-content/uploads/2024/01/cropped-Stanforteedge-Identity_Stanforteedge-Icon-2.png"> Dashboard
                </a>
                <a href="javascript:;" class="mobile-menu-toggler"> <i data-lucide="x-circle" class="w-8 h-8 text-white transform -rotate-90"></i> </a>
            </div>
            <div class="mx-6 my-6 h-px" style="background-color: rgb(255 255 255 / 0.08);"></div>
            <ul class="scrollable__content py-2">
                <li>
                    <a href="<?= home_url('/dashboard'); ?>" class="menu <?= is_page('dashboard') ? 'menu--active' : ''; ?>">
                        <div class="menu__icon"> <i data-lucide="home"></i> </div>
                        <div class="menu__title">Dashboard</div>
                    </a>
                </li>
                <li>
                    <a href="<?php echo home_url('/profile'); ?>" class="menu <?= is_page('profile') || is_page('profile/jd') || is_page('profile/personal-information') || is_page('profile/documents') || is_page('profile/skills') ? 'menu--active' : ''; ?>">
                        <div class="menu__icon"> <i data-lucide="user"></i> </div>
                        <div class="menu__title">Profile</div>
                    </a>
                </li>
                <li>
                    <a href="javascript:;" class="menu <?= is_page(['tasks', 'projects', 'tasks/board']) ? 'menu--active' : ''; ?>">
                        <div class="menu__icon"> <i data-lucide="briefcase"></i> </div>
                        <div class="menu__title">
                            Tasks & Projects
                            <div class="menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['tasks', 'projects']) ? 'menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/tasks/my-tasks'); ?>" class="menu <?= is_page('tasks/my-tasks') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="check-square"></i> </div>
                                <div class="menu__title">My Tasks</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/tasks/board'); ?>" class="menu <?= is_page('tasks/board') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="layout-board"></i> </div>
                                <div class="menu__title">Task Board</div>
                            </a>
                        </li>

                        <li>
                            <a href="<?= home_url('/projects/overview'); ?>" class="menu <?= is_page('projects/overview') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="folder"></i> </div>
                                <div class="menu__title">Projects Overview</div>
                            </a>
                        </li>
                        <?php if ($staff->team_status === 2) : ?>
                            <li>
                                <a href="<?= home_url('/projects/create'); ?>" class="menu <?= is_page('projects/create') ? 'menu--active' : ''; ?>">
                                    <div class="menu__icon"> <i data-lucide="plus-square"></i> </div>
                                    <div class="menu__title">Create Project</div>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="menu <?= is_page(['requests', 'leave', 'finance', 'incidents', 'appraisals']) ? 'menu--active' : ''; ?>">
                        <div class="menu__icon"> <i data-lucide="file-text"></i> </div>
                        <div class="menu__title">
                            Requests
                            <div class="menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['requests', 'leave', 'finance', 'incidents', 'appraisals']) ? 'menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/requests/leave'); ?>" class="menu <?= is_page('requests/leave') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="calendar"></i> </div>
                                <div class="menu__title">Leave Requests</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/requests/finance'); ?>" class="menu <?= is_page('requests/finance') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="credit-card"></i> </div>
                                <div class="menu__title">Finance Requests</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/requests/incidents'); ?>" class="menu <?= is_page('requests/incidents') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="alert-triangle"></i> </div>
                                <div class="menu__title">Incident Reports</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/requests/appraisals'); ?>" class="menu <?= is_page('requests/appraisals') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="trending-up"></i> </div>
                                <div class="menu__title">Staff Appraisals</div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="menu <?= is_page(['documents']) ? 'menu--active' : ''; ?>">
                        <div class="menu__icon"> <i data-lucide="folder"></i> </div>
                        <div class="menu__title">
                            Documents
                            <div class="menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['documents']) ? 'menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/documents/my-documents'); ?>" class="menu <?= is_page('documents/my-documents') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="file"></i> </div>
                                <div class="menu__title">My Documents</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/documents/team'); ?>" class="menu <?= is_page('documents/team') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="users"></i> </div>
                                <div class="menu__title">Team Documents</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/documents/policy'); ?>" class="menu <?= is_page('documents/policy') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="book"></i> </div>
                                <div class="menu__title">Policy Documents</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/documents/strategic'); ?>" class="menu <?= is_page('documents/strategic') ? 'menu--active' : ''; ?>">
                                <div class="menu__icon"> <i data-lucide="target"></i> </div>
                                <div class="menu__title">Strategic Documents</div>
                            </a>
                        </li>
                    </ul>
                </li>
                <?php if ($staff->team_status === 2) : ?>
                    <li>
                        <a href="javascript:;" class="menu <?= is_page(['team']) ? 'menu--active' : ''; ?>">
                            <div class="menu__icon"> <i data-lucide="users"></i> </div>
                            <div class="menu__title">
                                Team Space
                                <i data-lucide="chevron-down" class="menu__sub-icon"></i>
                            </div>
                        </a>
                        <ul class="<?= is_page(['team']) ? 'menu__sub-open' : ''; ?>">
                            <li>
                                <a href="<?= home_url('/team/overview'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="layout-dashboard"></i> </div>
                                    <div class="menu__title">Team Overview</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/team/leave-approvals'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="calendar-check"></i> </div>
                                    <div class="menu__title">Leave Approvals</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/team/performance'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="activity"></i> </div>
                                    <div class="menu__title">Performance Reviews</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/team/planning'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="calendar"></i> </div>
                                    <div class="menu__title">Resource Planning</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <a href="<?= home_url('/profile'); ?>" class="menu <?= is_page('profile') ? 'menu--active' : ''; ?>">
                            <div class="menu__icon"> <i data-lucide="user"></i> </div>
                            <div class="menu__title"> Profile</div>
                        </a>
                    </li>
                    <li>
                        <a href="javascript:;" class="menu <?= is_page(['settings']) ? 'menu--active' : ''; ?>">
                            <div class="menu__icon"> <i data-lucide="settings"></i> </div>
                            <div class="menu__title">
                                Settings
                                <div class="menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?= is_page(['settings']) ? 'menu__sub-open' : ''; ?>">
                            <li>
                                <a href="<?= home_url('/settings/account'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="user-cog"></i> </div>
                                    <div class="menu__title">Account Settings</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/settings/notifications'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="bell"></i> </div>
                                    <div class="menu__title">Notification Settings</div>
                                </a>
                            </li>
                        </ul>
                    </li>

                    <li>
                        <a href="<?= $logout_link; ?>" class="menu ">
                            <div class="menu__icon"> <i data-lucide="log-out"></i> </div>
                            <div class="menu__title"> Logout</div>
                        </a>
                    </li>
                <?php endif; ?>
                <?php if (in_array('administrator', (array) $user->roles) || in_array('ed', (array) $user->roles) || in_array('coo', (array) $user->roles)) : ?>
                    <li>
                        <a href="javascript:;" class="menu <?= is_page(['admin']) ? 'menu--active' : ''; ?>">
                            <div class="menu__icon"> <i data-lucide="shield"></i> </div>
                            <div class="menu__title">
                                Administration
                                <div class="menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?= is_page(['admin']) ? 'menu__sub-open' : ''; ?>">
                            <li>
                                <a href="<?= home_url('/admin/staff'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="users"></i> </div>
                                    <div class="menu__title">Staff Management</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/admin/donors'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="heart-handshake"></i> </div>
                                    <div class="menu__title">Donor Management</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/admin/finance'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="landmark"></i> </div>
                                    <div class="menu__title">Finance Management</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/admin/settings'); ?>" class="menu">
                                    <div class="menu__icon"> <i data-lucide="settings"></i> </div>
                                    <div class="menu__title">System Settings</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
    <!-- END: Mobile Menu -->
    <div class="flex mt-[4.7rem] md:mt-0 overflow-hidden">
        <!-- BEGIN: Side Menu -->
        <nav class="side-nav">
            <a href="" class="intro-x flex items-center pl-5 pt-4 mt-3">
                <img alt="Midone - HTML Admin Template" class="w-6" src="https://staff.stanforteedge.com/wp-content/uploads/2024/01/cropped-Stanforteedge-Identity_Stanforteedge-Icon-2.png">
                <span class="hidden xl:block text-white text-lg ml-3"> Staff Portal</span>
            </a>
            <div class="side-nav__devider my-6"></div>
            <ul class="scrollable__content">
                <li>
                    <a href="<?= home_url('/new'); ?>" class=" <?= is_page('dashboard') ? 'side-menu--active' : ''; ?> side-menu">
                        <div class="side-menu__icon"> <i data-lucide="home"></i> </div>
                        <div class="side-menu__title"> Dashboard </div>
                    </a>
                </li>
                <li>
                    <a href="<?= home_url('/profile'); ?>" class="side-menu <?= is_page('profile') || is_page('profile/jd') || is_page('profile/bio') || is_page('profile/documents') || is_page('profile/skills') ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="user"></i> </div>
                        <div class="side-menu__title">Profile</div>
                    </a>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?= is_page(['tasks', 'tasks/board', 'tasks/create', 'tasks/edit']) ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="briefcase"></i> </div>
                        <div class="side-menu__title">
                            Tasks
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['tasks', 'tasks/board', 'tasks/create', 'tasks/edit', 'tasks/board']) ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/tasks'); ?>" class=" <?= is_page('tasks') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="check-square"></i> </div>
                                <div class="side-menu__title">My Tasks</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/tasks/board'); ?>" class=" <?= is_page('tasks/board') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                <div class="side-menu__title">Task Board</div>
                            </a>
                        </li>
                        <li class="<?= is_page('tasks/edit') ? '' : 'hidden'; ?>">
                            <a href="<?= home_url('/tasks/edit'); ?>" class=" <?= is_page('tasks/edit') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="edit"></i> </div>
                                <div class="side-menu__title">Edit</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/tasks/create'); ?>" class=" <?= is_page('tasks/create') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="plus-square"></i> </div>
                                <div class="side-menu__title">Create</div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?= is_page(['projects', 'projects/create', 'projects/view', 'projects/reports', 'projects/edit']) ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="briefcase"></i> </div>
                        <div class="side-menu__title">
                            Projects
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['projects', 'projects/create', 'projects/reports', 'projects/view', 'projects/edit']) ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/projects'); ?>" class=" <?= is_page('projects') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="folder"></i> </div>
                                <div class="side-menu__title">All Projects</div>
                            </a>
                        </li>
                        <li class="<?= is_page('projects/view') ? '' : 'hidden'; ?>">
                            <a href="<?= home_url('/projects/view'); ?>" class=" <?= is_page('projects/view') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="folder"></i> </div>
                                <div class="side-menu__title">Project</div>
                            </a>
                        </li>
                        <?php if ($staff->team_status == 2) : ?>
                            <li>
                                <a href="<?= home_url('/projects/create'); ?>" class=" <?= is_page('projects/create') ? 'side-menu--active' : ''; ?> side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="plus-square"></i> </div>
                                    <div class="side-menu__title">Create Project</div>
                                </a>
                            </li>
                            <li class="<?= is_page('projects/edit') ? '' : 'hidden'; ?>">
                                <a href="<?= home_url('/projects/edit'); ?>" class=" <?= is_page('projects/edit') ? 'side-menu--active' : ''; ?> side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="edit"></i> </div>
                                    <div class="side-menu__title">Edit Project</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/projects/reports'); ?>" class=" <?= is_page('projects/reports') ? 'side-menu--active' : ''; ?> side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="bar-chart-2"></i> </div>
                                    <div class="side-menu__title"> Project Reports</div>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?= is_page(['requests', 'leave', 'finance', 'incidents', 'appraisals', 'leave/apply', 'leave/history', 'leave/approve', 'leave/overview']) ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                        <div class="side-menu__title">
                            Requests
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['requests', 'leave', 'finance', 'incidents', 'appraisals', 'leave/apply', 'leave/history', 'leave/approve', 'leave/overview']) ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="javascript:;" class="side-menu <?= is_page(['finance', 'finance/overview', 'finance/income-records', 'finance/reports', 'finance/payroll', 'finance/vendors', 'finance/compliance']) ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="credit-card"></i> </div>
                                <div class="side-menu__title">
                                    Finance Management
                                    <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                </div>
                            </a>
                            <ul class="<?= is_page('finance') || is_page('finance/overview') || is_page('finance/income-records') || is_page('finance/reports') || is_page('finance/payroll') || is_page('finance/vendors') || is_page('finance/compliance') ? 'side-menu__sub-open' : ''; ?>">
                                <li>
                                    <a href="<?= home_url('/finance/overview'); ?>" class="side-menu <?= is_page('finance/overview') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="activity"></i> </div>
                                        <div class="side-menu__title"> Overview </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="<?= home_url('/finance/income-records'); ?>" class="side-menu <?= is_page('finance/income-records') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="dollar-sign"></i> </div>
                                        <div class="side-menu__title"> Income Records </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="<?= home_url('/finance/reports'); ?>" class="side-menu <?= is_page('finance/reports') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                        <div class="side-menu__title"> Reports </div>
                                    </a>
                                </li>
                                <?php if (current_user_can('accountant') || current_user_can('hr') || current_user_can('administrator')) : ?>
                                    <li>
                                        <a href="<?= home_url('/finance/payroll'); ?>" class="side-menu <?= is_page('finance/payroll') ? 'side-menu--active' : ''; ?>">
                                            <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                            <div class="side-menu__title"> Payroll </div>
                                        </a>
                                    </li>
                                <?php endif; ?>
                                <?php if (current_user_can('accountant') || current_user_can('administrator')) : ?>
                                    <li>
                                        <a href="<?= home_url('/finance/vendors'); ?>" class="side-menu <?= is_page('finance/vendors') ? 'side-menu--active' : ''; ?>">
                                            <div class="side-menu__icon"> <i data-lucide="briefcase"></i> </div>
                                            <div class="side-menu__title"> Vendors </div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="<?= home_url('/finance/compliance'); ?>" class="side-menu <?= is_page('finance/compliance') ? 'side-menu--active' : ''; ?>">
                                            <div class="side-menu__icon"> <i data-lucide="shield"></i> </div>
                                            <div class="side-menu__title"> Compliance </div>
                                        </a>
                                    </li>
                                <?php endif; ?>
                            </ul>
                        </li>
                        <li>
                            <a href="javascript:;" class="side-menu <?= is_page(['leave', 'leave/apply', 'leave/history', 'leave/approve', 'leave/overview']) ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="calendar"></i> </div>
                                <div class="side-menu__title">
                                    Leave Requests
                                    <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                </div>
                            </a>
                            <ul class="<?= is_page('leave') || is_page('leave/apply') || is_page('leave/history') || is_page('leave/approve') || is_page('leave/overview') ? 'side-menu__sub-open' : ''; ?>">
                                <li>
                                    <a href="<?= home_url('/leave'); ?>" class="side-menu <?= is_page('leave') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                        <div class="side-menu__title"> Dashboard </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="<?= home_url('/leave/apply'); ?>" class="side-menu <?= is_page('leave/apply') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="plus-circle"></i> </div>
                                        <div class="side-menu__title"> Apply for Leave </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="<?= home_url('/leave/history'); ?>" class="side-menu <?= is_page('leave/history') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="clock"></i> </div>
                                        <div class="side-menu__title"> Leave History </div>
                                    </a>
                                </li>
                                <?php if (current_user_can('hr') || current_user_can('team_lead') || current_user_can('administrator')) : ?>
                                    <li>
                                        <a href="<?= home_url('/leave/approve'); ?>" class="side-menu <?= is_page('leave/approve') ? 'side-menu--active' : ''; ?>">
                                            <div class="side-menu__icon"> <i data-lucide="check-square"></i> </div>
                                            <div class="side-menu__title"> Approve Leave </div>
                                        </a>
                                    </li>
                                <?php endif; ?>
                                <?php if (current_user_can('hr') || current_user_can('ceo') || current_user_can('coo') || current_user_can('administrator')) : ?>
                                    <li>
                                        <a href="<?= home_url('/leave/overview'); ?>" class="side-menu <?= is_page('leave/overview') ? 'side-menu--active' : ''; ?>">
                                            <div class="side-menu__icon"> <i data-lucide="pie-chart"></i> </div>
                                            <div class="side-menu__title"> Leave Overview </div>
                                        </a>
                                    </li>
                                <?php endif; ?>
                            </ul>
                        </li>
                        <li>
                            <a href="<?= home_url('/requests/incidents'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="alert-triangle"></i> </div>
                                <div class="side-menu__title">Incident Reports</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/requests/appraisals'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="trending-up"></i> </div>
                                <div class="side-menu__title">Staff Appraisals</div>
                            </a>
                        </li>
                    </ul>

                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?= is_page(['documents', 'documents/team', 'documents/policy', 'documents/strategic', 'documents/board']) ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="folder"></i> </div>
                        <div class="side-menu__title">
                            Documents
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['documents']) ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/documents'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file"></i> </div>
                                <div class="side-menu__title">My Documents</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/documents/team'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                <div class="side-menu__title">Team Documents</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/documents/policy'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="book"></i> </div>
                                <div class="side-menu__title">Policy Documents</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/documents/strategic'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="target"></i> </div>
                                <div class="side-menu__title">Strategic Documents</div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?= in_array($b_link, ['/attendance', '/attendance/history', '/attendance/overview', '/attendance/stats']) ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="clock"></i> </div>
                        <div class="side-menu__title">
                            Time Management
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= in_array($b_link, ['/attendance', '/attendance/history', '/attendance/overview', '/attendance/stats']) ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="/attendance" class="side-menu <?= $b_link == '/attendance' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="user-check"></i> </div>
                                <div class="side-menu__title"> Check In/Out </div>
                            </a>
                        </li>
                        <li>
                            <a href="/attendance/history" class="side-menu <?= $b_link == '/attendance/history' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="history"></i> </div>
                                <div class="side-menu__title"> My History </div>
                            </a>
                        </li>

                        <li>
                            <a href="/attendance/overview" class="side-menu <?= $b_link == '/attendance/overview' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                <div class="side-menu__title"> Staff Overview </div>
                            </a>
                        </li>
                        <li>
                            <a href="/attendance/stats" class="side-menu <?= $b_link == '/attendance/stats' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="bar-chart-2"></i> </div>
                                <div class="side-menu__title"> Statistics </div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?= is_page('team') || is_page('team/projects') || is_page('team/request')  || is_page('team/tasks') ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                        <div class="side-menu__title">
                            Team
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page('team') || is_page('team/projects') || is_page('team/request')  || is_page('team/tasks') ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/team'); ?>" class=" <?= is_page('team') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                <div class="side-menu__title">Team</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/team/tasks'); ?>" class=" <?= is_page('team/tasks') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Tasks</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/team/projects'); ?>" class=" <?= is_page('team/projects') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Projects</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/team/requests'); ?>" class=" <?= is_page('team/requests') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Requests</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/team/reports'); ?>" class=" <?= is_page('team/reports') ? 'side-menu--active' : ''; ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Reports</div>
                            </a>
                        </li>
                    </ul>
                </li>
                <?php if ($staff->team_status === 2) : ?>
                    <li>
                        <a href="javascript:;" class="side-menu <?= is_page(['team']) ? 'side-menu--active' : ''; ?>">
                            <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                            <div class="side-menu__title">
                                Team Space
                                <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?= is_page(['team']) ? 'side-menu__sub-open' : ''; ?>">
                            <li>
                                <a href="<?= home_url('/team/overview'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="layout-dashboard"></i> </div>
                                    <div class="side-menu__title">Team Overview</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/team/leave-approvals'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="calendar-check"></i> </div>
                                    <div class="side-menu__title">Leave Approvals</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/team/performance'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="activity"></i> </div>
                                    <div class="side-menu__title">Performance Reviews</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/team/planning'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="calendar"></i> </div>
                                    <div class="side-menu__title">Resource Planning</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <div class="side-nav__devider my-6"></div>
                <?php endif; ?>
                <div class="side-nav__devider my-6"></div>
                <?php if (in_array('accountant', (array) $user->roles)) { ?>
                    <li>
                        <a href="javascript:;" class="side-menu <?= is_page(['finance', 'finance/overview', 'finance/income-records', 'finance/reports', 'finance/payroll', 'finance/vendors', 'finance/compliance', 'accounts/requests', 'accounts/requests/requests', 'accounts/requests/request']) ? 'side-menu--active' : ''; ?>">
                            <div class="side-menu__icon"> <i data-lucide="credit-card"></i> </div>
                            <div class="side-menu__title">
                                Finance Management
                                <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?= is_page('finance') || is_page('finance/overview') || is_page('finance/income-records') || is_page('finance/reports') || is_page('finance/payroll') || is_page('finance/vendors') || is_page('finance/compliance') ? 'side-menu__sub-open' : ''; ?>">
                            <li>
                                <a href="<?= home_url('/finance/overview'); ?>" class="side-menu <?= is_page('finance/overview') ? 'side-menu--active' : ''; ?>">
                                    <div class="side-menu__icon"> <i data-lucide="activity"></i> </div>
                                    <div class="side-menu__title"> Overview </div>
                                </a>
                            </li>
                            <li>
                                        <a href="javascript:;" class="side-menu <?php if (is_page('accounts/requests') || is_page('accounts/requests/request') ||  is_page('accounts/requests/requests')) {
                                                                                    echo 'side-menu--active';
                                                                                } ?>">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">
                                                Requests
                                                <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                            </div>
                                        </a>
                                        <ul class="<?php if (is_page('accounts/requests')  || is_page('accounts/requests/request') || is_page('accounts/requests/requests')) {
                                                        echo 'side-menu__sub-open';
                                                    } ?>">
                                            <li>
                                                <a href="<?php echo home_url('/accounts/requests'); ?>" class=" <?php if (is_page('accounts/requests')) {
                                                                                                                    echo 'side-menu--active';
                                                                                                                } ?> side-menu">
                                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                    <div class="side-menu__title"> Overview</div>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="<?php echo home_url('/accounts/requests/requests'); ?>" class=" <?php if (is_page('accounts/requests/requests')) {
                                                                                                                                echo 'side-menu--active';
                                                                                                                            } ?> side-menu">
                                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                    <div class="side-menu__title">Requests</div>
                                                </a>
                                            </li>
                                            <?php if (is_page('accounts/requests/request')) : ?>
                                                <li>
                                                    <a href="<?php echo home_url('/accounts/requests/request/?id=' . $id); ?>" class=" <?php if (is_page('accounts/requests/request')) {
                                                                                                                                            echo 'side-menu--active';
                                                                                                                                        } ?> side-menu">
                                                        <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                        <div class="side-menu__title"> Request</div>
                                                    </a>
                                                </li>
                                            <?php endif; ?>
                                        </ul>
                                    </li>
                            <li>
                                <a href="<?= home_url('/finance/income-records'); ?>" class="side-menu <?= is_page('finance/income-records') ? 'side-menu--active' : ''; ?>">
                                    <div class="side-menu__icon"> <i data-lucide="dollar-sign"></i> </div>
                                    <div class="side-menu__title"> Income Records </div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/finance/reports'); ?>" class="side-menu <?= is_page('finance/reports') ? 'side-menu--active' : ''; ?>">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title"> Reports </div>
                                </a>
                            </li>
                            <?php if (current_user_can('accountant') || current_user_can('hr') || current_user_can('administrator')) : ?>
                                <li>
                                    <a href="<?= home_url('/finance/payroll'); ?>" class="side-menu <?= is_page('finance/payroll') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                        <div class="side-menu__title"> Payroll </div>
                                    </a>
                                </li>
                            <?php endif; ?>
                            <?php if (current_user_can('accountant') || current_user_can('administrator')) : ?>
                                <li>
                                    <a href="<?= home_url('/finance/vendors'); ?>" class="side-menu <?= is_page('finance/vendors') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="briefcase"></i> </div>
                                        <div class="side-menu__title"> Vendors </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="<?= home_url('/finance/compliance'); ?>" class="side-menu <?= is_page('finance/compliance') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="shield"></i> </div>
                                        <div class="side-menu__title"> Compliance </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="<?= home_url('/finance/budgets'); ?>" class="side-menu <?= is_page('finance/budgets') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="shield"></i> </div>
                                        <div class="side-menu__title"> Budgets </div>
                                    </a>
                                </li>
                            <?php endif; ?>
                        </ul>
                    </li>
                <?php } ?>
                <?php if (in_array('admin', (array) $user->roles) || in_array('finance', (array) $user->roles) || in_array('crm', (array) $user->roles) || in_array('ceo', (array) $user->roles) || in_array('coo', (array) $user->roles)): ?>
                    <li>
                        <a href="javascript:;" class="<?= is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams') ? 'side-menu--active' : ''; ?> side-menu">
                            <div class="side-menu__icon"> <i data-lucide="home"></i> </div>
                            <div class="side-menu__title">
                                Admin
                                <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?= is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams') || is_page('admin/projects') ||   is_page('admin/projects/project') ||   is_page('admin/projects/new') ? 'side-menu__sub-open' : ''; ?>">
                            <li>
                                <a href="javascript:;" class="side-menu <?= is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams') ? 'side-menu--active' : ''; ?>">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">
                                        Staff
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                                <ul class="<?= is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams') ? 'side-menu__sub-open' : ''; ?>">
                                    <li>
                                        <a href="<?= home_url('/admin/staff/all'); ?>" class=" <?= is_page('admin/staff/all') ? 'side-menu--active' : ''; ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">All Staff</div>
                                        </a>
                                    </li>
                                    <?php if (is_page('admin/staff/view')) : ?>
                                        <li>
                                            <a href="<?= home_url('/admin/staff/view/?id=' . $id); ?>" class=" <?= is_page('admin/staff/view') ? 'side-menu--active' : ''; ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title"> View Staff</div>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                    <li>
                                        <a href="<?= home_url('/admin/staff/types'); ?>" class=" <?= is_page('admin/staff/types') ? 'side-menu--active' : ''; ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Types</div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="<?= home_url('/admin/staff/teams'); ?>" class=" <?= is_page('admin/staff/teams') ? 'side-menu--active' : ''; ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Teams</div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="<?= home_url('/admin/staff/roles'); ?>" class=" <?= is_page('admin/staff/roles') ? 'side-menu--active' : ''; ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Roles</div>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <a href="javascript:;" class="side-menu <?= is_page('admin/projects') ||   is_page('admin/projects/project') ||   is_page('admin/projects/new') ? 'side-menu--active' : ''; ?>">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">
                                        Projects
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                                <ul class="<?= is_page('admin/projects') ||   is_page('admin/projects/project') ||   is_page('admin/projects/new') ? 'side-menu__sub-open' : ''; ?>">
                                    <li>
                                        <a href="<?= home_url('/admin/projects'); ?>" class=" <?= is_page('admin/projects') ? 'side-menu--active' : ''; ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Projects</div>
                                        </a>
                                    </li>
                                    <?php if (is_page('admin/projects/project')) : ?>
                                        <li>
                                            <a href="<?= home_url('/admin/projects/project/?id=' . $id); ?>" class=" <?= is_page('admin/projects/project') ? 'side-menu--active' : ''; ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title"> Project</div>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                    <li>
                                        <a href="<?= home_url('/admin/projects/new'); ?>" class=" <?= is_page('admin/projects/new') ? 'side-menu--active' : ''; ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">New</div>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <?php if (in_array(('ed'), (array) $user->roles) || in_array(('coo'), (array) $user->roles)) { ?>
                                <li>
                                    <a href="javascript:;" class="side-menu <?= is_page('admin/requests') || is_page('admin/requests/request') ||  is_page('admin/requests/requests') ? 'side-menu--active' : ''; ?>">
                                        <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                        <div class="side-menu__title">
                                            Requests
                                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                        </div>
                                    </a>
                                    <ul class="<?= is_page('admin/requests')  || is_page('admin/requests/request') || is_page('admin/requests/requests') ? 'side-menu__sub-open' : ''; ?>">
                                        <li>
                                            <a href="<?= home_url('/admin/requests'); ?>" class=" <?= is_page('admin/requests') ? 'side-menu--active' : ''; ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title"> Overview</div>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="<?= home_url('/admin/requests/requests'); ?>" class=" <?= is_page('admin/requests/requests') ? 'side-menu--active' : ''; ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title">Requests</div>
                                            </a>
                                        </li>
                                        <?php if (is_page('admin/requests/request')) : ?>
                                            <li>
                                                <a href="<?= home_url('/admin/requests/request/?id=' . $id); ?>" class=" <?= is_page('admin/requests/request') ? 'side-menu--active' : ''; ?> side-menu">
                                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                    <div class="side-menu__title"> Request</div>
                                                </a>
                                            </li>
                                        <?php endif; ?>
                                    </ul>
                                </li>
                            <?php } ?>
                            <li>
                                <a href="javascript:;" class="side-menu <?= is_page('donors') || is_page('donors') || is_page('donors/add') || is_page('donors/edit') || is_page('donors/communications') ? 'side-menu--active' : ''; ?>">
                                    <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                    <div class="side-menu__title">
                                        Donors
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                                <ul class="<?= is_page('donors') || is_page('donors') || is_page('donors/add') || is_page('donors/edit') || is_page('donors/communications') ? 'side-menu__sub-open' : ''; ?>">
                                    <li>
                                        <a href="<?= home_url('/donors'); ?>" class="side-menu <?= is_page('donors') ? 'side-menu--active' : ''; ?>">
                                            <div class="side-menu__icon"> <i data-lucide="layout-dashboard"></i> </div>
                                            <div class="side-menu__title"> Overview </div>
                                        </a>
                                    </li>
                                    <?php if (in_array('hr', (array) $user->roles) || in_array('crm', (array) $user->roles)) { ?>
                                        <li>
                                            <a href="<?= home_url('/donors/add'); ?>" class="side-menu <?= is_page('donors/add') ? 'side-menu--active' : ''; ?>">
                                                <div class="side-menu__icon"> <i data-lucide="user-plus"></i> </div>
                                                <div class="side-menu__title"> Add Donor </div>
                                            </a>
                                        </li>
                                    <?php } ?>
                                    <?php if (isset($_GET['id']) && (is_page('donors/edit') || is_page('donors/communications'))) : ?>
                                        <li>
                                            <a href="<?= home_url('/donors/edit?id=' . $_GET['id']); ?>" class="side-menu <?= is_page('donors/edit') ? 'side-menu--active' : ''; ?>">
                                                <div class="side-menu__icon"> <i data-lucide="edit"></i> </div>
                                                <div class="side-menu__title"> Edit Donor </div>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="<?= home_url('/donors/communications?id=' . $_GET['id']); ?>" class="side-menu <?= is_page('donors/communications') ? 'side-menu--active' : ''; ?>">
                                                <div class="side-menu__icon"> <i data-lucide="mail"></i> </div>
                                                <div class="side-menu__title"> Communications </div>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                </ul>
                            </li>
                        </ul>
                    </li>
                <?php endif; ?>
                <?php if (in_array('admin', (array) $user->roles) || in_array('ceo', (array) $user->roles) || in_array('coo', (array) $user->roles)): ?>
                    <li>
                        <a href="javascript:;" class="side-menu <?= is_page(['admin']) ? 'side-menu--active' : ''; ?>">
                            <div class="side-menu__icon"> <i data-lucide="shield"></i> </div>
                            <div class="side-menu__title">
                                Administration
                                <div class="side-menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?= is_page(['admin']) ? 'side-menu__sub-open' : ''; ?>">
                            <li>
                                <a href="<?= home_url('/admin/staff'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                    <div class="side-menu__title">Staff Management</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/admin/donors'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="heart"></i> </div>
                                    <div class="side-menu__title">Donor Management</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/admin/finance'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="dollar-sign"></i> </div>
                                    <div class="side-menu__title">Finance Management</div>
                                </a>
                            </li>
                            <li>
                                <a href="<?= home_url('/admin/settings'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="settings"></i> </div>
                                    <div class="side-menu__title">System Settings</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                <?php endif ?>
                <li>
                    <a href="javascript:;" class="side-menu <?= is_page(['settings']) ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="settings"></i> </div>
                        <div class="side-menu__title">
                            Settings
                            <div class="side-menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?= is_page(['settings']) ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="<?= home_url('/settings/account'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="user-cog"></i> </div>
                                <div class="side-menu__title">Account Settings</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?= home_url('/settings/notifications'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="bell"></i> </div>
                                <div class="side-menu__title">Notification Settings</div>
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        </nav>
        <!-- END: Side Menu -->
        <!-- BEGIN: Content -->
        <div class="content">
            <!-- BEGIN: Top Bar -->
            <div class="top-bar -mx-4 px-4 md:mx-0 md:px-0">
                <!-- BEGIN: Breadcrumb -->
                <nav aria-label="breadcrumb" class="-intro-x mr-auto  flex">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="<?= $b_link; ?>"><?= $b_title; ?></a></li>
                        <li class="breadcrumb-item active" aria-current="page"><?= $p_title; ?></li>
                    </ol>
                </nav>
                <!-- END: Breadcrumb -->
                <div class="top-bar">
                    <!-- BEGIN: Search -->
                    <div class="intro-x relative mr-3 sm:mr-6">
                        <div class="search hidden sm:block">
                            <input type="text" class="search__input form-control border-transparent" placeholder="Search...">
                            <i data-lucide="search" class="search__icon dark:text-slate-500"></i>
                        </div>
                        <a class="notification sm:hidden" href=""> <i data-lucide="search" class="notification__icon dark:text-slate-500"></i> </a>
                        <div class="search-result">
                            <div class="search-result__content">
                                <div class="search-result__content__title">Pages</div>
                                <div class="mb-5">
                                    <a href="" class="flex items-center">
                                        <div class="w-8 h-8 bg-success/20 dark:bg-success/10 text-success flex items-center justify-center rounded-full"> <i class="w-4 h-4" data-lucide="inbox"></i> </div>
                                        <div class="ml-3">Mail Settings</div>
                                    </a>
                                    <a href="" class="flex items-center mt-2">
                                        <div class="w-8 h-8 bg-pending/10 text-pending flex items-center justify-center rounded-full"> <i class="w-4 h-4" data-lucide="users"></i> </div>
                                        <div class="ml-3">Users & Permissions</div>
                                    </a>
                                    <a href="" class="flex items-center mt-2">
                                        <div class="w-8 h-8 bg-primary/10 dark:bg-primary/20 text-primary/80 flex items-center justify-center rounded-full"> <i class="w-4 h-4" data-lucide="credit-card"></i> </div>
                                        <div class="ml-3">Transactions Report</div>
                                    </a>
                                </div>
                                <div class="search-result__content__title">Users</div>
                                <div class="mb-5">
                                    <a href="" class="flex items-center mt-2">
                                        <div class="w-8 h-8 image-fit">
                                            <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        </div>
                                        <div class="ml-3">Kate Winslet</div>
                                        <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">katewinslet@left4code.com</div>
                                    </a>
                                    <a href="" class="flex items-center mt-2">
                                        <div class="w-8 h-8 image-fit">
                                            <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        </div>
                                        <div class="ml-3">Russell Crowe</div>
                                        <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">russellcrowe@left4code.com</div>
                                    </a>
                                    <a href="" class="flex items-center mt-2">
                                        <div class="w-8 h-8 image-fit">
                                            <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        </div>
                                        <div class="ml-3">Angelina Jolie</div>
                                        <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">angelinajolie@left4code.com</div>
                                    </a>
                                    <a href="" class="flex items-center mt-2">
                                        <div class="w-8 h-8 image-fit">
                                            <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        </div>
                                        <div class="ml-3">Leonardo DiCaprio</div>
                                        <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">leonardodicaprio@left4code.com</div>
                                    </a>
                                </div>
                                <div class="search-result__content__title">Products</div>
                                <a href="" class="flex items-center mt-2">
                                    <div class="w-8 h-8 image-fit">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                    </div>
                                    <div class="ml-3">Samsung Galaxy S20 Ultra</div>
                                    <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">Smartphone &amp; Tablet</div>
                                </a>
                                <a href="" class="flex items-center mt-2">
                                    <div class="w-8 h-8 image-fit">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                    </div>
                                    <div class="ml-3">Nikon Z6</div>
                                    <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">Photography</div>
                                </a>
                                <a href="" class="flex items-center mt-2">
                                    <div class="w-8 h-8 image-fit">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                    </div>
                                    <div class="ml-3">Samsung Q90 QLED TV</div>
                                    <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">Electronic</div>
                                </a>
                                <a href="" class="flex items-center mt-2">
                                    <div class="w-8 h-8 image-fit">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                    </div>
                                    <div class="ml-3">Nike Tanjun</div>
                                    <div class="ml-auto w-48 truncate text-slate-500 text-xs text-right">Sport &amp; Outdoor</div>
                                </a>
                            </div>
                        </div>
                    </div>
                    <!-- END: Search -->
                    <!-- BEGIN: Notifications -->
                    <div class="intro-x dropdown  mr-3 sm:mr-6">
                        <div class="dropdown-toggle notification notification--bullet cursor-pointer" role="button" aria-expanded="false" data-tw-toggle="dropdown"> <i data-lucide="bell" class="notification__icon dark:text-slate-500"></i> </div>
                        <div class="notification-content pt-2 dropdown-menu">
                            <div class="notification-content__box dropdown-content">
                                <div class="notification-content__title">Notifications</div>
                                <div class="cursor-pointer relative flex items-center ">
                                    <div class="w-12 h-12 flex-none image-fit mr-1">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        <div class="w-3 h-3 bg-success absolute right-0 bottom-0 rounded-full border-2 border-white dark:border-darkmode-600"></div>
                                    </div>
                                    <div class="ml-2 overflow-hidden">
                                        <div class="flex items-center">
                                            <a href="javascript:;" class="font-medium truncate mr-5">Kate Winslet</a>
                                            <div class="text-xs text-slate-400 ml-auto whitespace-nowrap">06:05 AM</div>
                                        </div>
                                        <div class="w-full truncate text-slate-500 mt-0.5">Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 20</div>
                                    </div>
                                </div>
                                <div class="cursor-pointer relative flex items-center mt-5">
                                    <div class="w-12 h-12 flex-none image-fit mr-1">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        <div class="w-3 h-3 bg-success absolute right-0 bottom-0 rounded-full border-2 border-white dark:border-darkmode-600"></div>
                                    </div>
                                    <div class="ml-2 overflow-hidden">
                                        <div class="flex items-center">
                                            <a href="javascript:;" class="font-medium truncate mr-5">Russell Crowe</a>
                                            <div class="text-xs text-slate-400 ml-auto whitespace-nowrap">05:09 AM</div>
                                        </div>
                                        <div class="w-full truncate text-slate-500 mt-0.5">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem </div>
                                    </div>
                                </div>
                                <div class="cursor-pointer relative flex items-center mt-5">
                                    <div class="w-12 h-12 flex-none image-fit mr-1">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        <div class="w-3 h-3 bg-success absolute right-0 bottom-0 rounded-full border-2 border-white dark:border-darkmode-600"></div>
                                    </div>
                                    <div class="ml-2 overflow-hidden">
                                        <div class="flex items-center">
                                            <a href="javascript:;" class="font-medium truncate mr-5">Angelina Jolie</a>
                                            <div class="text-xs text-slate-400 ml-auto whitespace-nowrap">05:09 AM</div>
                                        </div>
                                        <div class="w-full truncate text-slate-500 mt-0.5">There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomi</div>
                                    </div>
                                </div>
                                <div class="cursor-pointer relative flex items-center mt-5">
                                    <div class="w-12 h-12 flex-none image-fit mr-1">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        <div class="w-3 h-3 bg-success absolute right-0 bottom-0 rounded-full border-2 border-white dark:border-darkmode-600"></div>
                                    </div>
                                    <div class="ml-2 overflow-hidden">
                                        <div class="flex items-center">
                                            <a href="javascript:;" class="font-medium truncate mr-5">Leonardo DiCaprio</a>
                                            <div class="text-xs text-slate-400 ml-auto whitespace-nowrap">01:10 PM</div>
                                        </div>
                                        <div class="w-full truncate text-slate-500 mt-0.5">There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomi</div>
                                    </div>
                                </div>
                                <div class="cursor-pointer relative flex items-center mt-5">
                                    <div class="w-12 h-12 flex-none image-fit mr-1">
                                        <img alt="Midone - HTML Admin Template" class="rounded-full" src="">
                                        <div class="w-3 h-3 bg-success absolute right-0 bottom-0 rounded-full border-2 border-white dark:border-darkmode-600"></div>
                                    </div>
                                    <div class="ml-2 overflow-hidden">
                                        <div class="flex items-center">
                                            <a href="javascript:;" class="font-medium truncate mr-5">Leonardo DiCaprio</a>
                                            <div class="text-xs text-slate-400 ml-auto whitespace-nowrap">05:09 AM</div>
                                        </div>
                                        <div class="w-full truncate text-slate-500 mt-0.5">There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomi</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- END: Notifications -->

                    <!-- BEGIN: Account Menu -->
                    <div class="intro-x dropdown w-8 h-8">
                        <div class="dropdown-toggle w-8 h-8 rounded-full overflow-hidden shadow-lg image-fit zoom-in" role="button" aria-expanded="false" data-tw-toggle="dropdown">
                            <img alt="<?= $staff->first_name; ?>" src="<?= !empty($staff->pic) ? $staff->pic : 'https://staff.stanforteedge.com/wp-content/uploads/2024/02/user.png'; ?>">
                        </div>
                        <div class="dropdown-menu w-56">
                            <ul class="dropdown-content bg-primary text-white">
                                <li class="p-2">
                                    <div class="font-medium"><?= $staff->first_name . ' ' . $staff->last_name; ?></div>
                                    <div class="text-xs text-white/70 mt-0.5 dark:text-slate-500"><?= $staff->position; ?></div>
                                </li>
                                <li>
                                    <hr class="dropdown-divider border-white/[0.08]">
                                </li>
                                <li>
                                    <a href="/profile/" class="dropdown-item hover:bg-white/5"> <i data-lucide="user" class="w-4 h-4 mr-2"></i> Profile </a>
                                </li>
                                <li>
                                    <a href="/settings" class="dropdown-item hover:bg-white/5"> <i data-lucide="lock" class="w-4 h-4 mr-2"></i> Reset Password </a>
                                </li>
                                <li>
                                    <hr class="dropdown-divider border-white/[0.08]">
                                </li>
                                <li>
                                    <a href="<?= $logout_link; ?>" class="dropdown-item hover:bg-white/5"> <i data-lucide="toggle-right" class="w-4 h-4 mr-2"></i> Logout</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <!-- END: Account Menu -->
                </div>
            </div>
            <!-- END: Top Bar -->