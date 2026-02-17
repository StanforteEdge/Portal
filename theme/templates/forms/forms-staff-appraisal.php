<?php /* Template Name: Staff : Forms - Appraisal */ ?>

<?php
get_header();
$b_link = '/forms';
$b_title = 'Forms';
$p_title = 'Staff Appraisal';

include get_template_directory() . "/layout/menu.php";
?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Staff Appraisal Form
    </h2>
</div>
<div class="intro-y mt-5">
    <form method="post" id="staff_appraisal_form">
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
                            <label class="form-label">Review Period</label>
                            <input type="text" class="form-control" name="review_period" required placeholder="e.g., Jan 2024 - Dec 2024">
                        </div>
                    </div>

                    <h3 class="text-lg font-medium mt-6 mb-4">Performance Assessment</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="form-label">Job Knowledge</label>
                            <select class="form-control" name="job_knowledge" required>
                                <option value="">Select Rating</option>
                                <option value="5">Excellent</option>
                                <option value="4">Above Average</option>
                                <option value="3">Satisfactory</option>
                                <option value="2">Needs Improvement</option>
                                <option value="1">Unsatisfactory</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Quality of Work</label>
                            <select class="form-control" name="work_quality" required>
                                <option value="">Select Rating</option>
                                <option value="5">Excellent</option>
                                <option value="4">Above Average</option>
                                <option value="3">Satisfactory</option>
                                <option value="2">Needs Improvement</option>
                                <option value="1">Unsatisfactory</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Initiative & Innovation</label>
                            <select class="form-control" name="initiative" required>
                                <option value="">Select Rating</option>
                                <option value="5">Excellent</option>
                                <option value="4">Above Average</option>
                                <option value="3">Satisfactory</option>
                                <option value="2">Needs Improvement</option>
                                <option value="1">Unsatisfactory</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Communication Skills</label>
                            <select class="form-control" name="communication" required>
                                <option value="">Select Rating</option>
                                <option value="5">Excellent</option>
                                <option value="4">Above Average</option>
                                <option value="3">Satisfactory</option>
                                <option value="2">Needs Improvement</option>
                                <option value="1">Unsatisfactory</option>
                            </select>
                        </div>

                        <div>
                            <label class="form-label">Key Achievements</label>
                            <textarea class="form-control" name="achievements" rows="3" required></textarea>
                        </div>
                        <div>
                            <label class="form-label">Areas for Improvement</label>
                            <textarea class="form-control" name="improvements" rows="3" required></textarea>
                        </div>
                        <div>
                            <label class="form-label">Training Needs</label>
                            <textarea class="form-control" name="training_needs" rows="3"></textarea>
                        </div>
                    </div>

                    <h3 class="text-lg font-medium mt-6 mb-4">Goals and Objectives</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="form-label">Goals for Next Period</label>
                            <textarea class="form-control" name="future_goals" rows="3" required></textarea>
                        </div>
                        <div>
                            <label class="form-label">Development Plan</label>
                            <textarea class="form-control" name="development_plan" rows="3" required></textarea>
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
