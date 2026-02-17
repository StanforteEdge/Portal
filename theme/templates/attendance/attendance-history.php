<?php /* Template Name: Attendance: History */ ?>

<?php
get_header();
$b_link = '/attendance/history';
$b_title = 'Attendance';
$p_title = 'History';
include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">My Attendance History</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <div class="dropdown mr-2">
                <button class="dropdown-toggle btn box flex items-center" aria-expanded="false" data-tw-toggle="dropdown">
                    <i data-lucide="calendar" class="w-4 h-4 mr-2"></i> Filter by Date
                </button>
                <div class="dropdown-menu w-40">
                    <ul class="dropdown-content">
                        <li><a href="" class="dropdown-item">Today</a></li>
                        <li><a href="" class="dropdown-item">This Week</a></li>
                        <li><a href="" class="dropdown-item">This Month</a></li>
                        <li><a href="" class="dropdown-item">Custom Range</a></li>
                    </ul>
                </div>
            </div>
            <button class="btn btn-primary shadow-md mr-2">Download Report</button>
        </div>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Statistics Cards -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="box p-5">
                <div class="flex items-center">
                    <div class="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <span class="truncate">On Time</span>
                </div>
                <div class="text-2xl font-medium mt-2">85%</div>
            </div>
        </div>
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="box p-5">
                <div class="flex items-center">
                    <div class="w-2 h-2 bg-warning rounded-full mr-3"></div>
                    <span class="truncate">Late Arrivals</span>
                </div>
                <div class="text-2xl font-medium mt-2">12%</div>
            </div>
        </div>
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="box p-5">
                <div class="flex items-center">
                    <div class="w-2 h-2 bg-danger rounded-full mr-3"></div>
                    <span class="truncate">Absences</span>
                </div>
                <div class="text-2xl font-medium mt-2">3%</div>
            </div>
        </div>
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="box p-5">
                <div class="flex items-center">
                    <div class="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span class="truncate">Work Hours</span>
                </div>
                <div class="text-2xl font-medium mt-2">168h</div>
            </div>
        </div>

        <!-- Attendance History Table -->
        <div class="col-span-12 mt-6">
            <div class="intro-y box">
                <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                    <h2 class="font-medium text-base mr-auto">Detailed History</h2>
                    <div class="form-check form-switch w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0">
                        <label class="form-check-label ml-0" for="show-example-1">Search</label>
                        <input type="text" class="form-control w-56 box pr-10" placeholder="Search...">
                    </div>
                </div>
                <div class="p-5">
                    <div class="overflow-x-auto">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th class="whitespace-nowrap">Employee</th>
                                    <th class="whitespace-nowrap">Date</th>
                                    <th class="whitespace-nowrap">Check In</th>
                                    <th class="whitespace-nowrap">Check Out</th>
                                    <th class="whitespace-nowrap">Total Hours</th>
                                    <th class="whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 image-fit zoom-in">
                                                <img class="rounded-full" src="dist/images/profile-1.jpg" alt="Employee Photo">
                                            </div>
                                            <div class="ml-4">
                                                <div class="font-medium whitespace-nowrap">Olalekan Owonikoko</div>
                                                <div class="text-slate-500 text-xs whitespace-nowrap">Operations</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center">2024-12-16</td>
                                    <td class="text-center">08:30 AM</td>
                                    <td class="text-center">05:30 PM</td>
                                    <td class="text-center">9h 0m</td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center text-success">
                                            <i data-lucide="check" class="w-4 h-4 mr-2"></i> On Time
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 image-fit zoom-in">
                                                <img class="rounded-full" src="dist/images/profile-2.jpg" alt="Employee Photo">
                                            </div>
                                            <div class="ml-4">
                                                <div class="font-medium whitespace-nowrap">Micheal Ojediran</div>
                                                <div class="text-slate-500 text-xs whitespace-nowrap">Programs</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center">2024-12-16</td>
                                    <td class="text-center">09:15 AM</td>
                                    <td class="text-center">06:00 PM</td>
                                    <td class="text-center">8h 45m</td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center text-warning">
                                            <i data-lucide="alert-circle" class="w-4 h-4 mr-2"></i> Late
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 image-fit zoom-in">
                                                <img class="rounded-full" src="dist/images/profile-3.jpg" alt="Employee Photo">
                                            </div>
                                            <div class="ml-4">
                                                <div class="font-medium whitespace-nowrap">Allen Zito</div>
                                                <div class="text-slate-500 text-xs whitespace-nowrap">Communications</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center">2024-12-16</td>
                                    <td class="text-center">08:45 AM</td>
                                    <td class="text-center">05:45 PM</td>
                                    <td class="text-center">9h 0m</td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center text-success">
                                            <i data-lucide="check" class="w-4 h-4 mr-2"></i> On Time
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 image-fit zoom-in">
                                                <img class="rounded-full" src="dist/images/profile-4.jpg" alt="Employee Photo">
                                            </div>
                                            <div class="ml-4">
                                                <div class="font-medium whitespace-nowrap">Ademibolanle Adesida</div>
                                                <div class="text-slate-500 text-xs whitespace-nowrap">Advocacy</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center">2024-12-16</td>
                                    <td class="text-center">08:45 AM</td>
                                    <td class="text-center">05:45 PM</td>
                                    <td class="text-center">9h 0m</td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center text-success">
                                            <i data-lucide="check" class="w-4 h-4 mr-2"></i> On Time
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
