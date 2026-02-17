<?php /* Template Name: Operations: Vehicle Log */
get_header();
$b_link = '/operations/vehicle-log';
$b_title = 'Vehicle Log';
$p_title = '';

include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="intro-y col-span-12 flex flex-wrap sm:flex-nowrap items-center mt-2">
        <h2 class="text-lg font-medium mr-auto">Vehicle Log Sheet</h2>
        <div class="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto md:ml-0">
            <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-entry-modal">
                Add New Entry
            </button>
        </div>
    </div>

    <!-- Vehicle Log Table -->
    <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
        <table class="table table-report -mt-2">
            <thead>
                <tr>
                    <th class="whitespace-nowrap">Date</th>
                    <th class="whitespace-nowrap">Vehicle</th>
                    <th class="whitespace-nowrap">Driver</th>
                    <th class="whitespace-nowrap">Departure Time</th>
                    <th class="whitespace-nowrap">Return Time</th>
                    <th class="whitespace-nowrap">Purpose</th>
                    <th class="whitespace-nowrap">Start Mileage</th>
                    <th class="whitespace-nowrap">End Mileage</th>
                    <th class="whitespace-nowrap">Fuel Added</th>
                    <th class="text-center whitespace-nowrap">Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Data will be populated dynamically -->
            </tbody>
        </table>
    </div>
</div>

<!-- Add Entry Modal -->
<div id="add-entry-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add Vehicle Log Entry</h2>
            </div>
            <form id="vehicle-log-form">
                <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                    <div class="col-span-12">
                        <label for="vehicle" class="form-label">Vehicle</label>
                        <select id="vehicle" class="form-select w-full" required>
                            <!-- Vehicles will be populated dynamically -->
                        </select>
                    </div>
                    <div class="col-span-12">
                        <label for="driver" class="form-label">Driver</label>
                        <select id="driver" class="form-select w-full" required>
                            <!-- Staff members will be populated dynamically -->
                        </select>
                    </div>
                    <div class="col-span-6">
                        <label for="departure-time" class="form-label">Departure Time</label>
                        <input id="departure-time" type="datetime-local" class="form-control" required>
                    </div>
                    <div class="col-span-6">
                        <label for="return-time" class="form-label">Return Time</label>
                        <input id="return-time" type="datetime-local" class="form-control">
                    </div>
                    <div class="col-span-12">
                        <label for="purpose" class="form-label">Purpose</label>
                        <textarea id="purpose" class="form-control" required></textarea>
                    </div>
                    <div class="col-span-6">
                        <label for="start-mileage" class="form-label">Start Mileage</label>
                        <input id="start-mileage" type="number" class="form-control" required>
                    </div>
                    <div class="col-span-6">
                        <label for="end-mileage" class="form-label">End Mileage</label>
                        <input id="end-mileage" type="number" class="form-control">
                    </div>
                    <div class="col-span-12">
                        <label for="fuel-added" class="form-label">Fuel Added (Liters)</label>
                        <input id="fuel-added" type="number" class="form-control">
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
    loadVehicleLogEntries();
    loadVehicles();
    loadStaffMembers();

    $('#vehicle-log-form').on('submit', function(e) {
        e.preventDefault();
        saveVehicleLogEntry();
    });
});
</script>

<?php get_footer(); ?>
