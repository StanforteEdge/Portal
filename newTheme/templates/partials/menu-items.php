<?php

/**
 * Menu Items Template Part
 * 
 * @param array $args {
 *     Optional. Array of arguments.
 *     @type string $menu_type Either 'mobile' or 'side'. Default 'side'.
 * }
 */

$menu_type = isset($args['menu_type']) ? $args['menu_type'] : 'side';
$current_user = wp_get_current_user();

// Configuration: Permission-Based Menus
$role_menus = [

    'home' => [
        'capability' => '', // All logged-in users
        'title' => 'Home',
        'icon' => 'home',
        'active_key' => ['dashboard', 'attendance', 'leave', 'finance-requests', 'forms', 'forms-submissions'],
        'items' => [
            [
                'url' => home_url('/leave'),
                'icon' => 'calendar',
                'title' => 'Leave',
                'active_key' => 'leave',
                'capability' => ''
            ],
            [
                'url' => 'javascript:;',
                'icon' => 'dollar-sign',
                'title' => 'Finance Requests',
                'active_key' => ['finance-requests', 'finance-new-request'],
                'capability' => '',
                'submenu' => [
                    [
                        'url' => home_url('/finance/requests'),
                        'icon' => 'list',
                        'title' => 'My Requests',
                        'active_key' => 'finance-requests',
                        'capability' => ''
                    ],
                    [
                        'url' => home_url('/finance/new'),
                        'icon' => 'plus-circle',
                        'title' => 'New Request',
                        'active_key' => 'finance-new-request',
                        'capability' => ''
                    ],
                ],
            ],
            [
                'url' => home_url('/dashboard'),
                'icon' => 'home',
                'title' => 'Dashboard',
                'active_key' => 'dashboard',
                'capability' => ''
            ],
            [
                'url' => home_url('/attendance'),
                'icon' => 'clock',
                'title' => 'Attendance',
                'active_key' => 'attendance',
                'capability' => ''
            ],
            [
                'url' => 'javascript:;',
                'title' => 'Forms',
                'icon' => 'file-text',
                'active_key' => ['forms', 'forms-submissions'],
                'capability' => '',
                'submenu' => [
                    [
                        'url' => home_url('/forms'),
                        'icon' => 'file-plus',
                        'title' => 'Available Forms',
                        'active_key' => 'forms',
                        'capability' => ''
                    ],
                    [
                        'url' => home_url('/forms/submissions'),
                        'icon' => 'list',
                        'title' => 'My Submissions',
                        'active_key' => 'forms-submissions',
                        'capability' => ''
                    ]
                ]
            ]
        ]
    ],
    'finance' => [
        'capability' => 'finance.view', // Check if user can access finance module
        'title' => 'Finance',
        'icon' => 'dollar-sign',
        'active_key' => ['finance', 'finance-approvals', 'finance-all-requests', 'finance-vouchers', 'finance-retirements', 'finance-reports'],
        'items' => [
            [
                'url' => home_url('/finance'),
                'icon' => 'pie-chart',
                'title' => 'Overview',
                'active_key' => 'finance',
                'capability' => 'finance.view'
            ],
            [
                'url' => 'javascript:;',
                'icon' => 'file-text',
                'title' => 'Requests Management',
                'active_key' => ['finance-approvals', 'finance-all-requests', 'finance-vouchers', 'finance-retirements'],
                'capability' => 'finance.view',
                'submenu' => [
                    [
                        'url' => home_url('/finance/requests/approvals'),
                        'icon' => 'check-square',
                        'title' => 'Pending Approvals',
                        'active_key' => 'finance-approvals',
                        'capability' => 'requests.approve'
                    ],
                    [
                        'url' => home_url('/finance/requests'),
                        'icon' => 'list',
                        'title' => 'All Requests',
                        'active_key' => 'finance-all-requests',
                        'capability' => 'finance.view'
                    ],
                    [
                        'url' => home_url('/finance/requests/pv'),
                        'icon' => 'receipt',
                        'title' => 'Vouchers',
                        'active_key' => 'finance-vouchers',
                        'capability' => 'finance.vouchers'
                    ],
                    [
                        'url' => home_url('/finance/requests/retirement'),
                        'icon' => 'archive',
                        'title' => 'Retirements',
                        'active_key' => 'finance-retirements',
                        'capability' => 'finance.view'
                    ]
                ]
            ],
            [
                'url' => home_url('/finance/reports'),
                'icon' => 'file-text',
                'title' => 'Reports',
                'active_key' => 'finance-reports',
                'capability' => 'finance.manage' // More restrictive
            ],
            [
                'url' => 'javascript:;',
                'icon' => 'settings',
                'title' => 'Settings',
                'active_key' => ['finance-settings', 'finance-settings-requests', 'finance-settings-workflows', 'finance-settings-categories', 'finance-settings-payment-methods', 'finance-settings-compliance', 'finance-settings-integrations'],
                'capability' => 'finance.manage_group',
                'submenu' => [
                    [
                        'url' => home_url('/finance/settings'),
                        'icon' => 'layout-dashboard',
                        'title' => 'Dashboard',
                        'active_key' => 'finance-settings',
                        'capability' => 'finance.manage_group'
                    ],
                    [
                        'url' => home_url('/finance/settings/request-types'),
                        'icon' => 'file-text',
                        'title' => 'Request Types',
                        'active_key' => 'finance-settings-requests',
                        'capability' => 'finance.manage_group'
                    ],
                    [
                        'url' => home_url('/finance/settings/workflows'),
                        'icon' => 'git-branch',
                        'title' => 'Workflows',
                        'active_key' => 'finance-settings-workflows',
                        'capability' => 'finance.manage_group'
                    ],
                    [
                        'url' => home_url('/finance/settings/categories'),
                        'icon' => 'folder-tree',
                        'title' => 'Categories',
                        'active_key' => 'finance-settings-categories',
                        'capability' => 'finance.manage_group'
                    ],
                    [
                        'url' => home_url('/finance/settings/payment-methods'),
                        'icon' => 'credit-card',
                        'title' => 'Payment Methods',
                        'active_key' => 'finance-settings-payment-methods',
                        'capability' => 'finance.manage_group'
                    ],
                    [
                        'url' => home_url('/finance/settings/compliance'),
                        'icon' => 'shield-check',
                        'title' => 'Compliance',
                        'active_key' => 'finance-settings-compliance',
                        'capability' => 'finance.manage_group'
                    ],
                    [
                        'url' => home_url('/finance/settings/integrations'),
                        'icon' => 'plug',
                        'title' => 'Integrations',
                        'active_key' => 'finance-settings-integrations',
                        'capability' => 'finance.manage_group'
                    ]
                ]
            ],

        ]
    ],
    'admin' => [
        'capability' => 'manage_options', // Standard WP Admin capability
        'title' => 'Admin',
        'icon' => 'shield',
        'active_key' => ['admin', 'admin-users', 'admin-roles', 'admin-notifications', 'admin-settings', 'admin-forms', 'admin-taxonomies', 'admin-organizations', 'admin-groups'],
        'items' => [
            [
                'url' => home_url('/admin'),
                'icon' => 'pie-chart',
                'title' => 'Overview',
                'active_key' => 'admin',
                'capability' => 'manage_options'
            ],
            [
                'url' => 'javascript:;',
                'icon' => 'file-text',
                'title' => 'Forms',
                'active_key' => ['admin-forms', 'admin-forms-submissions', 'admin-forms-builder'],
                'capability' => 'admin.manage_forms',
                'submenu' => [
                    [
                        'url' => home_url('/admin/forms'),
                        'icon' => 'list',
                        'title' => 'Forms List',
                        'active_key' => 'admin-forms',
                        'capability' => 'admin.manage_forms'
                    ],
                    [
                        'url' => home_url('/admin/forms/submissions'),
                        'icon' => 'file-text',
                        'title' => 'Submissions',
                        'active_key' => 'admin-forms-submissions',
                        'capability' => 'admin.manage_forms'
                    ],
                    [
                        'url' => home_url('/admin/forms/builder'),
                        'icon' => 'plus-square',
                        'title' => 'Create New',
                        'active_key' => 'admin-forms-builder',
                        'capability' => 'admin.manage_forms'
                    ]
                ]
            ],

            [
                'url' => 'javascript:;',
                'icon' => 'users',
                'title' => 'User Management',
                'active_key' => ['admin-users', 'admin-roles'],
                'capability' => 'users.view',
                'submenu' => [
                    [
                        'url' => home_url('/admin/users'),
                        'icon' => 'user',
                        'title' => 'Users',
                        'active_key' => 'admin-users',
                        'capability' => 'users.manage'
                    ],
                    [
                        'url' => home_url('/admin/roles'),
                        'icon' => 'shield',
                        'title' => 'Roles & Permissions',
                        'active_key' => 'admin-roles',
                        'capability' => 'roles.manage'
                    ],
                ],
            ],

            [
                'url' => 'javascript:;',
                'icon' => 'settings',
                'title' => 'Setup & Settings',
                'active_key' => ['admin-settings', 'admin-notifications', 'admin-taxonomies', 'admin-organizations', 'admin-groups'],
                'capability' => 'manage_options',
                'submenu' => [
                    [
                        'url' => home_url('/admin/organizations'),
                        'icon' => 'building',
                        'title' => 'Organizations',
                        'active_key' => 'admin-organizations',
                        'capability' => 'settings.manage'
                    ],
                    [
                        'url' => home_url('/admin/groups'),
                        'icon' => 'users',
                        'title' => 'Groups & Teams',
                        'active_key' => 'admin-groups',
                        'capability' => 'settings.manage'
                    ],
                    [
                        'url' => home_url('/admin/taxonomies'),
                        'icon' => 'list',
                        'title' => 'Taxonomies',
                        'active_key' => 'admin-taxonomies',
                        'capability' => 'taxonomies.manage'
                    ],
                    [
                        'url' => home_url('/admin/notifications'),
                        'icon' => 'bell',
                        'title' => 'Notifications',
                        'active_key' => 'admin-notifications',
                        'capability' => 'settings.manage'
                    ],
                    [
                        'url' => home_url('/admin/settings'),
                        'icon' => 'sliders',
                        'title' => 'Global Settings',
                        'active_key' => 'admin-settings',
                        'capability' => 'settings.manage'
                    ],
                ]
            ]
        ]
    ],
    'hr' => [
        'capability' => 'hr.view',
        'title' => 'HR',
        'icon' => 'users',
        'active_key' => ['hr-employees', 'hr-employees-add', 'hr-employees-edit', 'hr-employees-view'],
        'items' => [
            [
                'url' => home_url('/hr/employees'),
                'icon' => 'users',
                'title' => 'Employees',
                'active_key' => 'hr-employees',
                'capability' => 'hr.employees.view'
            ],
            [
                'url' => home_url('/hr/employees/add'),
                'icon' => 'user-plus',
                'title' => 'Add Employee',
                'active_key' => 'hr-employees-add',
                'capability' => 'hr.employees.create'
            ]
        ]
    ]
];

// Determine Active Menu Groups
$menu_items = [];
$first_group = true;
$active_groups_count = 0;

// First pass to count active groups (for UI decisions if needed)
foreach ($role_menus as $key => $config) {
    if (current_user_can($config['capability'])) {
        $active_groups_count++;
    }
}

foreach ($role_menus as $key => $config) {
    // Check main group capability
    if (!current_user_can($config['capability'])) {
        continue;
    }

    if (!$first_group) {
        $menu_items[] = ['type' => 'divider'];
    }

    if ($active_groups_count > 1) {
        $menu_items[] = ['type' => 'header', 'title' => $config['title']];
    }

    // Filter sub-items based on their individual capabilities
    $filtered_items = [];
    foreach ($config['items'] as $item) {
        // If item has a specific capability requirement, check it
        if (isset($item['capability']) && !current_user_can($item['capability'])) {
            continue;
        }

        // Handle Submenus
        if (isset($item['submenu'])) {
            $filtered_submenu = [];
            foreach ($item['submenu'] as $subitem) {
                if (isset($subitem['capability']) && !current_user_can($subitem['capability'])) {
                    continue;
                }
                $filtered_submenu[] = $subitem;
            }

            // Only add parent item if it has visible children
            if (!empty($filtered_submenu)) {
                $item['submenu'] = $filtered_submenu;
                $filtered_items[] = $item;
            }
        } else {
            $filtered_items[] = $item;
        }
    }

    $menu_items = array_merge($menu_items, $filtered_items);
    $first_group = false;
}

// 2. Append Common Items at the bottom
$menu_items[] = ['type' => 'divider'];
$menu_items[] = [
    'url' => 'javascript:;',
    'icon' => 'user',
    'title' => 'Profile',
    'active_key' => ['profile', 'settings'],
    'submenu' => [
        [
            'url' => home_url('/profile'),
            'icon' => 'user',
            'title' => 'Profile',
            'active_key' => 'profile'
        ],
        [
            'url' => home_url('/settings'),
            'icon' => 'settings',
            'title' => 'Settings',
            'active_key' => 'settings'
        ]
    ]
];

// Render Menu Function
if (!function_exists('render_menu_items_recursive')) {
    function render_menu_items_recursive($items, $menu_type, $ul_class = '')
    {
        global $GLOBALS;
        $prefix = ($menu_type == 'mobile') ? 'menu' : 'side-menu';
?>
        <ul class="<?= $ul_class; ?>">
            <?php foreach ($items as $item):
                if (isset($item['type']) && $item['type'] === 'divider'):
                    $divider_class = ($menu_type == 'mobile') ? 'menu__devider' : 'side-nav__devider';
            ?>
                    <li class="<?= $divider_class ?> my-6"></li>
                <?php continue;
                endif;

                if (isset($item['type']) && $item['type'] === 'header'):
                    $header_class = ($menu_type == 'mobile') ? 'menu__header' : 'side-nav__header';
                ?>
                    <li class="<?= $header_class ?> mt-3 px-5 text-white/70 uppercase text-xs font-medium">
                        <?= esc_html($item['title']); ?>
                    </li>
                <?php continue;
                endif;

                global $activeMenu;
                $current_active = $activeMenu ?? $GLOBALS['activeMenu'] ?? '';

                $is_active = is_array($item['active_key'])
                    ? in_array($current_active, $item['active_key'])
                    : ($item['active_key'] === $current_active);
                $has_submenu = isset($item['submenu']) && !empty($item['submenu']);
                ?>
                <li>
                    <a href="<?= $item['url']; ?>" class="<?= $prefix; ?><?= $is_active ? ' ' . $prefix . '--active' : ''; ?>">
                        <div class="<?= $prefix; ?>__icon">
                            <i data-lucide="<?= esc_attr($item['icon']); ?>"></i>
                        </div>
                        <div class="<?= $prefix; ?>__title">
                            <?= esc_html($item['title']); ?>
                            <?php if ($has_submenu): ?>
                                <?php if ($menu_type === 'mobile'): ?>
                                    <i data-lucide="chevron-down"
                                        class="<?= $prefix; ?>__sub-icon <?= $is_active ? 'transform rotate-180' : ''; ?>"></i>
                                <?php else: ?>
                                    <div class="<?= $prefix; ?>__sub-icon <?= $is_active ? 'transform rotate-180' : ''; ?>">
                                        <i data-lucide="chevron-down"></i>
                                    </div>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </a>
                    <?php if ($has_submenu): ?>
                        <?php
                        $sub_ul_class = $is_active ? $prefix . '__sub-open' : '';
                        render_menu_items_recursive($item['submenu'], $menu_type, $sub_ul_class);
                        ?>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
<?php
    }
}

// Initial Call
$initial_ul_class = ($menu_type == 'mobile') ? 'scrollable__content py-2' : '';
render_menu_items_recursive($menu_items, $menu_type, $initial_ul_class);
?>