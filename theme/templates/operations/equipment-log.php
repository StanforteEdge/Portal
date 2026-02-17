<?php /* Template Name: Operations: Equipment Log */
get_header();
$b_link = '/operations/equipment-log';
$b_title = 'Equipment Log';
$p_title = '';

include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="intro-y col-span-12 flex flex-wrap sm:flex-nowrap items-center mt-2">
        <h2 class="text-lg font-medium mr-auto">Equipment Log Sheet</h2>
        <div class="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto md:ml-0">
            <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-equipment-modal">
                Add New Entry
            </button>
        </div>
    </div>

    <!-- Equipment Log Table -->
    <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
        <table class="table table-report -mt-2">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">Date</th>
                    <th class="whitespace-nowrap">Equipment</th>
                    <th class="whitespace-nowrap">Staff Member</th>
                    <th class="whitespace-nowrap">Check Out Time</th>
                    <th class="whitespace-nowrap">Expected Return</th>
                    <th class="whitespace-nowrap">Actual Return</th>
                    <th class="whitespace-nowrap">Purpose</th>
                    <th class="whitespace-nowrap">Condition Out</th>
                    <th class="whitespace-nowrap">Condition In</th>
                    <th class="text-center whitespace-nowrap">Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Data will be populated dynamically -->
            </tbody>
        </table>
    </div>
</div>

<!-- Add Equipment Log Modal -->
<div id="add-equipment-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add Equipment Log Entry</h2>
            </div>
            <form id="equipment-log-form">
                <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                    <div class="col-span-12">
                        <label for="equipment" class="form-label">Equipment</label>
                        <select id="equipment" class="form-select w-full" required>
                            <!-- Equipment will be populated dynamically -->
                        </select>
                    </div>
                    <div class="col-span-12">
                        <label for="staff-member" class="form-label">Staff Member</label>
                        <select id="staff-member" class="form-select w-full" required>
                            <!-- Staff members will be populated dynamically -->
                        </select>
                    </div>
                    <div class="col-span-6">
                        <label for="checkout-time" class="form-label">Check Out Time</label>
                        <input id="checkout-time" type="datetime-local" class="form-control" required>
                    </div>
                    <div class="col-span-6">
                        <label for="expected-return" class="form-label">Expected Return</label>
                        <input id="expected-return" type="datetime-local" class="form-control" required>
                    </div>
                    <div class="col-span-12">
                        <label for="purpose" class="form-label">Purpose</label>
                        <textarea id="purpose" class="form-control" required></textarea>
                    </div>
                    <div class="col-span-12">
                        <label for="condition-out" class="form-label">Condition at Check Out</label>
                        <textarea id="condition-out" class="form-control" required></textarea>
                    </div>
                    <div class="col-span-12">
                        <label for="notes" class="form-label">Additional Notes</label>
                        <textarea id="notes" class="form-control"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                    <button type="submit" class="btn btn-primary w-20">Save</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // Initialize form handlers and data loading
    loadEquipmentLogEntries();
    loadEquipment();
    loadStaffMembers();

    $('#equipment-log-form').on('submit', function(e) {
        e.preventDefault();
        saveEquipmentLogEntry();
    });
});
</script>

<?php get_footer(); ?>
