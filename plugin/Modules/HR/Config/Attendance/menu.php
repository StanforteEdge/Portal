<?php
/**
 * Attendance Module Menu Configuration
 */

return [
    'employee' => [
        [
            'title' => 'Attendance',
            'icon'  => 'clock',
            'items' => [
                [
                    'title' => 'Dashboard',
                    'url'   => '/attendance/dashboard',
                    'template' => 'attendance/attendance-dashboard.php'
                ],
                [
                    'title' => 'History',
                    'url'   => '/attendance/history',
                    'template' => 'attendance/attendance-history.php'
                ],
                [
                    'title' => 'Statistics',
                    'url'   => '/attendance/stats',
                    'template' => 'attendance/attendance-stats.php'
                ],
                [
                    'title' => 'Request Time Off',
                    'url'   => '/attendance/request',
                    'template' => 'attendance/attendance-request.php'
                ]
            ]
        ]
    ],
    'admin' => [
        [
            'title' => 'Attendance Management',
            'icon'  => 'users-check',
            'items' => [
                [
                    'title' => 'Dashboard',
                    'url'   => '/attendance/admin',
                    'template' => 'attendance/attendance-admin.php'
                ],
                [
                    'title' => 'Time Off Requests',
                    'url'   => '/attendance/admin/requests',
                    'template' => 'attendance/attendance-admin-requests.php'
                ],
                [
                    'title' => 'Statistics',
                    'url'   => '/attendance/admin/stats',
                    'template' => 'attendance/attendance-admin-stats.php'
                ],
                [
                    'title' => 'Settings',
                    'url'   => '/attendance/admin/settings',
                    'template' => 'attendance/attendance-admin-settings.php'
                ]
            ]
        ]
    ]
];
