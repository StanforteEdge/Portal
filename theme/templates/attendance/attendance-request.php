<?php
/* Template Name: Attendance: Request Time Off & Hybrid Work */

get_header();
$b_link = '/attendance/request';
$b_title = 'Attendance';
$p_title = 'Request Time Off';

include get_template_directory() . "/templates/layout/menu.php";
?>
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Request Management</h2>
    </div>

    <!-- Request Type Selection -->
    <div class="intro-y box mt-5">
        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
            <h2 class="font-medium text-base mr-auto">Select Request Type</h2>
        </div>
        <div class="p-5">
            <div class="preview">
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item flex-1" role="presentation">
                        <button class="nav-link w-full py-2 active" data-tw-toggle="pill" data-tw-target="#leave-request" type="button" role="tab">
                            Leave Request
                        </button>
                    </li>
                    <li class="nav-item flex-1" role="presentation">
                        <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#hybrid-request" type="button" role="tab">
                            Hybrid Work Request
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <div class="tab-content">
        <!-- Leave Request Form -->
        <div id="leave-request" class="tab-pane active" role="tabpanel">
            <div class="grid grid-cols-12 gap-6 mt-5">
                <div class="intro-y col-span-12">
                    <div class="box">
                        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                            <h2 class="font-medium text-base mr-auto">Leave Request Form</h2>
                        </div>
                        <div class="p-5">
                            <form id="leave-form">
                                <input type="hidden" name="request_type" value="leave">
                                <div class="preview">
                                    <div>
                                        <label for="leave-type" class="form-label">Leave Type</label>
                                        <select id="leave-type" name="leave_type" class="form-select">
                                            <option value="annual">Annual Leave</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="maternity">Maternity Leave</option>
                                            <option value="paternity">Paternity Leave</option>
                                            <option value="study">Study Leave</option>
                                        </select>
                                    </div>
                                    <div class="mt-3">
                                        <label for="leave-start-date" class="form-label">Start Date</label>
                                        <input id="leave-start-date" name="start_date" type="date" class="form-control" required>
                                    </div>
                                    <div class="mt-3">
                                        <label for="leave-end-date" class="form-label">End Date</label>
                                        <input id="leave-end-date" name="end_date" type="date" class="form-control" required>
                                    </div>
                                    <div class="mt-3">
                                        <label for="leave-reason" class="form-label">Reason</label>
                                        <textarea id="leave-reason" name="reason" class="form-control" rows="4"></textarea>
                                    </div>
                                    <div class="mt-3">
                                        <label class="form-label">Handover Notes</label>
                                        <div class="mt-2">
                                            <div class="form-check">
                                                <input id="handover-yes" class="form-check-input" type="radio" name="handover" value="yes">
                                                <label class="form-check-label" for="handover-yes">Handover document attached</label>
                                            </div>
                                            <div class="form-check mt-2">
                                                <input id="handover-no" class="form-check-input" type="radio" name="handover" value="no">
                                                <label class="form-check-label" for="handover-no">No handover required</label>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary mt-5">Submit Leave Request</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hybrid Work Request Form -->
        <div id="hybrid-request" class="tab-pane" role="tabpanel">
            <div class="grid grid-cols-12 gap-6 mt-5">
                <div class="intro-y col-span-12">
                    <div class="box">
                        <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
                            <h2 class="font-medium text-base mr-auto">Hybrid Work Request Form</h2>
                            <div class="text-warning text-sm">* Requests must be submitted at least 3 days in advance</div>
                        </div>
                        <div class="p-5">
                            <form id="hybrid-form">
                                <input type="hidden" name="request_type" value="hybrid">
                                <div class="preview">
                                    <!-- Date Selection -->
                                    <div class="mt-3">
                                        <label class="form-label">Select Hybrid Work Days</label>
                                        <div class="alert alert-info show mb-2">
                                            <div class="flex items-center">
                                                <i data-lucide="info" class="w-6 h-6 mr-2"></i>
                                                <div>
                                                    <div class="font-medium">Hybrid Work Guidelines</div>
                                                    <div class="mt-1 text-xs">
                                                        - Maximum 2 days per week<br>
                                                        - Not available on meeting days (Monday & Friday)<br>
                                                        - Subject to team lead approval
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="hybrid-dates" class="grid grid-cols-7 gap-2 mt-2">
                                            <!-- Dates will be populated by JavaScript -->
                                        </div>
                                    </div>

                                    <!-- Work Plan -->
                                    <div class="mt-5">
                                        <label for="work-plan" class="form-label">Work Plan for Hybrid Days</label>
                                        <textarea id="work-plan" name="work_plan" class="form-control" rows="4" 
                                            placeholder="Describe your planned tasks and deliverables for the requested hybrid days"></textarea>
                                    </div>

                                    <!-- Availability -->
                                    <div class="mt-3">
                                        <label class="form-label">Contact Availability</label>
                                        <div class="grid grid-cols-12 gap-4">
                                            <div class="col-span-12 sm:col-span-6">
                                                <label for="available-from" class="form-label text-xs">Available From</label>
                                                <input id="available-from" name="available_from" type="time" class="form-control" required>
                                            </div>
                                            <div class="col-span-12 sm:col-span-6">
                                                <label for="available-to" class="form-label text-xs">Available To</label>
                                                <input id="available-to" name="available_to" type="time" class="form-control" required>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Communication Channels -->
                                    <div class="mt-3">
                                        <label class="form-label">Communication Channels</label>
                                        <div class="form-check mt-2">
                                            <input id="channel-slack" class="form-check-input" type="checkbox" name="channels[]" value="slack">
                                            <label class="form-check-label" for="channel-slack">Slack</label>
                                        </div>
                                        <div class="form-check mt-2">
                                            <input id="channel-teams" class="form-check-input" type="checkbox" name="channels[]" value="teams">
                                            <label class="form-check-label" for="channel-teams">Microsoft Teams</label>
                                        </div>
                                        <div class="form-check mt-2">
                                            <input id="channel-phone" class="form-check-input" type="checkbox" name="channels[]" value="phone">
                                            <label class="form-check-label" for="channel-phone">Phone</label>
                                        </div>
                                    </div>

                                    <!-- Additional Notes -->
                                    <div class="mt-3">
                                        <label for="hybrid-notes" class="form-label">Additional Notes</label>
                                        <textarea id="hybrid-notes" name="notes" class="form-control" rows="3" 
                                            placeholder="Any additional information for your team lead"></textarea>
                                    </div>

                                    <button type="submit" class="btn btn-primary mt-5">Submit Hybrid Work Request</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Current Requests Summary -->
<div class="intro-y box mt-5">
    <div class="flex flex-col sm:flex-row items-center p-5 border-b border-slate-200/60">
        <h2 class="font-medium text-base mr-auto">Current Requests</h2>
    </div>
    <div class="p-5">
        <div class="preview">
            <ul class="nav nav-tabs" role="tablist">
                <li class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2 active" data-tw-toggle="pill" data-tw-target="#pending-requests" type="button" role="tab">
                        Pending Requests
                    </button>
                </li>
                <li class="nav-item flex-1" role="presentation">
                    <button class="nav-link w-full py-2" data-tw-toggle="pill" data-tw-target="#approved-requests" type="button" role="tab">
                        Approved Requests
                    </button>
                </li>
            </ul>
            <div class="tab-content">
                <div id="pending-requests" class="tab-pane active" role="tabpanel">
                    <div class="overflow-x-auto">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Dates</th>
                                    <th>Status</th>
                                    <th>Submitted On</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="pending-requests-table">
                                <!-- Will be populated by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="approved-requests" class="tab-pane" role="tabpanel">
                    <div class="overflow-x-auto">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Dates</th>
                                    <th>Approved By</th>
                                    <th>Approved On</th>
                                </tr>
                            </thead>
                            <tbody id="approved-requests-table">
                                <!-- Will be populated by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
