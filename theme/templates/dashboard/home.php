<?php /* Template Name: Dashboard: Home */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = '';

include get_template_directory() . "/templates/layout/menu.php";

?>


<div class="grid grid-cols-12 items-end gap-6 mt-5">
    <div class="col-span-12 lg:col-span-8">
        <div class="grid grid-cols-12 items-end gap-6 mt-5">
            <div class="col-span-12 intro-y">
                <div class="box p-5 zoom-in">
                    <div class="flex items-center">
                        <div class="w-2/3">
                            <div class="flex">
                                <i data-lucide="user" class="w-8 h-8 text-pending"></i>
                            </div>
                            <div class="text-2xl font-medium leading-8 mt-6">Hello <?= $staff->first_name; ?></div>
                            <div class="text-base text-slate-500 mt-1"><?= $staff->position; ?></div>
                        </div>
                        <div class="w-1/3 text-right">
                            <?php
                            $current_time = current_time('H:i');
                            $is_checked_in = false; // You'll need to implement this check from your database
                            ?>
                            <div class="text-base text-slate-500">Current Time</div>
                            <div class="text-2xl font-medium" id="current-time"><?= $current_time ?></div>
                            <button class="btn btn-primary mt-4" id="attendance-btn" onclick="toggleAttendance()">
                                <?= $is_checked_in ? 'Check Out' : 'Check In' ?>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="/requests">
                    <div class="box p-5  zoom-in">
                        <div class="flex flex-row justify-between align-start">
                            <i data-lucide="file-text" class="w-8 h-8 text-success "></i>
                            <div id="journalCount" class="text-xl font-medium leading-8"></div>
                        </div>
                        <div class="text-2xl font-medium leading-8 mt-6">Requests</div>
                        <div class="text-base text-slate-500 mt-1">Add and Edit notes</div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="user" class="w-8 h-8 text-success "></i>
                        </div>
                        <div id="submittedCount" class="text-2xl font-medium leading-8 mt-6">Reports</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon</div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="search" class="w-8 h-8 text-success "></i>
                        </div>
                        <div id="markersCount" class="text-2xl font-medium leading-8 mt-6">Resources</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon </div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="calendar" class="w-8 h-8 text-success "></i>
                        </div>
                        <div id="markersCount" class="text-2xl font-medium leading-8 mt-6">Email</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon</div>
                    </div>
                </a>
            </div>
            <div class="col-span-12 sm:col-span-4 xl:col-span-4 intro-y">
                <a href="">
                    <div class="box p-5  zoom-in">
                        <div class="flex">
                            <i data-lucide="search" class="w-8 h-8 text-warning "></i>
                        </div>
                        <div id="markersCount" class="text-2xl font-medium leading-8 mt-6">Notifications</div>
                        <div class="text-base text-slate-500 mt-1">Coming Soon</div>
                    </div>
                </a>
            </div>
        </div>
    </div>
    <div class="col-span-4">

    </div>
</div>

<!-- END: Content -->
</div>
</div>
<script>
    jQuery(document).ready(function($) {
        // Update current time every minute
        function updateTime() {
            var now = new Date();
            var hours = now.getHours().toString().padStart(2, '0');
            var minutes = now.getMinutes().toString().padStart(2, '0');
            $('#current-time').text(hours + ':' + minutes);
        }
        setInterval(updateTime, 60000);

        // Attendance functionality
        window.toggleAttendance = function() {
            var btn = $('#attendance-btn');
            var isCheckedIn = btn.text().trim() === 'Check Out';
            
            // Add AJAX call here to update attendance status in the database
            $.ajax({
                url: '/wp-json/api/v1/attendance',
                method: 'POST',
                data: {
                    action: isCheckedIn ? 'checkout' : 'checkin',
                    timestamp: new Date().toISOString()
                },
                success: function(response) {
                    if (response.success) {
                        btn.text(isCheckedIn ? 'Check In' : 'Check Out');
                        // Show success message
                        alert(isCheckedIn ? 'Checked out successfully!' : 'Checked in successfully!');
                    }
                },
                error: function() {
                    alert('Failed to update attendance. Please try again.');
                }
            });
        }
    });
</script>

<?php get_footer(); ?>