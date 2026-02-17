<?php /* Template Name: Staff : Forms - Exit Interview */ ?>

<?php
get_header();
$b_link = '/forms';
$b_title = 'Forms';
$p_title = 'Exit Interview';

include get_template_directory() . "/layout/menu.php";
?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Exit Interview Questionnaire
    </h2>
</div>
<div class="intro-y mt-5">
    <form method="post" id="exit_interview_form">
        <div class="intro-y box p-5">
            <div class="grid grid-cols-12 gap-6 border-b mt-4 pb-2">
                <div class="col-span-12 lg:col-span-7">
                    <h3 class="text-lg font-medium mb-4">Employee Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Employee Name</label>
                            <input type="text" class="form-control" name="employee_name" required>
                        </div>
                        <div>
                            <label class="form-label">Department</label>
                            <input type="text" class="form-control" name="department" required>
                        </div>
                        <div>
                            <label class="form-label">Position</label>
                            <input type="text" class="form-control" name="position" required>
                        </div>
                        <div>
                            <label class="form-label">Last Working Day</label>
                            <input type="date" class="form-control" name="last_working_day" required>
                        </div>
                    </div>

                    <h3 class="text-lg font-medium mt-6 mb-4">Exit Questions</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="form-label">What are your primary reasons for leaving?</label>
                            <textarea class="form-control" name="reason_for_leaving" rows="3" required></textarea>
                        </div>
                        <div>
                            <label class="form-label">What did you like most about your job?</label>
                            <textarea class="form-control" name="job_likes" rows="3" required></textarea>
                        </div>
                        <div>
                            <label class="form-label">What did you like least about your job?</label>
                            <textarea class="form-control" name="job_dislikes" rows="3" required></textarea>
                        </div>
                        <div>
                            <label class="form-label">Would you recommend our company to others?</label>
                            <select class="form-control" name="recommend_company" required>
                                <option value="">Select an option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                <option value="maybe">Maybe</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Do you have any suggestions for improvement?</label>
                            <textarea class="form-control" name="suggestions" rows="3"></textarea>
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
