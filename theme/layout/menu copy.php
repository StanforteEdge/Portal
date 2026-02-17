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
                    <a href="<?php echo home_url('/home'); ?>" class="menu <?php if (is_page('home')) {
                                                                                echo 'menu--active';
                                                                            } ?> ">
                        <div class="menu__icon"> <i data-lucide="home"></i> </div>
                        <div class="menu__title"> Dashboard</div>
                    </a>
                </li>
                <li>
                    <a href="<?php echo home_url('/profile'); ?>" class="menu <?php if (is_page('profile') || is_page('profile/jd') || is_page('profile/personal-information') || is_page('profile/documents') || is_page('profile/skills')) {
                                                                                    echo 'menu--active';
                                                                                } ?>">
                        <div class="menu__icon"> <i data-lucide="user"></i> </div>
                        <div class="menu__title">Profile</div>
                    </a>
                </li>
                <li>
                    <a href="javascript:;" class="menu <?php if (is_page('requests') || is_page('requests/new') || is_page('requests/request') || is_page('requests/team') || is_page('requests/approval') || is_page('requests/requests')) {
                                                            echo 'menu--active';
                                                        } ?>">
                        <div class="menu__icon"> <i data-lucide="file-text"></i> </div>
                        <div class="menu__title">
                            Requests
                            <div class="menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('requests') || is_page('requests/new') || is_page('requests/request') || is_page('requests/team') || is_page('requests/approval') || is_page('requests/requests')) {
                                    echo 'menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/requests'); ?>" class=" <?php if (is_page('requests')) {
                                                                                        echo 'menu--active';
                                                                                    } ?> menu">
                                <div class="menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="menu__title"> All Requests</div>
                            </a>
                        </li>
                        <?php if (is_page('requests/request')) : ?>
                            <li>
                                <a href="<?php echo home_url('/requests/request/?id=' . $id); ?>" class="<?php if (is_page('requests/request')) {
                                                                                                                echo 'menu--active';
                                                                                                            } ?> menu">
                                    <div class="menu__icon"> <i data-lucide="edit"></i> </div>
                                    <div class="menu__title"> Request </div>
                                </a>
                            </li>
                        <?php endif; ?>
                        <li>
                            <a href="<?php echo home_url('/requests/new'); ?>" class="<?php if (is_page('requests/new')) {
                                                                                            echo 'menu--active';
                                                                                        } ?> menu">
                                <div class="menu__icon"> <i data-lucide="edit"></i> </div>
                                <div class="menu__title"> New </div>
                            </a>
                        </li>
                        <?php if ($staff->team_status === 2) : ?>
                            <li>
                                <a href="<?php echo home_url('/requests/team'); ?>" class="<?php if (is_page('requests/team')) {
                                                                                                echo 'menu--active';
                                                                                            } ?> menu">
                                    <div class="menu__icon"> <i data-lucide="edit"></i> </div>
                                    <div class="menu__title">Team Request </div>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="menu <?php if (is_page('staff-forms') || is_page('forms-exit-interview') || is_page('forms-incident-response') || is_page('forms-staff-appraisal')) {
                                                            echo 'menu--active';
                                                        } ?>">
                        <div class="menu__icon"> <i data-lucide="clipboard"></i> </div>
                        <div class="menu__title">
                            Forms
                            <div class="menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('staff-forms') || is_page('forms-exit-interview') || is_page('forms-incident-response') || is_page('forms-staff-appraisal')) {
                                    echo 'menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/staff-forms'); ?>" class="menu <?php if (is_page('staff-forms')) {
                                                                                                echo 'menu--active';
                                                                                            } ?>">
                                <div class="menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                <div class="menu__title"> All Forms </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/forms-exit-interview'); ?>" class="menu <?php if (is_page('forms-exit-interview')) {
                                                                                                        echo 'menu--active';
                                                                                                    } ?>">
                                <div class="menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="menu__title"> Exit Interview </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/forms-incident-response'); ?>" class="menu <?php if (is_page('forms-incident-response')) {
                                                                                                            echo 'menu--active';
                                                                                                        } ?>">
                                <div class="menu__icon"> <i data-lucide="alert-triangle"></i> </div>
                                <div class="menu__title"> Incident Response </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/forms-staff-appraisal'); ?>" class="menu <?php if (is_page('forms-staff-appraisal')) {
                                                                                                        echo 'menu--active';
                                                                                                    } ?>">
                                <div class="menu__icon"> <i data-lucide="user-check"></i> </div>
                                <div class="menu__title"> Staff Appraisal </div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="<?php echo home_url('/profile'); ?>" class=" <?php if (is_page('profile')) {
                                                                                echo 'menu--active';
                                                                            } ?> menu">
                        <div class="menu__icon"> <i data-lucide="user"></i> </div>
                        <div class="menu__title"> Profile</div>
                    </a>
                </li>
                <li>
                    <a href="<?php echo home_url('/settings'); ?>" class=" <?php if (is_page('settings')) {
                                                                                echo 'menu--active';
                                                                            } ?> menu">
                        <div class="menu__icon"> <i data-lucide="settings"></i> </div>
                        <div class="menu__title"> Settings</div>
                    </a>
                </li>

                <li>
                    <a href="<?php echo $logout_link; ?>" class="menu ">
                        <div class="menu__icon"> <i data-lucide="log-out"></i> </div>
                        <div class="menu__title"> Logout</div>
                    </a>
                </li>
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
                    <a href="<?php echo home_url('/home'); ?>" class=" <?php if (is_page('home')) {
                                                                            echo 'side-menu--active';
                                                                        } ?> side-menu">
                        <div class="side-menu__icon"> <i data-lucide="home"></i> </div>
                        <div class="side-menu__title"> Dashboard </div>
                    </a>
                </li>
                <li>
                    <a href="<?php echo home_url('/profile'); ?>" class="side-menu <?php if (is_page('profile') || is_page('profile/jd') || is_page('profile/bio') || is_page('profile/documents') || is_page('profile/skills')) {
                                                                                        echo 'side-menu--active';
                                                                                    } ?>">
                        <div class="side-menu__icon"> <i data-lucide="user"></i> </div>
                        <div class="side-menu__title">Profile</div>
                    </a>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php if (is_page('requests') || is_page('requests/new') || is_page('requests/request') || is_page('requests/team') || is_page('requests/team/request') || is_page('requests/approvals') || is_page('requests/approvals/request')) {
                                                                echo 'side-menu--active';
                                                            } ?>">
                        <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                        <div class="side-menu__title">
                            Requests
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('requests') || is_page('requests/new') || is_page('requests/request') || is_page('requests/team') || is_page('requests/team/request') || is_page('requests/approvals') || is_page('requests/approvals/request')) {
                                    echo 'side-menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/requests'); ?>" class=" <?php if (is_page('requests') || is_page('requests/request')) {
                                                                                        echo 'side-menu--active';
                                                                                    } ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title">My Requests</div>
                            </a>
                        </li>
                        <?php if ($staff->team_status == 2) : ?>
                            <li>
                                <a href="<?php echo home_url('/requests/team'); ?>" class=" <?php if (is_page('requests/team') || is_page('requests/team/request')) {
                                                                                                echo 'side-menu--active';
                                                                                            } ?> side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">Team Requests</div>
                                </a>
                            </li>
                        <?php endif; ?>
                        <?php if (in_array(('ed'), (array) $user->roles) || in_array(('coo'), (array) $user->roles)) : ?>
                            <li>
                                <a href="<?php echo home_url('/requests/approvals'); ?>" class=" <?php if (is_page('requests/approvals') || is_page('requests/approvals/request')) {
                                                                                                        echo 'side-menu--active';
                                                                                                    } ?> side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">Approvals</div>
                                </a>
                            </li>
                        <?php endif; ?>

                        <li>
                            <a href="<?php echo home_url('/requests/new'); ?>" class=" <?php if (is_page('requests/new')) {
                                                                                            echo 'side-menu--active';
                                                                                        } ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> New</div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php if (is_page('forms') || is_page('forms/exit-interview') || is_page('forms/incident-response') || is_page('forms/staff-appraisal')) {
                                                                echo 'side-menu--active';
                                                            } ?>">
                        <div class="side-menu__icon"> <i data-lucide="clipboard"></i> </div>
                        <div class="side-menu__title">
                            Forms
                            <div class="side-menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('forms') || is_page('forms/exit-interview') || is_page('forms/incident-response') || is_page('forms/staff-appraisal')) {
                                    echo 'side-menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/forms'); ?>" class="side-menu <?php if (is_page('forms')) {
                                                                                                echo 'side-menu--active';
                                                                                            } ?>">
                                <div class="side-menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                <div class="side-menu__title"> All Forms </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/forms/incident-response'); ?>" class="side-menu <?php if (is_page('forms/incident-response')) {
                                                                                                                echo 'side-menu--active';
                                                                                                            } ?>">
                                <div class="side-menu__icon"> <i data-lucide="alert-triangle"></i> </div>
                                <div class="side-menu__title"> Incident Response </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/forms/staff-appraisal'); ?>" class="side-menu <?php if (is_page('forms/staff-appraisal')) {
                                                                                                                echo 'side-menu--active';
                                                                                                            } ?>">
                                <div class="side-menu__icon"> <i data-lucide="user-check"></i> </div>
                                <div class="side-menu__title"> Staff Appraisal </div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php if (is_page('documents') || is_page('documents/policy') || is_page('documents/strategic') || is_page('documents/board')) {
                                                                echo 'side-menu--active';
                                                            } ?>">
                        <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                        <div class="side-menu__title">
                            Documents
                            <div class="side-menu__sub-icon"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('documents') || is_page('documents/policy') || is_page('documents/strategic') || is_page('documents/board')) {
                                    echo 'side-menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/documents'); ?>" class="side-menu <?php if (is_page('documents')) {
                                                                                                    echo 'side-menu--active';
                                                                                                } ?>">
                                <div class="side-menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                <div class="side-menu__title"> All Documents </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/documents/policy'); ?>" class="side-menu <?php if (is_page('documents/policy')) {
                                                                                                        echo 'side-menu--active';
                                                                                                    } ?>">
                                <div class="side-menu__icon"> <i data-lucide="book"></i> </div>
                                <div class="side-menu__title"> Policy Documents </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/documents/strategic'); ?>" class="side-menu <?php if (is_page('documents/strategic')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?>">
                                <div class="side-menu__icon"> <i data-lucide="target"></i> </div>
                                <div class="side-menu__title"> Strategic Documents </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/documents/board'); ?>" class="side-menu <?php if (is_page('documents/board')) {
                                                                                                        echo 'side-menu--active';
                                                                                                    } ?>">
                                <div class="side-menu__icon"> <i data-lucide="clipboard"></i> </div>
                                <div class="side-menu__title"> Board Reports </div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php echo in_array($b_link, ['/attendance', '/attendance/history', '/attendance/overview', '/attendance/stats']) ? 'side-menu--active' : ''; ?>">
                        <div class="side-menu__icon"> <i data-lucide="clock"></i> </div>
                        <div class="side-menu__title">
                            Time Management
                            <div class="side-menu__sub-icon <?php echo in_array($b_link, ['/attendance', '/attendance/history', '/attendance/overview', '/attendance/stats']) ? 'transform rotate-180' : ''; ?>"> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php echo in_array($b_link, ['/attendance', '/attendance/history', '/attendance/overview', '/attendance/stats']) ? 'side-menu__sub-open' : ''; ?>">
                        <li>
                            <a href="/attendance" class="side-menu <?php echo $b_link == '/attendance' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="user-check"></i> </div>
                                <div class="side-menu__title"> Check In/Out </div>
                            </a>
                        </li>
                        <li>
                            <a href="/attendance/history" class="side-menu <?php echo $b_link == '/attendance/history' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="history"></i> </div>
                                <div class="side-menu__title"> My History </div>
                            </a>
                        </li>

                        <li>
                            <a href="/attendance/overview" class="side-menu <?php echo $b_link == '/attendance/overview' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                <div class="side-menu__title"> Staff Overview </div>
                            </a>
                        </li>
                        <li>
                            <a href="/attendance/stats" class="side-menu <?php echo $b_link == '/attendance/stats' ? 'side-menu--active' : ''; ?>">
                                <div class="side-menu__icon"> <i data-lucide="bar-chart-2"></i> </div>
                                <div class="side-menu__title"> Statistics </div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php if (is_page('leave') || is_page('leave/apply') || is_page('leave/history') || is_page('leave/approve') || is_page('leave/overview')) {
                                                                echo 'side-menu--active';
                                                            } ?>">
                        <div class="side-menu__icon"> <i data-lucide="calendar"></i> </div>
                        <div class="side-menu__title">
                            Leave Management
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('leave') || is_page('leave/apply') || is_page('leave/history') || is_page('leave/approve') || is_page('leave/overview')) {
                                    echo 'side-menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/leave'); ?>" class="side-menu <?php if (is_page('leave')) {
                                                                                                echo 'side-menu--active';
                                                                                            } ?>">
                                <div class="side-menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                <div class="side-menu__title"> Dashboard </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/leave/apply'); ?>" class="side-menu <?php if (is_page('leave/apply')) {
                                                                                                    echo 'side-menu--active';
                                                                                                } ?>">
                                <div class="side-menu__icon"> <i data-lucide="plus-circle"></i> </div>
                                <div class="side-menu__title"> Apply for Leave </div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/leave/history'); ?>" class="side-menu <?php if (is_page('leave/history')) {
                                                                                                        echo 'side-menu--active';
                                                                                                    } ?>">
                                <div class="side-menu__icon"> <i data-lucide="clock"></i> </div>
                                <div class="side-menu__title"> Leave History </div>
                            </a>
                        </li>
                        <?php if (current_user_can('hr') || current_user_can('team_lead') || current_user_can('administrator')) : ?>
                            <li>
                                <a href="<?php echo home_url('/leave/approve'); ?>" class="side-menu <?php if (is_page('leave/approve')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?>">
                                    <div class="side-menu__icon"> <i data-lucide="check-square"></i> </div>
                                    <div class="side-menu__title"> Approve Leave </div>
                                </a>
                            </li>
                        <?php endif; ?>
                        <?php if (current_user_can('hr') || current_user_can('ceo') || current_user_can('coo') || current_user_can('administrator')) : ?>
                            <li>
                                <a href="<?php echo home_url('/leave/overview'); ?>" class="side-menu <?php if (is_page('leave/overview')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?>">
                                    <div class="side-menu__icon"> <i data-lucide="pie-chart"></i> </div>
                                    <div class="side-menu__title"> Leave Overview </div>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php if (is_page('projects') || is_page('projects/overview') || is_page('projects/create') || is_page('projects/edit') || is_page('projects/view') || is_page('projects/reports')) {
                                                                echo 'side-menu--active';
                                                            } ?>">
                        <div class="side-menu__icon"> <i data-lucide="briefcase"></i> </div>
                        <div class="side-menu__title">
                            Projects
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('projects') || is_page('projects/overview') || is_page('projects/create') || is_page('projects/edit') || is_page('projects/view') || is_page('projects/reports')) {
                                    echo 'side-menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/projects'); ?>" class="side-menu <?php if (is_page('projects')) {
                                                                                                    echo 'side-menu--active';
                                                                                                } ?>">
                                <div class="side-menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                <div class="side-menu__title"> Overview </div>
                            </a>
                        </li>
                        <?php if (in_array('team_lead', (array) $user->roles) || in_array('hr', (array) $user->roles) || in_array('ceo', (array) $user->roles) || in_array('coo', (array) $user->roles)) : ?>
                        <li>
                            <a href="<?php echo home_url('/projects/create'); ?>" class="side-menu <?php if (is_page('projects/create')) {
                                                                                                    echo 'side-menu--active';
                                                                                                } ?>">
                                <div class="side-menu__icon"> <i data-lucide="plus-square"></i> </div>
                                <div class="side-menu__title"> Create Project </div>
                            </a>
                        </li>
                        <?php endif; ?>
                        <?php if (in_array('team_lead', (array) $user->roles) || in_array('hr', (array) $user->roles) || in_array('ceo', (array) $user->roles) || in_array('coo', (array) $user->roles)) : ?>
                        <li>
                            <a href="<?php echo home_url('/projects/reports'); ?>" class="side-menu <?php if (is_page('projects/reports')) {
                                                                                                    echo 'side-menu--active';
                                                                                                } ?>">
                                <div class="side-menu__icon"> <i data-lucide="bar-chart-2"></i> </div>
                                <div class="side-menu__title"> Reports </div>
                            </a>
                        </li>
                        <?php endif; ?>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php if (is_page('tasks') || is_page('tasks/my-tasks') || is_page('tasks/create') || is_page('tasks/edit') || is_page('tasks/board')) {
                                                                echo 'side-menu--active';
                                                            } ?>">
                        <div class="side-menu__icon"> <i data-lucide="check-square"></i> </div>
                        <div class="side-menu__title">
                            Tasks
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('tasks') || is_page('tasks/my-tasks') || is_page('tasks/create') || is_page('tasks/edit') || is_page('tasks/board')) {
                                    echo 'side-menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/tasks/my-tasks'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="list"></i> </div>
                                <div class="side-menu__title"> My Tasks </div>
                            </a>
                        </li>
                        <?php if (in_array('team_lead', (array) $user->roles) || in_array('project_owner', (array) $user->roles)) : ?>
                            <li>
                                <a href="<?php echo home_url('/tasks/create'); ?>" class="side-menu">
                                    <div class="side-menu__icon"> <i data-lucide="plus"></i> </div>
                                    <div class="side-menu__title"> Create Task </div>
                                </a>
                            </li>
                        <?php endif; ?>
                        <li>
                            <a href="<?php echo home_url('/tasks/board'); ?>" class="side-menu">
                                <div class="side-menu__icon"> <i data-lucide="layout-grid"></i> </div>
                                <div class="side-menu__title"> Task Board </div>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:;" class="side-menu <?php if (is_page('team') || is_page('team/projects') || is_page('team/request')  || is_page('team/tasks')) {
                                                                echo 'side-menu--active';
                                                            } ?>">
                        <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                        <div class="side-menu__title">
                            Team
                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                        </div>
                    </a>
                    <ul class="<?php if (is_page('team') || is_page('team/projects') || is_page('team/request')  || is_page('team/tasks')) {
                                    echo 'side-menu__sub-open';
                                } ?>">
                        <li>
                            <a href="<?php echo home_url('/team'); ?>" class=" <?php if (is_page('team')) {
                                                                                    echo 'side-menu--active';
                                                                                } ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                <div class="side-menu__title"> Team</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/team/tasks'); ?>" class=" <?php if (is_page('team/tasks')) {
                                                                                            echo 'side-menu--active';
                                                                                        } ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Tasks</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/team/projects'); ?>" class=" <?php if (is_page('team/projects')) {
                                                                                            echo 'side-menu--active';
                                                                                        } ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Projects</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/team/requests'); ?>" class=" <?php if (is_page('team/requests')) {
                                                                                            echo 'side-menu--active';
                                                                                        } ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Requests</div>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo home_url('/team/reports'); ?>" class=" <?php if (is_page('team/reports')) {
                                                                                            echo 'side-menu--active';
                                                                                        } ?> side-menu">
                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                <div class="side-menu__title"> Reports</div>
                            </a>
                        </li>
                    </ul>
                </li>
                <div class="side-nav__devider my-6"></div>

                <?php if (in_array('accountant', (array) $user->roles)) : ?>
                    <li>
                        <a href="javascript:;" class="side-menu <?php if (is_page('accounts/requests') || is_page('accounts/requests/requests') || is_page('accounts/requests/request')) {
                                                                    echo 'side-menu--active';
                                                                } ?>">
                            <div class="side-menu__icon"> <i data-lucide="book"></i> </div>
                            <div class="side-menu__title">
                                Accounts
                                <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?php if (is_page('accounts/requests') || is_page('accounts/requests/request') || is_page('accounts/requests/requests')) {
                                        echo 'side-menu__sub-open';
                                    } ?>">
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
                                <a href="javascript:;" class="side-menu <?php if (is_page('accounts/requests') || is_page('accounts/requests/request') ||  is_page('accounts/requests/requests')) {
                                                                            echo 'side-menu--active';
                                                                        } ?>">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">
                                        Budgets
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="javascript:;" class="side-menu <?php if (is_page('accounts/requests') || is_page('accounts/requests/request') ||  is_page('accounts/requests/requests')) {
                                                                            echo 'side-menu--active';
                                                                        } ?>">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">
                                        Vendors
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </li>
                <?php endif; ?>


                <?php if (in_array('admin', (array) $user->roles) || in_array('finance', (array) $user->roles) || in_array('crm', (array) $user->roles) || in_array('ceo', (array) $user->roles) || in_array('coo', (array) $user->roles)) : ?>
                    <li>
                        <a href="javascript:;" class=" <?php if (is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams')) {
                                                            echo 'side-menu--active';
                                                        } ?> side-menu">
                            <div class="side-menu__icon"> <i data-lucide="home"></i> </div>
                            <div class="side-menu__title">
                                Admin
                                <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                            </div>
                        </a>
                        <ul class="<?php if (is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams') || is_page('admin/projects') ||   is_page('admin/projects/project') ||   is_page('admin/projects/new')) {
                                        echo 'side-menu__sub-open';
                                    } ?>">
                            <li>
                                <a href="javascript:;" class="side-menu <?php if (is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams')) {
                                                                            echo 'side-menu--active';
                                                                        } ?>">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">
                                        Staff
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                                <ul class="<?php if (is_page('admin/staff') || is_page('admin/staff/all') ||  is_page('admin/staff/view') ||  is_page('admin/staff/types') ||  is_page('admin/staff/roles') ||  is_page('admin/staff/teams')) {
                                                echo 'side-menu__sub-open';
                                            } ?>">
                                    <li>
                                        <a href="<?php echo home_url('/admin/staff/all'); ?>" class=" <?php if (is_page('admin/staff/all')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">All Staff</div>
                                        </a>
                                    </li>
                                    <?php if (is_page('admin/staff/view')) : ?>
                                        <li>
                                            <a href="<?php echo home_url('/admin/staff/view/?id=' . $id); ?>" class=" <?php if (is_page('admin/staff/view')) {
                                                                                                                                echo 'side-menu--active';
                                                                                                                            } ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title"> View Staff</div>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                    <li>
                                        <a href="<?php echo home_url('/admin/staff/types'); ?>" class=" <?php if (is_page('admin/staff/types')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Types</div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="<?php echo home_url('/admin/staff/teams'); ?>" class=" <?php if (is_page('admin/staff/teams')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Teams</div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="<?php echo home_url('/admin/staff/roles'); ?>" class=" <?php if (is_page('admin/staff/roles')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Roles</div>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <a href="javascript:;" class="side-menu <?php if (is_page('admin/projects') ||   is_page('admin/projects/project') ||   is_page('admin/projects/new')) {
                                                                            echo 'side-menu--active';
                                                                        } ?>">
                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                    <div class="side-menu__title">
                                        Projects
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                                <ul class="<?php if (is_page('admin/projects') ||   is_page('admin/projects/project') ||   is_page('admin/projects/new')) {
                                                echo 'side-menu__sub-open';
                                            } ?>">
                                    <li>
                                        <a href="<?php echo home_url('/admin/projects'); ?>" class=" <?php if (is_page('admin/projects')) {
                                                                                                            echo 'side-menu--active';
                                                                                                        } ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">Projects</div>
                                        </a>
                                    </li>
                                    <?php if (is_page('admin/projects/project')) : ?>
                                        <li>
                                            <a href="<?php echo home_url('/admin/projects/project/?id=' . $id); ?>" class=" <?php if (is_page('admin/projects/project')) {
                                                                                                                                echo 'side-menu--active';
                                                                                                                            } ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title"> Project</div>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                    <li>
                                        <a href="<?php echo home_url('/admin/projects/new'); ?>" class=" <?php if (is_page('admin/projects/new')) {
                                                                                                                echo 'side-menu--active';
                                                                                                            } ?> side-menu">
                                            <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                            <div class="side-menu__title">New</div>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <?php if (in_array(('ed'), (array) $user->roles) || in_array(('coo'), (array) $user->roles)) : ?>
                                <li>
                                    <a href="javascript:;" class="side-menu <?php if (is_page('admin/requests') || is_page('admin/requests/request') ||  is_page('admin/requests/requests')) {
                                                                                echo 'side-menu--active';
                                                                            } ?>">
                                        <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                        <div class="side-menu__title">
                                            Requests
                                            <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                        </div>
                                    </a>
                                    <ul class="<?php if (is_page('admin/requests')  || is_page('admin/requests/request') || is_page('admin/requests/requests')) {
                                                    echo 'side-menu__sub-open';
                                                } ?>">
                                        <li>
                                            <a href="<?php echo home_url('/admin/requests'); ?>" class=" <?php if (is_page('admin/requests')) {
                                                                                                                echo 'side-menu--active';
                                                                                                            } ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title"> Overview</div>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="<?php echo home_url('/admin/requests/requests'); ?>" class=" <?php if (is_page('admin/requests/requests')) {
                                                                                                                        echo 'side-menu--active';
                                                                                                                    } ?> side-menu">
                                                <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                <div class="side-menu__title">Requests</div>
                                            </a>
                                        </li>
                                        <?php if (is_page('admin/requests/request')) : ?>
                                            <li>
                                                <a href="<?php echo home_url('/admin/requests/request/?id=' . $id); ?>" class=" <?php if (is_page('admin/requests/request')) {
                                                                                                                                    echo 'side-menu--active';
                                                                                                                                } ?> side-menu">
                                                    <div class="side-menu__icon"> <i data-lucide="file-text"></i> </div>
                                                    <div class="side-menu__title"> Request</div>
                                                </a>
                                            </li>
                                        <?php endif; ?>
                                    </ul>
                                </li>
                            <?php endif; ?>
                            <li>
                                <a href="javascript:;" class="side-menu <?php if (is_page('donors') || is_page('donors') || is_page('donors/add') || is_page('donors/edit') || is_page('donors/communications')) {
                                                                            echo 'side-menu--active';
                                                                        } ?>">
                                    <div class="side-menu__icon"> <i data-lucide="users"></i> </div>
                                    <div class="side-menu__title">
                                        Donors
                                        <div class="side-menu__sub-icon "> <i data-lucide="chevron-down"></i> </div>
                                    </div>
                                </a>
                                <ul class="<?php if (is_page('donors') || is_page('donors') || is_page('donors/add') || is_page('donors/edit') || is_page('donors/communications')) {
                                                echo 'side-menu__sub-open';
                                            } ?>">
                                    <li>
                                        <a href="<?php echo home_url('/donors'); ?>" class="side-menu <?php if (is_page('donors')) { echo 'side-menu--active'; } ?>">
                                            <div class="side-menu__icon"> <i data-lucide="layout-dashboard"></i> </div>
                                            <div class="side-menu__title"> Overview </div>
                                        </a>
                                    </li>
                                    <?php if (in_array('hr', (array) $user->roles) || in_array('crm', (array) $user->roles)) : ?>
                                        <li>
                                            <a href="<?php echo home_url('/donors/add'); ?>" class="side-menu <?php if (is_page('donors/add')) { echo 'side-menu--active'; } ?>">
                                                <div class="side-menu__icon"> <i data-lucide="user-plus"></i> </div>
                                                <div class="side-menu__title"> Add Donor </div>
                                            </a>
                                        </li>
                                    <?php endif; ?>
                                    <?php if (isset($_GET['id']) && (is_page('donors/edit') || is_page('donors/communications'))) : ?>
                                        <li>
                                            <a href="<?php echo home_url('/donors/edit?id=' . $_GET['id']); ?>" class="side-menu <?php if (is_page('donors/edit')) { echo 'side-menu--active'; } ?>">
                                                <div class="side-menu__icon"> <i data-lucide="edit"></i> </div>
                                                <div class="side-menu__title"> Edit Donor </div>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="<?php echo home_url('/donors/communications?id=' . $_GET['id']); ?>" class="side-menu <?php if (is_page('donors/communications')) { echo 'side-menu--active'; } ?>">
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
                        <li class="breadcrumb-item"><a href="<?php echo $b_link; ?>"><?php echo $b_title; ?></a></li>
                        <li class="breadcrumb-item active" aria-current="page"><?php echo $p_title; ?></li>
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
                                    <div class="font-medium"><?php echo $staff->first_name . ' ' . $staff->last_name; ?></div>
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
                                    <a href="<?php echo $logout_link; ?>" class="dropdown-item hover:bg-white/5"> <i data-lucide="toggle-right" class="w-4 h-4 mr-2"></i> Logout</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <!-- END: Account Menu -->
                </div>
            </div>
            <!-- END: Top Bar -->