<?php /* Template Name: Staff: Settings */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = 'Settings';

include get_template_directory() . "/layout/menu.php";

$notification = $wpdb->get_row("SELECT * FROM staff_jet_cct_notifications a WHERE a.priority = 1 AND $staff->_ID IN (a.assign) ");


?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
<?php include get_template_directory() . "/layout/profile-menu.php";?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="tab-content">
            <div id="overview-tab" class="tab-pane box leading-relaxed active p-5" role="tabpanel" aria-labelledby="overview">
                    <div class="flex flex-col lg:flex-row border-b border-slate-200/60 dark:border-darkmode-400 pb-5 -mx-5">
                        <div class="flex flex-1 px-5 items-center justify-center lg:justify-start">
                            <div class="w-20 h-20 sm:w-24 sm:h-24 flex-none lg:w-32 lg:h-32 image-fit relative">
                                <img alt="Midone - HTML Admin Template" class="rounded-full" src="<?= $staff->profile_pic;?>">
                            </div>
                            <div class="ml-5">
                                <div class="w-24 sm:w-40 truncate sm:whitespace-normal font-medium text-lg"><?= $staff->first_name . ' ' . $staff->last_name;?></div>
                                <div class="text-slate-500"><?= $staff->position;?></div>
                            </div>
                        </div>
                        <div class="mt-6 lg:mt-0 flex-1 px-5 border-l border-r border-slate-200/60 dark:border-darkmode-400 border-t lg:border-t-0 pt-5 lg:pt-0">
                            <div class="font-medium text-center lg:text-left lg:mt-3">Contact Details</div>
                            <div class="flex flex-col justify-center items-center lg:items-start mt-4">
                                <div class="truncate sm:whitespace-normal flex items-center"> <i data-lucide="mail" class="w-4 h-4 mr-2"></i> <?= $staff->email;?></div>
                                <div class="truncate sm:whitespace-normal flex items-center mt-3"> <i data-lucide="instagram" class="w-4 h-4 mr-2"></i> <?= $staff->phone;?></div>
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
                                <input type="text" name="first_name" placeholder="First Name" class="form-control" value="<?php echo $staff->first_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Middle Name</label>
                                <input type="text" name="middle_name" placeholder="Middle Name" class="form-control" value="<?php echo $staff->middle_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Last Name</label>
                                <input type="text" name="last_name" placeholder="Last Name" class="form-control" value="<?php echo $staff->last_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Phone</label>
                                <input type="tel" name="phone" placeholder="Phone" class="form-control" value="<?php echo $staff->phone; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Whatsapp</label>
                                <input type="tel" name="whatsapp" placeholder="Whatsapp" class="form-control" value="<?php echo $staff->whatsapp; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Email</label>
                                <input type="email" name="email" placeholder="Email" class="form-control" value="<?php echo $staff->email; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Date of Birth</label>
                                <input type="date" name="date_of_birth" placeholder="Date of Birth" class="form-control" value="<?php echo $staff->date_of_birth; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Sex</label>
                                <select class="form-control" name="sex" value="">
                                    <option value="<?php echo $staff->sex; ?>" selected disabled><?php echo $staff->sex; ?></option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                            </div>
                            <div class="form-group col-span-12">
                                <label>Address</label>
                                <textarea placeholder="Address" name="address" class="form-control"><?php echo $staff->address; ?></textarea>
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>City</label>
                                <input type="text" placeholder="City" name="city" class="form-control" value="<?php echo $staff->city; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>State</label>
                                <select placeholder="State" name="state" class="form-select">
                                    <option value="<?php echo $staff->state; ?>" selected disabled><?php echo $staff->state; ?></option>
                                    <option value='Abia'>Abia</option>
                                    <option value='Adamawa'>Adamawa</option>
                                    <option value='Akwa Ibom'>Akwa Ibom</option>
                                    <option value='Anambra'>Anambra</option>
                                    <option value='Bauchi'>Bauchi</option>
                                    <option value='Bayelsa'>Bayelsa</option>
                                    <option value='Benue'>Benue</option>
                                    <option value='Borno'>Borno</option>
                                    <option value='Cross River'>Cross River</option>
                                    <option value='Delta'>Delta</option>
                                    <option value='Ebonyi'>Ebonyi</option>
                                    <option value='Edo'>Edo</option>
                                    <option value='Ekiti'>Ekiti</option>
                                    <option value='Enugu'>Enugu</option>
                                    <option value='FCT'>Federal Capital Territory</option>
                                    <option value='Gombe'>Gombe</option>
                                    <option value='Imo'>Imo</option>
                                    <option value='Jigawa'>Jigawa</option>
                                    <option value='Kaduna'>Kaduna</option>
                                    <option value='Kano'>Kano</option>
                                    <option value='Katsina'>Katsina</option>
                                    <option value='Kebbi'>Kebbi</option>
                                    <option value='Kogi'>Kogi</option>
                                    <option value='Kwara'>Kwara</option>
                                    <option value='Lagos'>Lagos</option>
                                    <option value='Nasarawa'>Nasarawa</option>
                                    <option value='Niger'>Niger</option>
                                    <option value='Ogun'>Ogun</option>
                                    <option value='Ondo'>Ondo</option>
                                    <option value='Osun'>Osun</option>
                                    <option value='Oyo'>Oyo</option>
                                    <option value='Plateau'>Plateau</option>
                                    <option value='Rivers'>Rivers</option>
                                    <option value='Sokoto'>Sokoto</option>
                                    <option value='Taraba'>Taraba</option>
                                    <option value='Yobe'>Yobe</option>
                                    <option value='Zamfara'>Zamfara</option>
                                </select>
                            </div>

                            <div class="col-span-12 md:col-span-6 ">

                                <button class="btn btn-primary w-auto" type="submit" name="update">Update</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div id="jd-tab" class="tab-pane  box leading-relaxed" role="tabpanel" aria-labelledby="jd">
            <div class="flex items-center px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
                    <h2 class="font-medium text-base mr-auto">Job Description</h2>
                </div>
                <div class="p-5">
                    <?php if ($jd) : ?>
                        <span>
                            <?= $jd->content; ?>
                        </span>
                    <?php else : ?>
                        No Job Description is Specified.
                    <?php endif; ?>
                </div>

            </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>