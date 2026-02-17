<?php /* Template Name:  Staff: Request - Test  */
?>

<?php
get_header();
$b_link = '/requests';
$b_title = 'Requests';
$p_title = 'New Request';

include get_template_directory() . "/layout/menu.php";
// print_r($staff);

global $wpdb;

$requestTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_types a WHERE a.type = 1 AND a.cct_status = 'publish' ");
$projects = $wpdb->get_results("SELECT * FROM staff_jet_cct_projects");
$categories = $wpdb->get_results("SELECT * FROM staff_jet_cct_request_categories");
$teams = $wpdb->get_results("SELECT a._ID, a.name FROM staff_jet_cct_teams a LEFT JOIN staff_jet_cct_team_members b ON b.team = a._ID WHERE b.staff = $staff->_ID ");


?>

<div class="intro-y flex items-center mt-8">
    <h2 id="request-title" class="text-lg font-medium mr-auto">
        New Request
    </h2>
</div>
<div class="intro-y mt-5 ">
    <div class="intro-y box p-5">
        <div class="grid grid-cols-12 gap-6 border-b mt-4 pb-2 ">
            <div class=" col-span-12 lg:col-span-8">
                <div id="request-div">
                    <form method="post" id="request_form" class="validate-form">
                        <h3 class="text-lg font-medium">Details</h3>
                        <div class=" sm:flex flex-row  flex-wrap items-end">
                            <div class="mt-5 sm:w-1/2 sm:p-2">
                                <label for="type" class="form-label">Request Type</label>
                                <select id="type" data-placeholder="Select Request Type" class="tom-select w-full" name="type" required>
                                    <option selected value="0">Select Request Type</option>
                                    <?php foreach ($requestTypes as $requestType) : ?>
                                        <option value="<?= $requestType->_ID; ?>" data-name="<?= $requestType->name; ?>"><?= $requestType->name; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="mt-5 sm:w-1/2 sm:p-2">
                                <label class="form-check-label" for="reimburse">Is this a Reimbursement?</label>
                                <div class="form-check p-2  form-switch">
                                    <input id="reimburse" name="reimburse" class="form-check-input" type="checkbox">
                                </div>
                            </div>
                            <div class="mt-5 sm:w-1/2 sm:p-2">
                                <label for="team" class="form-label  ">Team</label>
                                <select id="team" class="tom-select w-full" name="team" aria-label="Select Team">
                                    <option selected value="0" aria-label="Select Team">Select Team</option>
                                    <?php foreach ($teams as $team) : ?>
                                        <option value="<?= $team->_ID; ?>" aria-label="<?= $team->name; ?>"><?= $team->name; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="mt-5 sm:w-1/2 sm:p-2">
                                <label for="project" class="form-label  ">Project</label>
                                <select id="project" class="tom-select w-full" name="project" required aria-label="Select Project">
                                    <option selected value="-1">Select Project</option>
                                    <?php foreach ($projects as $project) : ?>
                                        <option value="<?= $project->_ID; ?>" aria-label="<?= $project->title; ?>"><?= $project->title; ?></option>
                                    <?php endforeach; ?>
                                    <option value="0" aria-label="None">None</option>
                                </select>
                            </div>

                            <div class=" mt-5 sm:w-1/2 sm:p-2">
                                <label for="category" class="form-label  ">Category</label>
                                <select id="category" data-placeholder="Select Category" class="tom-select w-full" name="category" required aria-label="Select Category">
                                    <option selected value="-1" aria-label="Select Category">Select Category</option>
                                    <?php foreach ($categories as $category) : ?>
                                        <option value="<?= $category->_ID; ?>" aria-label="<?= $category->name; ?>"><?= $category->name; ?></option>
                                    <?php endforeach; ?>
                                    <option value="0" aria-label="Uncategorized">Uncategorized</option>
                                </select>
                            </div>
                            <div class=" mt-5 sm:w-1/2 sm:p-2">
                                <label for="type" class="form-label  ">Due Date</label>
                                <input type="text" value="Select Date" class="form-control datepicker" name="date" id="date" data-single-mode="true" aria-label="Select Date" />
                            </div>
                            <div class="w-full mt-5 sm:p-2">
                                <label for="purpose" class="form-label  ">Purpose</label>
                                <textarea id="purpose" name="purpose" class="form-control" placeholder="Request Purpose/Description" required aria-label="Request Purpose"></textarea>
                            </div>

                        </div>
                        <div class="w-full mt-5  ">
                            <button type="button" name="cancel" id="cancel" class="btn  btn-lg mr-1 btn-primary-soft">Cancel</button>
                            <button type="submit" name="continue" id="continue" class="btn  btn-lg btn-primary">Continue</button>
                        </div>
                    </form>
                </div>
                <!-- Items -->
                <div id="items-div" class="mt-4 hidden border-b">
                    <div id="items-container" class="mt-4 pb-2">
                        <h3 class="text-lg font-medium">Items</h3>
                    </div>
                    <div class="flex items-center text-primary justify-between text-2xl mt-5">
                        <button type="button" id="add-item-btn" class="btn btn-primary-soft btn-sm mt-2 item-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="plus" data-lucide="plus" class="lucide lucide-plus block mr-2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>Add item
                        </button>
                        <div> Total: <span class="ml-2 p-2 border rounded " id="total-amount">&#x20A6;0.00</span></div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 border-0 md:border-l p-2 lg:col-span-4">
                <h3 class="text-lg font-medium p-2">Note</h3>
            </div>

        </div>



        <div class="flex justify-between items-center p-3 mt-5">
            <input type="hidden" id="amount" name="amount" value="" required></input>
            <input type="hidden" id="staff" name="staff" value="<?= $staff->_ID ?>"></input>
            <div><button type="button" name="draftBtn" id="draftBtn" class="btn  btn-lg mr-1 btn-primary-soft">Save</button><button type="submit" name="submitBtn" id="submitBtn" class="btn  btn-lg btn-primary">Submit</button></div>

        </div>
    </div>

    <!-- END: Form Layout -->
</div>



<script>
    $(document).ready(function($) {

        let itemCount = 0;

        $('#add-item-btn').click(function(e) {
            e.preventDefault();

            var itemIndex = $('.itemm').length;
            console.log(itemIndex);
            var itemHtml = `
            <div class="itemm border-t border-b p-3 flex flex-col gap-5 mt-2" data-item-index="${itemIndex}">
                    <div class="flex gap-5">
                        <div class="w-full">
                            <label class="form-label">Item:</label>
                            <input type="text" name="item[${itemIndex}][item]" required class="form-control">
                        </div>
                        <div class="">
                            <label class="form-label">Quantity:</label>
                            <input type="number" name="item[${itemIndex}][qty]" required class="form-control">
                        </div>
                        <div class="">
                            <label class="form-label">Price:</label>
                            <input type="number" val="0" name="item[${itemIndex}][price]" required class="form-control">
                        </div>
                        <div class="">
                            <label class="form-label">Amount:</label>
                            <input type="number" name="item[${itemIndex}][amt]" disabled class="form-control">
                        </div>
                    </div>
                    <div class="flex gap-5 items-end p-2 justify-between">
                        <div class="flex items-start gap-5">
                            <div class="">
                                <label class="form-label">Note:</label>
                                <textarea name="item[${itemIndex}][account]" rows="1" required class="form-control" placeholder="Account Number | Account Name | Bank"></textarea>
                            </div>
                            <div class="">
                                <label class="form-label"> Supporting Document(s):</label>
                                <input type="file" name="item[${itemIndex}][file]"  class="form-control p-1 border" multiple>
                            </div>
                                <div class="form-check  gap-2 flex-col form-switch">
                                    <label class="form-check-label" for="item[${itemIndex}][cash]">Cash Advance</label>
                                    <input id="item[${itemIndex}][cash]" name="item[${itemIndex}][cash]" class="form-check-input" type="checkbox">
                                </div>
                        </div>
                        <button class="delete-item-btn btn btn-outline-danger bg-white w-12 self-end"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash block m-auto"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>
                    </div>
                    <div class="flex gap-5 items-end p-2 justify-between">
                        <button class="delete-item-btn btn btn-outline-danger bg-white w-12 self-end"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash block m-auto"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>
                        <button class="save-item-btn btn btn-outline-success bg-white w-12 self-end"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="trash" data-lucide="trash" class="lucide lucide-trash block m-auto"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>
                    </div>
                </div>

            `;
            $('#items-container').append(itemHtml);
        });


        // Delete timeline button click handler
        $(document).on('click', '.delete-item-btn', function() {
            $(this).closest('.itemm').remove();
        });

        // Delete timeline button click handler
        $(document).on('click', '.save-item-btn', function() {
            const itemContainer = $(this).closest('.itemm');
            const itemIndex = itemContainer.data('item-index');
            const itemData = {
                item: $('input[name="item[' + itemIndex + '][item]"]').val(),
                qty: $('input[name="item[' + itemIndex + '][qty]"]').val(),
                price: $('input[name="item[' + itemIndex + '][price]"]').val(),
                amt: $('input[name="item[' + itemIndex + '][amt]"]').val(),
                account: $('textarea[name="item[' + itemIndex + '][account]"]').val(),
                file: $('input[name="item[' + itemIndex + '][file]"]')[0].files[0],
                cash: $('input[name="item[' + itemIndex + '][cash]"]').is(':checked')
            };

            console.log(itemData);


        });

        // Event delegation on the container to catch changes within added items
        $('#items-container').on('change', '.itemm input[type="number"]', function() {
            calculateAmount(this);
            calculateTotalAmount();
        });

        function calculateAmount(input) {
            // Get the parent item container based on the input
            var itemContainer = $(input).closest('.itemm');

            // Retrieve the item index from the data attribute
            var itemIndex = itemContainer.data('itemIndex');

            // Find the price and quantity inputs within the same item container
            var priceInput = itemContainer.find('[name="item[' + itemIndex + '][price]"]');
            var quantityInput = itemContainer.find('[name="item[' + itemIndex + '][qty]"]');
            var amountInput = itemContainer.find('[name="item[' + itemIndex + '][amt]"]'); // Use unique ID for amount

            // Check if both price and quantity are valid numbers (avoid NaN)
            var price = parseFloat(priceInput.val());
            var quantity = parseFloat(quantityInput.val());
            var amount = price * quantity;
            // Update the amount input with formatted value (optional)
            amountInput.val(amount.toFixed(2)); // Format to two decimal places

        }

        function calculateTotalAmount() {
            // Find all amt input elements within the items container
            var amtInputs = $('#items-container .itemm input[type="number"][name*="[amt]"]'); // Target type="number" and name containing "[amt]"
            // Initialize total amount to 0
            var totalAmount = 0;

            // Loop through each amt input and accumulate values
            amtInputs.each(function() {
                // Check for valid number
                var itemAmt = parseFloat($(this).val());
                if (!isNaN(itemAmt)) {
                    totalAmount += itemAmt;
                }
            });
            // Update the #total-amount element with formatted total (optional)
            $('#amount').val(totalAmount.toFixed(2));
            $('#total-amount').html('&#x20A6;' + totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2
            }));
        }

        // Submit form with status 1 (Draft) when Draft button is clicked
        $('button[name="continue"]').click(function() {
            event.preventDefault();

            // Check if any required fields are empty
            if ($('#type').val() === "" || $('#type').val() === "0" || $('#team').val() === "" || $('#team').val() === "0" || $('#project').val() === "" || $('#project').val() === "-1" || $('#date').val() === "" || $('#purpose').val() === "" || $('#category').val() === "-1") {
                alert("Please fill in all required fields.");
                return; // Stop the function execution if any required fields are empty
            }

            // Change the text to 'Loading...'
            $(this).text('Loading...');
            $('#request-title').text("Saving draft...");
            // $('#request-div').hide();
            $('#items-div').show();



            var formData = new FormData();
            formData.append('form', 'new');
            formData.append('status', 1);
            formData.append('reimburse', reimburse);
            formData.append('category', $('#categor').val());
            formData.append('staff', <?= $staff->_ID; ?>);
            formData.append('type', $('#type').val());
            formData.append('team', $('#team').val());
            formData.append('project', $('#project').val());
            formData.append('date', $('#date').val());
            formData.append('purpose', $('#purpose').val());

            formData.forEach(function(value, key) {
                console.log(key, value);
            });

            //AJAX request
            $.ajax({
                url: '/wp-content/themes/stanforte/forms/test.php',
                method: 'POST',
                data: formData,
                processData: false, // Prevent jQuery from processing the FormData
                contentType: false,
                success: function(response) {
                    if (response.success = true) {
                        console.log(response.message, response.id);
                        sessionStorage.setItem('request', response.id);
                        $('#request-title').text(response.request + ' - Draft Saved');

                    } else {
                        //  console.log(response.message)
                        console.log(response.message)
                    }
                },
                error: function(err) {
                    console.log('Failed to add request');
                },
                complete: function() {
                    // // Re-enable the submit button
                    // $('#submitBtn').prop('disabled', false);
                    // // Reset the text of the submit button
                    // $('#submitBtn').text('Submit');
                }
            });
        });


        function submitForm(statusValue) {
            // Prevent the default form submission




            // Check if any required fields are empty
            if ($('#type').val() === "" || $('#team').val() === "" || $('#project').val() === "" || $('#date').val() === "" || $('#purpose').val() === "" || $('#category').val() === "") {
                alert("Please fill in all required fields.");
                return; // Stop the function execution if any required fields are empty
            }

            // Check if any item fields are empty
            var itemsEmpty = false;
            $('input[name^="items["][name$="][item]"]').each(function() {
                if ($(this).val() === "") {
                    itemsEmpty = true;
                    return false; // Exit the loop early if an empty item is found
                }
            });
            if (itemsEmpty) {
                alert("Please fill in all item fields.");
                return; // Stop the function execution if any item fields are empty
            }

            // Disable the submit button
            $('#submitBtn, #draftBtn').prop('disabled', true);

            // Change the text to 'Loading...'
            $('#submitBtn, #draftBtn').text('Loading...');

            //Gather form data
            var formData = {};
            $.each($('#request_form').serializeArray(), function(_, kv) {
                formData[kv.name] = kv.value;
            });
            // Check if $staff->team_status = 2, then set status to 4
            var status;
            if (statusValue === 2 && <?= $staff->team_status ?> === 2) {
                status = 4; // Set status value to 4
            } else {
                status = statusValue; // Set status value based on button clicked
            }

            var formDataArray = [];
            var files = [];

            var formData = new FormData();
            $('.itemm').each(function(index) {
                var rowData = {};
                var $inputs = $(this).find('input, textarea'); // Include textarea in selector
                rowData.index = $(this).index();
                rowData.item = $inputs.eq(0).val();
                rowData.qty = $inputs.eq(1).val();
                rowData.price = $inputs.eq(2).val();

                // Handle Cash Advance checkbox
                var cashCheckbox = $inputs.filter('[name^="cash"]:checked');
                rowData.cash = cashCheckbox.length ? 1 : 0;

                // Handle textarea input
                rowData.account = $inputs.eq(4).val(); // Assuming the textarea is the fourth field

                // Append each file separately for the current item
                var fileInput = $inputs.filter('[type="file"]');
                var fileList = fileInput.prop('files');
                for (var i = 0; i < fileList.length; i++) {
                    var file = fileList[i];
                    if (file) {
                        formData.append('files[' + index + '][]', file); // Associate each file with its corresponding item index
                    }
                }

                formDataArray.push(rowData);


            });

            var reimburse;
            if ($('[name^="reimburse"]:checked').length) {
                reimburse = 1;
            } else {
                reimburse = 0;
            }

            formData.append('form', 'request');
            formData.append('status', status);
            formData.append('reimburse', reimburse);
            formData.append('category', $('#type').val());
            formData.append('staff', <?= $staff->_ID; ?>);
            formData.append('type', $('#type').val());
            formData.append('team', $('#team').val());
            formData.append('project', $('#project').val());
            formData.append('date', $('#date').val());
            formData.append('purpose', $('#purpose').val());
            formData.append('note', $('#note').val());
            formData.append('amount', $('#amount').val());
            formData.append('items', JSON.stringify(formDataArray));
            // Append files separately
            for (var i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }

            // Log formData for debugging
            //  formData.forEach(function(value, key) {
            //      console.log(key, value);
            //  });



            //AJAX request
            $.ajax({
                url: '/wp-content/themes/stanforte/forms/test.php',
                method: 'POST',
                data: formData,
                processData: false, // Prevent jQuery from processing the FormData
                contentType: false,
                success: function(response) {
                    if (response.success = true) {
                        //  console.log(response.message)
                        alert(response.message)
                        window.location.href = "https://staff.stanforteedge.com/requests/request/?id=" + response.id;
                    } else {
                        //  console.log(response.message)
                        alert(response.message)
                    }
                },
                error: function(err) {
                    alert('Failed to add request');
                },
                complete: function() {
                    // Re-enable the submit button
                    $('#submitBtn').prop('disabled', false);
                    // Reset the text of the submit button
                    $('#submitBtn').text('Submit');
                }
            });
        }

        // Submit form with status 1 (Draft) when Draft button is clicked
        $('button[name="draftBtn"]').click(function() {
            submitForm(1); // Status 1 represents Draft
        });

        // Submit form with status 2 (Submitted) when Submit button is clicked
        $('button[name="submitBtn"]').click(function() {
            submitForm(2); // Status 2 represents Submitted
        });

    });
</script>


<?php get_footer(); ?>