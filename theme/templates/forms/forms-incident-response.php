<?php /* Template Name: Staff : Forms - Incident Response */ ?>

<?php
get_header();
$b_link = '/forms';
$b_title = 'Forms';
$p_title = 'Incident Response';

include get_template_directory() . "/layout/menu.php";
?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Incident Response Form
    </h2>
</div>
<div class="intro-y mt-5">
    <form method="post" id="incident_response_form">
        <div class="intro-y box p-5">
            <div class="grid grid-cols-12 gap-6 border-b mt-4 pb-2">
                <div class="col-span-12 lg:col-span-7">
                    <h3 class="text-lg font-medium mb-4">Incident Details</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Date of Incident</label>
                            <input type="datetime-local" class="form-control" name="incident_date" required>
                        </div>
                        <div>
                            <label class="form-label">Location</label>
                            <input type="text" class="form-control" name="location" required>
                        </div>
                        <div class="col-span-2">
                            <label class="form-label">Incident Type</label>
                            <select class="form-control" name="incident_type" required>
                                <option value="">Select Incident Type</option>
                                <option value="security">Security Breach</option>
                                <option value="safety">Safety Incident</option>
                                <option value="facility">Facility Issue</option>
                                <option value="it">IT Problem</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="mt-4">
                        <label class="form-label">Incident Description</label>
                        <textarea class="form-control" name="description" rows="4" required></textarea>
                    </div>

                    <h3 class="text-lg font-medium mt-6 mb-4">Response Details</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="form-label">Immediate Actions Taken</label>
                            <textarea class="form-control" name="immediate_actions" rows="3" required></textarea>
                        </div>
                        <div>
                            <label class="form-label">Persons Involved</label>
                            <textarea class="form-control" name="persons_involved" rows="2"></textarea>
                        </div>
                        <div>
                            <label class="form-label">Witnesses (if any)</label>
                            <textarea class="form-control" name="witnesses" rows="2"></textarea>
                        </div>
                        <div>
                            <label class="form-label">Impact Assessment</label>
                            <select class="form-control" name="impact_level" required>
                                <option value="">Select Impact Level</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Recommended Follow-up Actions</label>
                            <textarea class="form-control" name="follow_up_actions" rows="3"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end mt-5">
                <button type="submit" class="btn btn-primary w-24 mr-1">Submit</button>
                <button type="button" class="btn btn-outline-secondary w-24">Cancel</button>
            </div>
        </div>
    </form>
</div>

<?php get_footer(); ?>
