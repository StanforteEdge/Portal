<?php

return [
    'work_hours' => [
        'start_time' => [
            'type' => 'time',
            'default' => '09:00',
            'label' => 'Work Start Time',
            'description' => 'Default work start time'
        ],
        'end_time' => [
            'type' => 'time',
            'default' => '17:00',
            'label' => 'Work End Time',
            'description' => 'Default work end time'
        ],
        'grace_period' => [
            'type' => 'number',
            'default' => 15,
            'label' => 'Grace Period (minutes)',
            'description' => 'Minutes allowed after start time before marking as late'
        ],
        'minimum_hours' => [
            'type' => 'number',
            'default' => 8,
            'label' => 'Minimum Work Hours',
            'description' => 'Minimum required work hours per day'
        ]
    ],
    'time_off' => [
        'vacation_days' => [
            'type' => 'number',
            'default' => 20,
            'label' => 'Vacation Days per Year',
            'description' => 'Number of vacation days allowed per year'
        ],
        'sick_days' => [
            'type' => 'number',
            'default' => 10,
            'label' => 'Sick Days per Year',
            'description' => 'Number of sick days allowed per year'
        ],
        'personal_days' => [
            'type' => 'number',
            'default' => 5,
            'label' => 'Personal Days per Year',
            'description' => 'Number of personal days allowed per year'
        ],
        'advance_notice' => [
            'type' => 'number',
            'default' => 7,
            'label' => 'Advance Notice Days',
            'description' => 'Minimum days notice required for vacation requests'
        ]
    ],
    'notifications' => [
        'late_check_in' => [
            'type' => 'boolean',
            'default' => true,
            'label' => 'Late Check-in Notifications',
            'description' => 'Notify supervisor when employee checks in late'
        ],
        'missing_check_out' => [
            'type' => 'boolean',
            'default' => true,
            'label' => 'Missing Check-out Notifications',
            'description' => 'Notify employee when they forget to check out'
        ],
        'time_off_request' => [
            'type' => 'boolean',
            'default' => true,
            'label' => 'Time Off Request Notifications',
            'description' => 'Notify supervisor when time off is requested'
        ]
    ]
];
