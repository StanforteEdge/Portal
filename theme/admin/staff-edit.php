<?php /* Template Name:  Admin: Staff - Edit */
?>

<?php
get_header();
$b_link = '/admin/staffs';
$b_title = 'All Staff';
$p_title = 'Edit Staff';
$id = $_GET['id'];

include get_template_directory() . "/layout/menu.php";

$staffTypes = $wpdb->get_results("SELECT * FROM staff_jet_cct_staff_types");
$teams = $wpdb->get_results("SELECT * FROM staff_jet_cct_teams");
$staff = $wpdb->get_row("SELECT * FROM staff_jet_cct_profiles a 
INNER JOIN staff_jet_cct_job_descriptions b ON b._ID = a.role
WHERE a._ID = $id");

if (isset($_POST['update_staff'])) {
    $first_name = $_POST['first_name'];
    $last_name = $_POST['last_name'];
    $middle_name = $_POST['middle_name'];
    $email = $_POST['email'];
    $personal_email = $_POST['personal_email'];
    $phone = $_POST['phone'];
    $phone_2 = $_POST['phone_2'];
    $sex = $_POST['sex'];
    $dob = $_POST['dob'];
    $address = $_POST['address'];
    $state = $_POST['state'];
    $lga = $_POST['lga'];
    $education = $_POST['education'];
    $employment_date = $_POST['employment_date'];
    $skills = $_POST['skills'];
    $bio = $_POST['bio'];

    $update = $wpdb->update(
        'staff_jet_cct_profiles',
        array(
            'first_name' => $first_name,
            'last_name' => $last_name,
            'middle_name' => $middle_name,
            'email' => $email,
            'personal_email' => $personal_email,
            'phone' => $phone,
            'phone_2' => $phone_2,
            'sex' => $sex,
            'dob' => $dob,
            'address' => $address,
            'state' => $state,
            'lga' => $lga,
            'education' => $education,
            'employment_date' => $employment_date,
            'skills' => $skills,
            'bio' => $bio
        ),
        array('_ID' => $id)
    );

    if ($update) {
        $success = "Staff information updated successfully";
    } else {
        $error = "Error updating staff information";
    }
}

if (isset($_POST['update_job'])) {
    $staff_type = $_POST['staff_type'];
    $team = $_POST['team'];
    $role_description = $_POST['role_description'];
    $responsibilities = $_POST['responsibilities'];

    $update = $wpdb->update(
        'staff_jet_cct_job_descriptions',
        array(
            'staff_type' => $staff_type,
            'team' => $team,
            'role_description' => $role_description,
            'responsibilities' => $responsibilities
        ),
        array('_ID' => $staff->role)
    );

    if ($update) {
        $success = "Job information updated successfully";
    } else {
        $error = "Error updating job information";
    }
}
?>

<div class="intro-y flex items-center mt-8">
    <h2 class="text-lg font-medium mr-auto">
        Edit Staff - <?= $staff->first_name . ' ' . $staff->last_name ?>
    </h2>
</div>

<div class="grid grid-cols-12 gap-6 mt-5">
    <div class="intro-y col-span-12 lg:col-span-6">
        <!-- BEGIN: Personal Information -->
        <div class="intro-y box">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Personal Information</h2>
            </div>
            <div class="p-5">
                <?php if (isset($success)): ?>
                    <div class="alert alert-success alert-dismissible show flex items-center mb-2" role="alert">
                        <i data-lucide="alert-circle" class="w-6 h-6 mr-2"></i> <?= $success ?>
                        <button type="button" class="btn-close" data-tw-dismiss="alert" aria-label="Close">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                <?php endif; ?>
                <?php if (isset($error)): ?>
                    <div class="alert alert-danger alert-dismissible show flex items-center mb-2" role="alert">
                        <i data-lucide="alert-octagon" class="w-6 h-6 mr-2"></i> <?= $error ?>
                        <button type="button" class="btn-close" data-tw-dismiss="alert" aria-label="Close">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                <?php endif; ?>
                <form method="post">
                    <div class="grid grid-cols-12 gap-x-5">
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mt-3">
                                <label for="first_name" class="form-label">First Name</label>
                                <input id="first_name" type="text" name="first_name" class="form-control" value="<?= $staff->first_name ?>" required>
                            </div>
                            <div class="mt-3">
                                <label for="middle_name" class="form-label">Middle Name</label>
                                <input id="middle_name" type="text" name="middle_name" class="form-control" value="<?= $staff->middle_name ?>">
                            </div>
                            <div class="mt-3">
                                <label for="last_name" class="form-label">Last Name</label>
                                <input id="last_name" type="text" name="last_name" class="form-control" value="<?= $staff->last_name ?>" required>
                            </div>
                        </div>
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mt-3">
                                <label for="email" class="form-label">Official Email</label>
                                <input id="email" type="email" name="email" class="form-control" value="<?= $staff->email ?>" required>
                            </div>
                            <div class="mt-3">
                                <label for="personal_email" class="form-label">Personal Email</label>
                                <input id="personal_email" type="email" name="personal_email" class="form-control" value="<?= $staff->personal_email ?>">
                            </div>
                            <div class="mt-3">
                                <label for="phone" class="form-label">Phone</label>
                                <input id="phone" type="tel" name="phone" class="form-control" value="<?= $staff->phone ?>" required>
                            </div>
                        </div>
                        <div class="col-span-12">
                            <div class="mt-3">
                                <label for="address" class="form-label">Address</label>
                                <textarea id="address" name="address" class="form-control" rows="3"><?= $staff->address ?></textarea>
                            </div>
                        </div>
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mt-3">
                                <label for="state" class="form-label">State</label>
                                <select id="state" name="state" class="form-select" required>
                                    <option value="<?= $staff->state ?>" selected><?= $staff->state ?></option>
                                    <?php 
                                    $states = array('Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara');
                                    foreach($states as $state): 
                                        if($state !== $staff->state):
                                    ?>
                                        <option value="<?= $state ?>"><?= $state ?></option>
                                    <?php 
                                        endif;
                                    endforeach; 
                                    ?>
                                </select>
                            </div>
                            <div class="mt-3">
                                <label for="lga" class="form-label">LGA</label>
                                <input id="lga" type="text" name="lga" class="form-control" value="<?= $staff->lga ?>">
                            </div>
                        </div>
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mt-3">
                                <label for="education" class="form-label">Education Level</label>
                                <select id="education" name="education" class="form-select" required>
                                    <option value="<?= $staff->education ?>" selected><?= $staff->education ?></option>
                                    <?php 
                                    $education_levels = array('High School', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other');
                                    foreach($education_levels as $level): 
                                        if($level !== $staff->education):
                                    ?>
                                        <option value="<?= $level ?>"><?= $level ?></option>
                                    <?php 
                                        endif;
                                    endforeach; 
                                    ?>
                                </select>
                            </div>
                            <div class="mt-3">
                                <label for="employment_date" class="form-label">Employment Date</label>
                                <input id="employment_date" type="text" name="employment_date" class="datepicker form-control" value="<?= $staff->employment_date ?>" required>
                            </div>
                        </div>
                        <div class="col-span-12">
                            <div class="mt-3">
                                <label for="skills" class="form-label">Skills & Expertise</label>
                                <textarea id="skills" name="skills" class="form-control" rows="3"><?= $staff->skills ?></textarea>
                            </div>
                        </div>
                        <div class="col-span-12">
                            <div class="mt-3">
                                <label for="bio" class="form-label">Brief Bio</label>
                                <textarea id="bio" name="bio" class="form-control" rows="3"><?= $staff->bio ?></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button type="submit" name="update_staff" class="btn btn-primary w-24">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
        <!-- END: Personal Information -->
    </div>
    <div class="intro-y col-span-12 lg:col-span-6">
        <!-- BEGIN: Job Information -->
        <div class="intro-y box">
            <div class="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
                <h2 class="font-medium text-base mr-auto">Job Information</h2>
            </div>
            <div class="p-5">
                <form method="post">
                    <div class="grid grid-cols-12 gap-x-5">
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mt-3">
                                <label for="staff_type" class="form-label">Staff Type</label>
                                <select id="staff_type" name="staff_type" class="form-select" required>
                                    <option value="<?= $staff->staff_type_id ?>" selected><?= $staff->staff_type ?></option>
                                    <?php foreach ($staffTypes as $type): 
                                        if($type->_ID !== $staff->staff_type_id):
                                    ?>
                                        <option value="<?= $type->_ID ?>"><?= $type->name ?></option>
                                    <?php 
                                        endif;
                                    endforeach; ?>
                                </select>
                            </div>
                        </div>
                        <div class="col-span-12 xl:col-span-6">
                            <div class="mt-3">
                                <label for="team" class="form-label">Team</label>
                                <select id="team" name="team" class="form-select" required>
                                    <option value="<?= $staff->team_id ?>" selected><?= $staff->team ?></option>
                                    <?php foreach ($teams as $team): 
                                        if($team->_ID !== $staff->team_id):
                                    ?>
                                        <option value="<?= $team->_ID ?>"><?= $team->name ?></option>
                                    <?php 
                                        endif;
                                    endforeach; ?>
                                </select>
                            </div>
                        </div>
                        <div class="col-span-12">
                            <div class="mt-3">
                                <label for="role_description" class="form-label">Role Description</label>
                                <textarea id="role_description" name="role_description" class="form-control" rows="4"><?= $staff->role_description ?></textarea>
                            </div>
                        </div>
                        <div class="col-span-12">
                            <div class="mt-3">
                                <label for="responsibilities" class="form-label">Key Responsibilities</label>
                                <textarea id="responsibilities" name="responsibilities" class="form-control" rows="4"><?= $staff->responsibilities ?></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button type="submit" name="update_job" class="btn btn-primary w-24">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
        <!-- END: Job Information -->
    </div>
</div>

<?php get_footer(); ?>
