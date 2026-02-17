<?php
/* Template Name: Documents: Board Reports */

get_header();
$b_link = '/documents';
$b_title = 'Documents';
$p_title = 'Board Reports';

include get_template_directory() . "/templates/layout/menu.php";
?>
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Board Reports</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <button class="btn btn-primary shadow-md mr-2">Upload Board Report</button>
        </div>
    </div>
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Sample Board Reports -->
        <div class="intro-y col-span-12">
            <div class="box">
                <div class="p-5">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Report Name</th>
                                <th class="whitespace-nowrap">Meeting Date</th>
                                <th class="whitespace-nowrap">Last Updated</th>
                                <th class="whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Q4 2024 Board Meeting</td>
                                <td>Dec 20, 2024</td>
                                <td>Dec 15, 2024</td>
                                <td>
                                    <div class="flex">
                                        <button class="btn btn-primary btn-sm mr-2">View</button>
                                        <button class="btn btn-secondary btn-sm">Download</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Q3 2024 Board Meeting</td>
                                <td>Sep 15, 2024</td>
                                <td>Sep 10, 2024</td>
                                <td>
                                    <div class="flex">
                                        <button class="btn btn-primary btn-sm mr-2">View</button>
                                        <button class="btn btn-secondary btn-sm">Download</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Annual Board Review 2024</td>
                                <td>Dec 1, 2024</td>
                                <td>Nov 25, 2024</td>
                                <td>
                                    <div class="flex">
                                        <button class="btn btn-primary btn-sm mr-2">View</button>
                                        <button class="btn btn-secondary btn-sm">Download</button>
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
<?php get_footer(); ?>
