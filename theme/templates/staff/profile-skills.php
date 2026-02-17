<?php /* Template Name: Profile: Skills */
?>

<?php
get_header();
$b_link = '/profile';
$b_title = 'Profile';
$p_title = 'Skills';

include get_template_directory() . "/templates/layout/menu.php";
?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <?php include get_template_directory() . "/layout/menu-profile.php"; ?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 box lg:col-span-8 2xl:col-span-9">
        <div class="flex items-center px-5 py-5 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 class="font-medium text-base mr-auto">My Skills</h2>
            <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-skill-modal">
                <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Add Skill
            </button>
        </div>
        <div class="p-5">
            <!-- Skills Categories -->
            <div class="grid grid-cols-12 gap-6">
                <!-- Technical Skills -->
                <div class="col-span-12 2xl:col-span-6">
                    <div class="box p-5">
                        <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                            <div class="font-medium text-base truncate">Technical Skills</div>
                        </div>
                        <div class="mt-5">
                            <?php
                            $technical_skills = array(
                                'Project Management' => 90,
                                'Data Analysis' => 85,
                                'Research' => 95
                            );

                            foreach ($technical_skills as $skill => $proficiency) :
                            ?>
                                <div class="mt-4">
                                    <div class="flex items-center">
                                        <div class="font-medium"><?= $skill ?></div>
                                        <div class="ml-auto"><?= $proficiency ?>%</div>
                                    </div>
                                    <div class="progress h-2 mt-2">
                                        <div class="progress-bar w-[<?= $proficiency ?>%] bg-primary" role="progressbar"></div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <!-- Soft Skills -->
                <div class="col-span-12 2xl:col-span-6">
                    <div class="box p-5">
                        <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                            <div class="font-medium text-base truncate">Soft Skills</div>
                        </div>
                        <div class="mt-5">
                            <?php
                            $soft_skills = array(
                                'Communication' => 95,
                                'Leadership' => 85,
                                'Team Collaboration' => 90
                            );

                            foreach ($soft_skills as $skill => $proficiency) :
                            ?>
                                <div class="mt-4">
                                    <div class="flex items-center">
                                        <div class="font-medium"><?= $skill ?></div>
                                        <div class="ml-auto"><?= $proficiency ?>%</div>
                                    </div>
                                    <div class="progress h-2 mt-2">
                                        <div class="progress-bar w-[<?= $proficiency ?>%] bg-success" role="progressbar"></div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <!-- Certifications -->
                <div class="col-span-12">
                    <div class="box p-5">
                        <div class="flex items-center border-b border-slate-200/60 dark:border-darkmode-400 pb-5">
                            <div class="font-medium text-base truncate">Certifications & Training</div>
                        </div>
                        <div class="mt-5">
                            <div class="flex flex-col sm:flex-row items-center pb-5 border-b border-slate-200/60 dark:border-darkmode-400">
                                <div>
                                    <div class="font-medium">Project Management Professional (PMP)</div>
                                    <div class="text-slate-500 mt-1">Project Management Institute</div>
                                    <div class="text-slate-500 mt-1">Issued: January 2024 • Expires: January 2027</div>
                                </div>
                                <div class="sm:ml-auto mt-3 sm:mt-0">
                                    <button class="btn btn-secondary w-24">View</button>
                                </div>
                            </div>
                            <div class="flex flex-col sm:flex-row items-center pb-5 pt-5">
                                <div>
                                    <div class="font-medium">Agile Certified Practitioner</div>
                                    <div class="text-slate-500 mt-1">Scrum Alliance</div>
                                    <div class="text-slate-500 mt-1">Issued: March 2024 • Expires: March 2026</div>
                                </div>
                                <div class="sm:ml-auto mt-3 sm:mt-0">
                                    <button class="btn btn-secondary w-24">View</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- BEGIN: Add Skill Modal -->
<div id="add-skill-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add New Skill</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4 gap-y-3">
                <div class="col-span-12">
                    <label for="skill-category" class="form-label">Skill Category</label>
                    <select id="skill-category" class="form-select">
                        <option value="technical">Technical Skill</option>
                        <option value="soft">Soft Skill</option>
                    </select>
                </div>
                <div class="col-span-12">
                    <label for="skill-name" class="form-label">Skill Name</label>
                    <input id="skill-name" type="text" class="form-control" placeholder="Enter skill name">
                </div>
                <div class="col-span-12">
                    <label for="proficiency" class="form-label">Proficiency Level</label>
                    <input id="proficiency" type="range" class="form-range" min="0" max="100" step="5">
                    <div class="text-center mt-2" id="proficiency-value">50%</div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>
<!-- END: Add Skill Modal -->

<?php get_footer(); ?>
