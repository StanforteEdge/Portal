<?php
/* Template Name: Documents: Strategic */

get_header();
$b_link = '/documents';
$b_title = 'Documents';
$p_title = 'Strategic Documents';

include get_template_directory() . "/templates/layout/menu.php";
?>
<div class="content">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">Strategic Documents</h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
            <button class="btn btn-primary shadow-md mr-2">Upload Strategic Document</button>
        </div>
    </div>
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Sample Strategic Documents -->
        <div class="intro-y col-span-12">
            <div class="box">
                <div class="p-5">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="whitespace-nowrap">Document Name</th>
                                <th class="whitespace-nowrap">Type</th>
                                <th class="whitespace-nowrap">Last Updated</th>
                                <th class="whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>5-Year Strategic Plan</td>
                                <td>Planning</td>
                                <td>Dec 15, 2024</td>
                                <td>
                                    <div class="flex">
                                        <button class="btn btn-primary btn-sm mr-2">View</button>
                                        <button class="btn btn-secondary btn-sm">Download</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Market Analysis 2024</td>
                                <td>Research</td>
                                <td>Dec 14, 2024</td>
                                <td>
                                    <div class="flex">
                                        <button class="btn btn-primary btn-sm mr-2">View</button>
                                        <button class="btn btn-secondary btn-sm">Download</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Growth Strategy</td>
                                <td>Planning</td>
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
