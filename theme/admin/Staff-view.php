<?php /* Template Name: Admin: Staff - View */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = 'Profile';
$id = $_GET['id'];

include get_template_directory() . "/layout/menu.php";

// $notification = $wpdb->get_row("SELECT * FROM staff_jet_cct_notifications a WHERE a.priority = 1 AND $staff->_ID IN (a.assign) ");
$viewstaff = $wpdb->get_row("SELECT * FROM staff_jet_cct_profiles a 
INNER JOIN staff_jet_cct_job_descriptions b ON b._ID = a.role
WHERE a._ID = $id");

$staffTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_staff_types");
$teams = $wpdb->get_results("SELECT * FROM staff_jet_cct_teams");

?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <?php include get_template_directory() . "/layout/menu-admin-staff.php";?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="tab-content">
            <div id="overview-tab" class="tab-pane box leading-relaxed active p-5" role="tabpanel" aria-labelledby="overview">
                    <div class="flex flex-col lg:flex-row border-b border-slate-200/60 dark:border-darkmode-400 pb-5 -mx-5">
                        <div class="flex flex-1 px-5 items-center justify-center lg:justify-start">
                            <div class="w-20 h-20 sm:w-24 sm:h-24 flex-none lg:w-32 lg:h-32 image-fit relative">
                                <img alt="Midone - HTML Admin Template" class="rounded-full" src="<?= $viewstaff->pic;?>">
                            </div>
                            <div class="ml-5">
                                <div class="w-24 sm:w-40 truncate sm:whitespace-normal font-medium text-lg"><?= $viewstaff->first_name . ' ' . $viewstaff->last_name;?></div>
                                <div class="text-slate-500"><?= $viewstaff->position;?></div>
                            </div>
                        </div>
                        <div class="mt-6 lg:mt-0 flex-1 px-5 border-l border-r border-slate-200/60 dark:border-darkmode-400 border-t lg:border-t-0 pt-5 lg:pt-0">
                            <div class="font-medium text-center lg:text-left lg:mt-3">Contact Details</div>
                            <div class="flex flex-col justify-center items-center lg:items-start mt-4">
                                <div class="truncate sm:whitespace-normal flex items-center"> <i data-lucide="mail" class="w-4 h-4 mr-2"></i> <?= $viewstaff->email;?></div>
                                <div class="truncate sm:whitespace-normal flex items-center mt-3"> <i data-lucide="instagram" class="w-4 h-4 mr-2"></i> <?= $viewstaff->phone;?></div>
                                <div class="truncate sm:whitespace-normal flex items-center mt-3"> <i data-lucide="twitter" class="w-4 h-4 mr-2"></i> Twitter Johnny Depp </div>
                            </div>
                        </div>
                        <div class="mt-6 lg:mt-0 flex-1 hidden flex items-center justify-center px-5 border-t lg:border-0 border-slate-200/60 dark:border-darkmode-400 pt-5 lg:pt-0">
                            <div class="text-center rounded-md w-20 py-3">
                                <div class="font-medium text-primary text-xl">201</div>
                                <div class="text-slate-500">Orders</div>
                            </div>
                            <div class="text-center rounded-md w-20 py-3">
                                <div class="font-medium text-primary text-xl">1k</div>
                                <div class="text-slate-500">Purchases</div>
                            </div>
                            <div class="text-center rounded-md w-20 py-3">
                                <div class="font-medium text-primary text-xl">492</div>
                                <div class="text-slate-500">Reviews</div>
                            </div>
                        </div>
                    </div>
            </div>
            <div id="bio-tab" class="tab-pane  box leading-relaxed" role="tabpanel" aria-labelledby="bio">
                <div class="flex items-center px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
                    <h2 class="font-medium text-base mr-auto">Personal Information</h2>
                </div>
                <div class="p-5">
                    <form method="post">
                        <div class="grid grid-cols-12 gap-6 mt-5">
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>First Name</label>
                                <input type="text" name="first_name" placeholder="First Name" class="form-control" value="<?php echo $viewstaff->first_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Middle Name</label>
                                <input type="text" name="middle_name" placeholder="Middle Name" class="form-control" value="<?php echo $viewstaff->middle_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Last Name</label>
                                <input type="text" name="last_name" placeholder="Last Name" class="form-control" value="<?php echo $viewstaff->last_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Phone</label>
                                <input type="tel" name="phone" placeholder="Phone" class="form-control" value="<?php echo $viewstaff->phone; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Whatsapp</label>
                                <input type="tel" name="whatsapp" placeholder="Whatsapp" class="form-control" value="<?php echo $viewstaff->whatsapp; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Email</label>
                                <input type="email" name="email" placeholder="Email" class="form-control" value="<?php echo $viewstaff->email; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Date of Birth</label>
                                <input type="date" name="date_of_birth" placeholder="Date of Birth" class="form-control" value="<?php echo $viewstaff->date_of_birth; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Sex</label>
                                <select class="form-control" name="sex" value="">
                                    <option value="<?php echo $viewstaff->sex; ?>" selected disabled><?php echo $viewstaff->sex; ?></option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                            </div>
                            <div class="form-group col-span-12">
                                <label>Address</label>
                                <textarea placeholder="Address" name="address" class="form-control"><?php echo $viewstaff->address; ?></textarea>
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>City</label>
                                <input type="text" placeholder="City" name="city" class="form-control" value="<?php echo $viewstaff->city; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>State</label>
                                <select name="state" class="form-select" required>
                                    <option value="<?= $viewstaff->state ?>" selected><?= $viewstaff->state ?></option>
                                    <?php 
                                    $states = array('Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara');
                                    foreach($states as $state): 
                                        if($state !== $viewstaff->state):
                                    ?>
                                        <option value="<?= $state ?>"><?= $state ?></option>
                                    <?php 
                                        endif;
                                    endforeach; 
                                    ?>
                                </select>
                            </div>
                            <div class="form-group col-span-12 md:col-span-6">
                                <label>LGA</label>
                                <input type="text" name="lga" class="form-control" value="<?= $viewstaff->lga ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6">
                                <label>Education Level</label>
                                <select name="education" class="form-select" required>
                                    <option value="<?= $viewstaff->education ?>" selected><?= $viewstaff->education ?></option>
                                    <?php 
                                    $education_levels = array('High School', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other');
                                    foreach($education_levels as $level): 
                                        if($level !== $viewstaff->education):
                                    ?>
                                        <option value="<?= $level ?>"><?= $level ?></option>
                                    <?php 
                                        endif;
                                    endforeach; 
                                    ?>
                                </select>
                            </div>
                            <div class="form-group col-span-12 md:col-span-6">
                                <label>Employment Date</label>
                                <input type="text" name="employment_date" class="datepicker form-control" value="<?= $viewstaff->employment_date ?>">
                            </div>
                            <div class="form-group col-span-12">
                                <label>Skills & Expertise</label>
                                <textarea name="skills" class="form-control" rows="3"><?= $viewstaff->skills ?></textarea>
                            </div>
                            <div class="form-group col-span-12">
                                <label>Brief Bio</label>
                                <textarea name="bio" class="form-control" rows="3"><?= $viewstaff->bio ?></textarea>
                            </div>
                        </div>
                        <div class="flex justify-end mt-4">
                            <button type="submit" name="update_staff" class="btn btn-primary w-24">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
            <div id="jd-tab" class="tab-pane box leading-relaxed" role="tabpanel" aria-labelledby="jd">
                <div class="flex items-center px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
                    <h2 class="font-medium text-base mr-auto">Job Description</h2>
                </div>
                <div class="p-5">
                    <form method="post">
                        <div class="grid grid-cols-12 gap-6">
                            <div class="form-group col-span-12 md:col-span-6">
                                <label>Staff Type</label>
                                <select name="staff_type" class="form-select" required>
                                    <option value="<?= $viewstaff->staff_type_id ?>" selected><?= $viewstaff->staff_type ?></option>
                                    <?php foreach ($staffTypes as $type): 
                                        if($type->_ID !== $viewstaff->staff_type_id):
                                    ?>
                                        <option value="<?= $type->_ID ?>"><?= $type->name ?></option>
                                    <?php 
                                        endif;
                                    endforeach; ?>
                                </select>
                            </div>
                            <div class="form-group col-span-12 md:col-span-6">
                                <label>Team</label>
                                <select name="team" class="form-select" required>
                                    <option value="<?= $viewstaff->team_id ?>" selected><?= $viewstaff->team ?></option>
                                    <?php foreach ($teams as $team): 
                                        if($team->_ID !== $viewstaff->team_id):
                                    ?>
                                        <option value="<?= $team->_ID ?>"><?= $team->name ?></option>
                                    <?php 
                                        endif;
                                    endforeach; ?>
                                </select>
                            </div>
                            <div class="form-group col-span-12">
                                <label>Role Description</label>
                                <textarea name="role_description" class="form-control" rows="4"><?= $viewstaff->role_description ?></textarea>
                            </div>
                            <div class="form-group col-span-12">
                                <label>Key Responsibilities</label>
                                <textarea name="responsibilities" class="form-control" rows="4"><?= $viewstaff->responsibilities ?></textarea>
                            </div>
                        </div>
                        <div class="flex justify-end mt-4">
                            <button type="submit" name="update_job" class="btn btn-primary w-24">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>