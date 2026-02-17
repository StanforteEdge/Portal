<?php /* Template Name: Admin Attendance Settings */ ?>

<?php
get_header();
$b_link = '/attendance/admin/settings';
$b_title = 'Attendance Settings';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">
    <!-- BEGIN: Top Bar -->
    <div class="top-bar">
        <nav aria-label="breadcrumb" class="-intro-x mr-auto hidden sm:flex">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="#">Attendance</a></li>
                <li class="breadcrumb-item"><a href="attendance-admin.php">Admin</a></li>
                <li class="breadcrumb-item active" aria-current="page">Settings</li>
            </ol>
        </nav>
    </div>
    <!-- END: Top Bar -->

    <div class="grid grid-cols-12 gap-6">
        <!-- BEGIN: Settings Menu -->
        <div class="col-span-12 lg:col-span-3 2xl:col-span-2">
            <div class="intro-y box p-5">
                <nav class="side-nav">
                    <ul>
                        <li>
                            <a href="#work-hours" class="side-menu side-menu--active">
                                <div class="side-menu__icon"><i data-lucide="clock"></i></div>
                                <div class="side-menu__title">Work Hours</div>
                            </a>
                        </li>
                        <li>
                            <a href="#leave-types" class="side-menu">
                                <div class="side-menu__icon"><i data-lucide="calendar"></i></div>
                                <div class="side-menu__title">Leave Types</div>
                            </a>
                        </li>
                        <li>
                            <a href="#holidays" class="side-menu">
                                <div class="side-menu__icon"><i data-lucide="calendar"></i></div>
                                <div class="side-menu__title">Holidays</div>
                            </a>
                        </li>
                        <li>
                            <a href="#work-modes" class="side-menu">
                                <div class="side-menu__icon"><i data-lucide="monitor"></i></div>
                                <div class="side-menu__title">Work Modes</div>
                            </a>
                        </li>
                        <li>
                            <a href="#notifications" class="side-menu">
                                <div class="side-menu__icon"><i data-lucide="bell"></i></div>
                                <div class="side-menu__title">Notifications</div>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
        <!-- END: Settings Menu -->
        
        <!-- BEGIN: Settings Content -->
        <div class="col-span-12 lg:col-span-9 2xl:col-span-10">
            <!-- BEGIN: Work Hours -->
            <div id="work-hours" class="intro-y box lg:mt-5">
                <div class="flex items-center p-5 border-b border-slate-200/60">
                    <h2 class="font-medium text-base mr-auto">Work Hours Settings</h2>
                </div>
                <div class="p-5">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mb-3">
                                <label class="form-label">Default Work Hours</label>
                                <div class="flex items-center">
                                    <input type="time" class="form-control" value="09:00">
                                    <div class="mx-2">to</div>
                                    <input type="time" class="form-control" value="17:00">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Grace Period (Minutes)</label>
                                <input type="number" class="form-control" value="15">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Minimum Working Hours</label>
                                <input type="number" class="form-control" value="8">
                            </div>
                            <div class="form-check mt-5">
                                <input type="checkbox" class="form-check-input" checked>
                                <label class="form-check-label">Enable Flexible Hours</label>
                            </div>
                        </div>
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mb-3">
                                <label class="form-label">Working Days</label>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" checked>
                                    <label class="form-check-label">Monday</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" checked>
                                    <label class="form-check-label">Tuesday</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" checked>
                                    <label class="form-check-label">Wednesday</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" checked>
                                    <label class="form-check-label">Thursday</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" checked>
                                    <label class="form-check-label">Friday</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary mt-5">Save Changes</button>
                </div>
            </div>
            <!-- END: Work Hours -->

            <!-- BEGIN: Leave Types -->
            <div id="leave-types" class="intro-y box mt-5">
                <div class="flex items-center p-5 border-b border-slate-200/60">
                    <h2 class="font-medium text-base mr-auto">Leave Types</h2>
                    <button class="btn btn-primary shadow-md" data-tw-toggle="modal" data-tw-target="#add-leave-type">
                        Add Leave Type
                    </button>
                </div>
                <div class="p-5">
                    <table class="table table-report">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Leave Type</th>
                                <th class="text-center whitespace-nowrap">Days Per Year</th>
                                <th class="text-center whitespace-nowrap">Carry Forward</th>
                                <th class="text-center whitespace-nowrap">Requires Approval</th>
                                <th class="text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="intro-x">
                                <td>Annual Leave</td>
                                <td class="text-center">21</td>
                                <td class="text-center">Yes</td>
                                <td class="text-center">Yes</td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <a class="flex items-center mr-3" href="javascript:;">
                                            <i data-lucide="edit" class="w-4 h-4 mr-1"></i> Edit
                                        </a>
                                        <a class="flex items-center text-danger" href="javascript:;">
                                            <i data-lucide="trash" class="w-4 h-4 mr-1"></i> Delete
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <!-- More leave types -->
                        </tbody>
                    </table>
                </div>
            </div>
            <!-- END: Leave Types -->

            <!-- BEGIN: Holidays -->
            <div id="holidays" class="intro-y box mt-5">
                <div class="flex items-center p-5 border-b border-slate-200/60">
                    <h2 class="font-medium text-base mr-auto">Holiday Calendar</h2>
                    <button class="btn btn-primary shadow-md" data-tw-toggle="modal" data-tw-target="#add-holiday">
                        Add Holiday
                    </button>
                </div>
                <div class="p-5">
                    <table class="table table-report">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Holiday Name</th>
                                <th class="text-center whitespace-nowrap">Date</th>
                                <th class="text-center whitespace-nowrap">Type</th>
                                <th class="text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="intro-x">
                                <td>New Year's Day</td>
                                <td class="text-center">Jan 1, 2025</td>
                                <td class="text-center">Public Holiday</td>
                                <td class="table-report__action w-56">
                                    <div class="flex justify-center items-center">
                                        <a class="flex items-center mr-3" href="javascript:;">
                                            <i data-lucide="edit" class="w-4 h-4 mr-1"></i> Edit
                                        </a>
                                        <a class="flex items-center text-danger" href="javascript:;">
                                            <i data-lucide="trash" class="w-4 h-4 mr-1"></i> Delete
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <!-- More holidays -->
                        </tbody>
                    </table>
                </div>
            </div>
            <!-- END: Holidays -->

            <!-- BEGIN: Work Modes -->
            <div id="work-modes" class="intro-y box mt-5">
                <div class="flex items-center p-5 border-b border-slate-200/60">
                    <h2 class="font-medium text-base mr-auto">Work Mode Settings</h2>
                </div>
                <div class="p-5">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 xl:col-span-6">
                            <div class="form-check mt-2">
                                <input type="checkbox" class="form-check-input" checked>
                                <label class="form-check-label">Allow Remote Work</label>
                            </div>
                            <div class="form-check mt-2">
                                <input type="checkbox" class="form-check-input" checked>
                                <label class="form-check-label">Allow Hybrid Work</label>
                            </div>
                            <div class="mt-3">
                                <label class="form-label">Maximum Remote Days Per Week</label>
                                <input type="number" class="form-control" value="3">
                            </div>
                        </div>
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mb-3">
                                <label class="form-label">Required Office Days</label>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input" checked>
                                    <label class="form-check-label">Monday</label>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" class="form-check-input">
                                    <label class="form-check-label">Tuesday</label>
                                </div>
                                <!-- More days -->
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary mt-5">Save Changes</button>
                </div>
            </div>
            <!-- END: Work Modes -->

            <!-- BEGIN: Notifications -->
            <div id="notifications" class="intro-y box mt-5">
                <div class="flex items-center p-5 border-b border-slate-200/60">
                    <h2 class="font-medium text-base mr-auto">Notification Settings</h2>
                </div>
                <div class="p-5">
                    <div class="mb-5">
                        <label class="form-label">Email Notifications</label>
                        <div class="form-check mt-2">
                            <input type="checkbox" class="form-check-input" checked>
                            <label class="form-check-label">Late Check-in Alerts</label>
                        </div>
                        <div class="form-check mt-2">
                            <input type="checkbox" class="form-check-input" checked>
                            <label class="form-check-label">Missing Check-out Alerts</label>
                        </div>
                        <div class="form-check mt-2">
                            <input type="checkbox" class="form-check-input" checked>
                            <label class="form-check-label">Leave Request Notifications</label>
                        </div>
                        <div class="form-check mt-2">
                            <input type="checkbox" class="form-check-input" checked>
                            <label class="form-check-label">Holiday Reminders</label>
                        </div>
                    </div>
                    <div class="mb-5">
                        <label class="form-label">Notification Recipients</label>
                        <select data-placeholder="Select recipients" class="tom-select w-full" multiple>
                            <option value="1">HR Manager</option>
                            <option value="2">Department Heads</option>
                            <option value="3">Team Leaders</option>
                        </select>
                    </div>
                    <button type="button" class="btn btn-primary mt-5">Save Changes</button>
                </div>
            </div>
            <!-- END: Notifications -->
        </div>
        <!-- END: Settings Content -->
    </div>
</div>

<!-- BEGIN: Add Leave Type Modal -->
<div id="add-leave-type" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add Leave Type</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4">
                <div class="col-span-12">
                    <label class="form-label">Leave Type Name</label>
                    <input type="text" class="form-control" placeholder="e.g., Sick Leave">
                </div>
                <div class="col-span-12">
                    <label class="form-label">Days Per Year</label>
                    <input type="number" class="form-control">
                </div>
                <div class="col-span-12">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input">
                        <label class="form-check-label">Allow Carry Forward</label>
                    </div>
                </div>
                <div class="col-span-12">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input">
                        <label class="form-check-label">Requires Approval</label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>
<!-- END: Add Leave Type Modal -->

<!-- BEGIN: Add Holiday Modal -->
<div id="add-holiday" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add Holiday</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4">
                <div class="col-span-12">
                    <label class="form-label">Holiday Name</label>
                    <input type="text" class="form-control" placeholder="e.g., Christmas Day">
                </div>
                <div class="col-span-12">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-control">
                </div>
                <div class="col-span-12">
                    <label class="form-label">Type</label>
                    <select class="form-select">
                        <option>Public Holiday</option>
                        <option>Company Holiday</option>
                        <option>Optional Holiday</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>
<!-- END: Add Holiday Modal -->

<?php get_footer(); ?>
