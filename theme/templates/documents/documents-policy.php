<?php
/* Template Name: Documents: Policy */

get_header();
$b_link = '/documents';
$b_title = 'Documents';
$p_title = 'Policy Documents';

include get_template_directory() . "/templates/layout/menu.php";
?>
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Policy Documents</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <button class="btn btn-primary shadow-md mr-2">Upload New Policy</button>
        </div>
    </div>
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Sample Policy Documents -->
        <div class="intro-y col-span-12">
            <div class="box">
                <div class="p-5">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Document Name</th>
                                <th class="whitespace-nowrap">Category</th>
                                <th class="whitespace-nowrap">Last Updated</th>
                                <th class="whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Employee Handbook 2024</td>
                                <td>HR Policy</td>
                                <td>Dec 15, 2024</td>
                                <td>
                                    <div class="flex">
                                        <button class="btn btn-primary btn-sm mr-2">View</button>
                                        <button class="btn btn-secondary btn-sm">Download</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>IT Security Policy</td>
                                <td>IT Policy</td>
                                <td>Dec 14, 2024</td>
                                <td>
                                    <div class="flex">
                                        <button class="btn btn-primary btn-sm mr-2">View</button>
                                        <button class="btn btn-secondary btn-sm">Download</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Travel & Expense Policy</td>
                                <td>Finance Policy</td>
                                <td>Dec 13, 2024</td>
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
