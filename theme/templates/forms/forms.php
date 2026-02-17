<?php /* Template Name: Staff Forms */ ?>

<?php
get_header();
$b_link = '/forms';
$b_title = 'Forms';
$p_title = 'Staff Forms';

include get_template_directory() . "/layout/menu.php";
?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Staff Forms
    </h2>
</div>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- Exit Interview Form Card -->
    <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
        <div class="box">
            <div class="flex items-start px-5 pt-5">
                <div class="w-full flex flex-col lg:flex-row items-center">
                    <div class="w-16 h-16 image-fit">
                        <i data-feather="file-text" class="w-full h-full text-primary"></i>
                    </div>
                    <div class="lg:ml-4 text-center lg:text-left mt-3 lg:mt-0">
                        <a href="<?php echo home_url('/staff/form-exit-interview'); ?>" class="font-medium">Exit Interview</a>
                        <div class="text-slate-500 text-xs mt-0.5">Employee Exit Documentation</div>
                    </div>
                </div>
            </div>
            <div class="text-center lg:text-left p-5">
                <div class="text-slate-600 text-xs">
                    Complete this form during the exit interview process to gather feedback and insights from departing employees.
                </div>
                <div class="flex items-center justify-center lg:justify-start mt-5">
                    <a href="<?php echo home_url('/staff/form-exit-interview'); ?>" class="btn btn-primary">Access Form</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Incident Response Form Card -->
    <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
        <div class="box">
            <div class="flex items-start px-5 pt-5">
                <div class="w-full flex flex-col lg:flex-row items-center">
                    <div class="w-16 h-16 image-fit">
                        <i data-feather="alert-triangle" class="w-full h-full text-primary"></i>
                    </div>
                    <div class="lg:ml-4 text-center lg:text-left mt-3 lg:mt-0">
                        <a href="<?php echo home_url('/staff/form-incident-response'); ?>" class="font-medium">Incident Response</a>
                        <div class="text-slate-500 text-xs mt-0.5">Incident Documentation & Response</div>
                    </div>
                </div>
            </div>
            <div class="text-center lg:text-left p-5">
                <div class="text-slate-600 text-xs">
                    Use this form to report and document any workplace incidents, safety concerns, or security issues.
                </div>
                <div class="flex items-center justify-center lg:justify-start mt-5">
                    <a href="<?php echo home_url('/staff/form-incident-response'); ?>" class="btn btn-primary">Access Form</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Staff Appraisal Form Card -->
    <div class="intro-y col-span-12 md:col-span-6 lg:col-span-4">
        <div class="box">
            <div class="flex items-start px-5 pt-5">
                <div class="w-full flex flex-col lg:flex-row items-center">
                    <div class="w-16 h-16 image-fit">
                        <i data-feather="user-check" class="w-full h-full text-primary"></i>
                    </div>
                    <div class="lg:ml-4 text-center lg:text-left mt-3 lg:mt-0">
                        <a href="<?php echo home_url('/staff/form-staff-appraisal'); ?>" class="font-medium">Staff Appraisal</a>
                        <div class="text-slate-500 text-xs mt-0.5">Performance Evaluation</div>
                    </div>
                </div>
            </div>
            <div class="text-center lg:text-left p-5">
                <div class="text-slate-600 text-xs">
                    Annual performance evaluation form for assessing employee achievements, goals, and development needs.
                </div>
                <div class="flex items-center justify-center lg:justify-start mt-5">
                    <a href="<?php echo home_url('/staff/form-staff-appraisal'); ?>" class="btn btn-primary">Access Form</a>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // // Initialize Feather Icons
    // document.addEventListener("DOMContentLoaded", function() {
    //     if(typeof feather !== 'undefined') {
    //         feather.replace();
    //     }
    // });
</script>

<?php get_footer(); ?>
