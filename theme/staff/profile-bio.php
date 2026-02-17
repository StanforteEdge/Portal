<?php /* Template Name: Staff: Bio */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = 'Profile';

include get_template_directory() . "/layout/menu.php";

$notification = $wpdb->get_row("SELECT * FROM staff_jet_cct_notifications a WHERE a.priority = 1 AND $staff->_ID IN (a.assign) ");
$contacts = $wpdb->get_results("SELECT * FROM staff_jet_cct_contacts a INNER JOIN staff_jet_cct_profiles b ON b._ID = a.user WHERE a.user = $staff->_ID");

if (isset($_POST['update'])) {
    global $wpdb;
    $tablename = 'staff_jet_cct_profiles';
    $bio = array(
        'first_name' => $_POST['first_name'],
        'middle_name' => $_POST['middle_name'],
        'last_name' => $_POST['last_name'],
        'phone' => $_POST['phone'],
        'phone_2' => $_POST['phone_2'],
        'personal_email' => $_POST['personal_email'],
        'dob' => $_POST['dob'],
        'sex' => $_POST['sex'],
        'address' => $_POST['address'],
        'city' => $_POST['city'],
        'state' => $_POST['state'],
        'bio' => $_POST['bio'],
        'marital' => $_POST['marital'],
        'nationality' => $_POST['nationality'],
        'religion' => $_POST['religion'],
        'languages' => $_POST['languages'],
    );

    // Perform the update
    $update = $wpdb->update($tablename, $bio, array('user_id' => $user_id));
    if ($update !== false) {
        echo "<script>alert('Profile is update')</script>";
        echo "<script>window.location.href = '" . $_SERVER['REQUEST_URI'] . "';</script>";
        exit; // Stop further execution

    } else {
        echo "<script>alert('Something went wrong $staff->_ID')</script>";
    }
}

if (isset($_POST['upload'])) {
    $pic = $_FILES['pic'];
    $cover = $_FILES['cover'];
    if (!empty($pic['name'])) {
        // Get the uploaded file information
        $file_name = $pic['name'];
        $file_size = $pic['size'];
        $file_tmp = $pic['tmp_name'];
        $file_type = $pic['type'];
        $file_ext = strtolower(end(explode('.', $pic['name'])));

        // Check if the file type is valid
        $valid_extensions = array("jpg", "jpeg", "png");
        if (in_array($file_ext, $valid_extensions) === false) {
            echo 'Error: Invalid file extension. Allowed extensions: jpg, jpeg, png.';
            exit();
        }

        // Check if the file size is valid (less than 2MB)
        if ($file_size > 2097152) {
            echo 'Error: File size must be less than 2MB.';
            exit();
        }

        // Generate a unique name for the uploaded file
        $new_file_name = uniqid() . '.' . $file_ext;

        // Upload the file to the WordPress media library
        $upload_dir = wp_upload_dir();
        $upload_path = $upload_dir['path'] . '/' . $new_file_name;
        move_uploaded_file($file_tmp, $upload_path);

        // Save the URL of the uploaded file to a custom table
        global $wpdb;
        $table_name = $wpdb->prefix . "jet_cct_profiles";
        $wpdb->update(
            $table_name,
            array('pic' => $upload_dir['url'] . '/' . $new_file_name),
            array('user_id' => $user_id)
        );
    }

    if (!empty($cover['name'])) {
        // Get the uploaded file information
        $file_name = $cover['name'];
        $file_size = $cover['size'];
        $file_tmp = $cover['tmp_name'];
        $file_type = $cover['type'];
        $file_ext = strtolower(end(explode('.', $cover['name'])));

        // Check if the file type is valid
        $valid_extensions = array("jpg", "jpeg", "png");
        if (in_array($file_ext, $valid_extensions) === false) {
            echo 'Error: Invalid file extension. Allowed extensions: jpg, jpeg, png.';
            exit();
        }

        // Check if the file size is valid (less than 2MB)
        if ($file_size > 2097152) {
            echo 'Error: File size must be less than 2MB.';
            exit();
        }

        // Generate a unique name for the uploaded file
        $new_file_name = uniqid() . '.' . $file_ext;

        // Upload the file to the WordPress media library
        $upload_dir = wp_upload_dir();
        $upload_path = $upload_dir['path'] . '/' . $new_file_name;
        move_uploaded_file($file_tmp, $upload_path);

        // Save the URL of the uploaded file to a custom table
        global $wpdb;
        $table_name = $wpdb->prefix . "jet_cct_profiles";
        $wpdb->update(
            $table_name,
            array('cover' => $upload_dir['url'] . '/' . $new_file_name),
            array('user_id' => $user_id)
        );
    }

    re_direct('https://staff.stanforteedge.com/profile/bio');
    echo 'File uploaded successfully.';
}


?>

<div class="grid grid-cols-12 gap-6 mt-5">
    <!-- BEGIN: Profile Menu -->
    <?php include get_template_directory() . "/layout/menu-profile.php"; ?>
    <!-- END: Profile Menu -->
    <div class="col-span-12 lg:col-span-8 2xl:col-span-9">
        <div class="grid grid-cols-12 gap-6">
            <!-- BEGIN: Bio -->
            <div id="bio" class="intro-y box col-span-12 2xl:col-span-6">
                <div class="flex items-center px-5 py-3 border-b border-slate-200/60 dark:border-darkmode-400">
                    <h2 class="font-medium text-base mr-auto">Personal Information</h2>
                </div>
                <div class="p-5">
                    <form action="" method="post" enctype="multipart/form-data" class="border rounded p-3">
                        <div class="flex xl:flex-row flex-col ">
                            <div class="w-52 mx-auto xl:mr-4 xl:ml-0">
                                <div>Profile Picture</div>
                                <div class="border-2 border-dashed shadow-sm border-slate-200/60 dark:border-darkmode-400 rounded-md p-2">
                                    <div class="h-40 relative image-fit cursor-pointer zoom-in mx-auto mb-3">
                                        <img class="rounded-md" id="preview" alt="<?php echo $staff->first_name; ?>" src="<?php echo $staff->pic; ?>">
                                        <div title="Remove this profile photo?" class="tooltip w-5 h-5 flex items-center justify-center absolute rounded-full text-white bg-danger right-0 top-0 -mr-2 -mt-2"> <i data-lucide="x" class="w-4 h-4"></i> </div>
                                    </div>
                                    <!-- HTML markup for the form -->
                                    <input type="file" class="form-control" name="pic" onchange="previewImage(event)">
                                    <?php if (isset($image_url)) : ?>
                                        <p>Uploaded Image URL: <?php echo $image_url; ?></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div class="w-auto mx-auto xl:ml-0">
                                <div>Cover Picture</div>
                                <div class="border-2 border-dashed shadow-sm border-slate-200/60 dark:border-darkmode-400 rounded-md p-2">
                                    <div class="h-40 relative image-fit cursor-pointer zoom-in mx-auto mb-3">
                                        <img class="rounded-md" id="previewCover" alt="<?php echo $staff->first_name; ?>" src="<?php echo $staff->cover; ?>">
                                        <div title="Remove this profile photo?" class="tooltip w-5 h-5 flex items-center justify-center absolute rounded-full text-white bg-danger right-0 top-0 -mr-2 -mt-2"> <i data-lucide="x" class="w-4 h-4"></i> </div>
                                    </div>
                                    <!-- HTML markup for the form -->
                                    <input type="file" class="form-control" name="cover" onchange="previewImage2(event)">
                                    <?php if (isset($image_url)) : ?>
                                        <p>Uploaded Image URL: <?php echo $image_url; ?></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <button type="submit" name="upload" class="btn btn-primary mt-4 ml-5">Upload</button>
                    </form>
                </div>
                <div class="p-5">
                    <form method="post" class="border rounded p-3">
                        <div class="grid grid-cols-12 gap-6 mt-5">
                            <div class="form-group col-span-12">
                                <label>Bio</label>
                                <textarea placeholder="Bio" name="bio" class="form-control" rows="6"><?= $staff->bio; ?></textarea>
                            </div>

                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>First Name</label>
                                <input type="text" name="first_name" placeholder="First Name" class="form-control" value="<?= $staff->first_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Middle Name</label>
                                <input type="text" name="middle_name" placeholder="Middle Name" class="form-control" value="<?= $staff->middle_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Last Name</label>
                                <input type="text" name="last_name" placeholder="Last Name" class="form-control" value="<?= $staff->last_name; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Phone</label>
                                <input type="tel" name="phone" placeholder="Phone" class="form-control" value="<?= $staff->phone; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Additional Phone</label>
                                <input type="tel" name="phone_2" placeholder="Additional Phone No" class="form-control" value="<?= $staff->phone_2; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Personal Email</label>
                                <input type="email" name="personal_email" placeholder="Personal Email" class="form-control" value="<?= $staff->personal_email; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Date of Birth</label>
                                <input type="date" name="dob" placeholder="Date of Birth" class="form-control" value="<?= $staff->dob; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Gender</label>
                                <select class="form-control" name="sex" value="">
                                    <option value="<?= $staff->sex; ?>" selected><?= $staff->sex; ?></option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Religion</label>
                                <input type="text" placeholder="Religion" name="religion" class="form-control" value="<?= $staff->nationality; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Nationality</label>
                                <input type="text" placeholder="Nationality" name="nationality" class="form-control" value="<?= $staff->nationality; ?>">
                            </div>
                            <div class="form-group col-span-12">
                                <label>Languages</label>
                                <input type="text" placeholder="Languages Spoken" name="languages" class="form-control" value="<?= $staff->nationality; ?>">
                            </div>

                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Marital Status</label>
                                <select class="form-control" name="marital" value="">
                                    <option value="<?= $staff->marital; ?>" selected><?= $staff->marital; ?></option>
                                    <option value="1">Married</option>
                                    <option value="2">Engaged</option>
                                    <option value="3">Single</option>
                                </select>
                            </div>
                            <div class="form-group hidden col-span-12 md:col-span-6 ">
                                <label>Spouse</label>
                                <?php if ($contacts) : ?>
                                    <select name="spouse" class="form-control tom-select">
                                        <?php foreach ($contacts as $contact) : ?>
                                            <option value="<?= $contact->_ID; ?>"><?= $contact->name; ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                <?php else : ?>
                                    <button class="btn btn-primary">Add Contact</button>
                                <?php endif; ?>
                            </div>

                            <div class="form-group hidden col-span-12 md:col-span-6 ">
                                <label>Father</label>
                                <input type="text" placeholder="Nationality" name="nationality" class="form-control" value="<?= $staff->nationality; ?>">
                            </div>
                            <div class="form-group hidden col-span-12 md:col-span-6 ">
                                <label>Mother</label>
                                <input type="text" placeholder="Nationality" name="nationality" class="form-control" value="<?= $staff->nationality; ?>">
                            </div>
                            <div class="form-group hidden col-span-12 md:col-span-6 ">
                                <label>Next of Kin</label>
                                <input type="text" placeholder="Nationality" name="nationality" class="form-control" value="<?= $staff->nationality; ?>">
                            </div>
                            <div class="form-group col-span-12">
                                <label>Address</label>
                                <textarea placeholder="Address" name="address" class="form-control"><?= $staff->address; ?></textarea>
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>City</label>
                                <input type="text" placeholder="City" name="city" class="form-control" value="<?= $staff->city; ?>">
                            </div>
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>State</label>
                                <select placeholder="State" name="state" class="form-select">
                                    <option value="<?php echo $staff->state; ?>" selected><?php echo $staff->state; ?></option>
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
                <div class="p-5 hidden">
                    <form method="post" class="border rounded p-3">
                        <h2>Professional Experience</h2>
                        <div class="grid grid-cols-12 gap-6 mt-5">
                            <div class="form-group col-span-12 md:col-span-6 ">
                                <label>Type</label>
                                <select class="form-control" name="type" value="">
                                    <option value="<?= $staff->type; ?>" selected><?= $staff->type; ?></option>
                                    <option value="1">Qualification</option>
                                    <option value="2">Experience</option>
                                </select>
                            </div>
                            <div class="form-group col-span-12  ">
                                <label>Name</label>
                                <input type="text" name="name" placeholder="Name of School/Organization" class="form-control" value="<?= $staff->name; ?>">
                            </div>
                            <div class="form-group col-span-12  ">
                                <label>Title</label>
                                <input type="text" name="title" placeholder="Title of Position/Qualification" class="form-control" value="<?= $staff->title; ?>">
                            </div>
                            <div class="form-group col-span-12  ">
                                <label>Date</label>
                                <input type="text" name="date" placeholder="Start - End Date" class="form-control datepicker" value="<?= $staff->date; ?>">
                            </div>
                            <div class="col-span-12 md:col-span-6 ">

                                <button class="btn btn-primary w-auto" type="submit" name="professional">Update</button>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="p-5">
                    <form method="post" class="border hidden rounded p-3">
                        <h2>Family Information</h2>
                        <div class="grid grid-cols-12 gap-6 mt-5">
                            <div class="form-group col-span-12  ">
                                <label>Father</label>
                                <input type="text" name="name" placeholder="Name of School/Organization" class="form-control" value="<?= $staff->name; ?>">
                            </div>
                            <div class="form-group col-span-12  ">
                                <label>Mother</label>
                                <input type="email" name="email" placeholder="Email" class="form-control" value="<?= $staff->title; ?>">
                            </div>
                            <div class="form-group col-span-12  ">
                                <label>Spouse</label>
                                <input type="text" name="phone" placeholder="Phone" class="form-control " value="<?= $staff->phone; ?>">
                            </div>
                            <div class="form-group col-span-12  ">
                                <label>Spouse</label>
                                <input type="text" name="phone" placeholder="Phone" class="form-control " value="<?= $staff->phone; ?>">
                            </div>Next-of-kin
                            <div class="col-span-12 md:col-span-6 ">

                                <button class="btn btn-primary w-auto" type="submit" name="family">Update</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <!-- END: BIo -->
        </div>
    </div>
</div>

<?php get_footer(); ?>