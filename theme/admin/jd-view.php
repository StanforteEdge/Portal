<?php /* Template Name:  Admin: Job Description - Edit */ ?>

<?php
get_header();


$p_title = 'Edit';
$b_link = '/admin/jds';
$b_title = 'Job Descriptions';
$id = $_GET['id'];

include get_template_directory() . "/layout/menu.php";
global $wpdb;

if ($id) {
    $jd = $wpdb->get_row("SELECT * FROM staff_jet_cct_job_descriptions a WHERE a._ID = $id");
}

?>
<!-- Place the following <script> and <textarea> tags your HTML's <body> -->

<div class="intro-y ">
    <form method="POST" id="jd-form">
        <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
            <div class="w-full sm:w-auto flex justify-between items-center mt-4 sm:mt-0">
                <h2 class="text-lg font-medium mr-auto">
                    <?= isset($jd) ? 'Edit Job Description' : 'Add Job Description'; ?>
                </h2>
            </div>
        </div>
        <div class="pos intro-y block gap-5 mt-5">
            <!-- BEGIN: Post Content -->
            <div class="intro-y ">
                <input type="text" class="intro-y form-control py-3 px-4 box pr-10" placeholder="Position" name="position" required id="position" value="<?= isset($jd) ? $jd->position : ''; ?>">
                <div class="mt-5 p-5 box ">
                    <h3 class="font-medium mb-3">Summary</h3>
                    <textarea class=" tinymce-body form-control " id="summary" name="summary">
                    <?= isset($jd) ? $jd->summary : ''; ?>
                    </textarea>
                </div>
                <div class="mt-5 p-5 box">
                    <h3 class="font-medium mb-3">Responsibilities</h3>
                    <textarea class=" tinymce-body form-control " id="responsibility" name="responsibility">
                        <?= isset($jd) ? $jd->responsibility : ''; ?>
                    </textarea>
                </div>
                <div class="mt-5 p-5 box">
                    <h3 class="font-medium mb-3">Qualifications</h3>
                    <textarea class="tinymce-body form-control mt-5" id="qualifications" name="qualifications">
                        <?= isset($jd) ? $jd->qualifications : ''; ?>
                    </textarea>
                </div>
                <div class="mt-5 p-5 box">
                    <h3 class="font-medium mb-3">Additional Info</h3>
                    <textarea class="tinymce-body form-control mt-5" id="additional" name="additional">
                        <?= isset($jd) ? $jd->additional : ''; ?>
                    </textarea>
                </div>
            </div>
            <div class="intro-y w-full border-t p-3 sm:w-auto flex justify-end  mt-4 ">
                <div class="mr-2">
                    <select id="status" class="form-select" name="status" required>
                        <?php if ($jd->status == 1) : ?>
                            <option value="1" selected>Draft</option>
                            <option value="2">Publish</option>
                        <?php elseif ($jd->status == 2) : ?>
                            <option value="2" selected>Publish</option>
                            <option value="1">Draft</option>
                        <?php else : ?>
                            <option value="" selected disabled>Select</option>
                            <option value="1">Draft</option>
                            <option value="2">Publish</option>
                        <?php endif; ?>
                    </select>
                </div>
                <button type="submit" name="jd-save" class=" btn btn-primary mr-2 ml-auto sm:ml-0 shadow-md flex items-center" aria-expanded="false" id="note-save"> <i class="w-4 h-4 mr-2" data-lucide="file-text"></i> <?= isset($jd) ? 'Save' : 'Add'; ?></button>
            </div>
        </div>
    </form>
    <!-- BEGIN: Notification Content -->
    <div id="note-saved-notification" class="toastify-content hidden flex">
        <div class="font-medium">Yay! Note is saved!</div>
    </div>
    <!-- END: Notification Content -->
</div>

<script>
    jQuery(document).ready(function($) {
        const emailBodyConfig = {
            selector: 'textarea',
            menubar: false,
            plugins: [
                'link', 'lists', 'advlist', 'powerpaste',
                'autolink', 'tinymcespellchecker', 'autosave', 'searchreplace'
            ],
            toolbar: [
                'undo redo restoredraft | bold italic underline | alignleft aligncenter alignright alignfull | numlist bullist outdent indent | searchreplace'
            ],
            valid_elements: 'p[style],strong,em,span[style],a[href],ul,ol,li',
            valid_styles: {
                '*': 'font-size,text-decoration,text-align'
            },
            powerpaste_word_import: 'clean',
            powerpaste_html_import: 'clean',
            autosave_restore_when_empty: true
        };

        tinymce.init(emailBodyConfig);


        $('#jd-form').submit(function(e) {
            e.preventDefault(); // Prevent the default form submission

            // Gather form data
            var formData = {};
            $.each($(this).serializeArray(), function(_, kv) {
                formData[kv.name] = kv.value;
            });
            formData['ID'] = <?= json_encode($id); ?>;

            console.log(formData);

            $.ajax({
                url: '/wp-content/themes/stanforte/forms/jd.php',
                method: 'POST',
                data: JSON.stringify(formData),
                dataType: 'json', // Expect JSON response
                success: function(response) {
                    if (response.success = true) {
                        console.log(response.message);
                        alert(response.message)
                        if (response.redirect_url) {
                            window.location.href = response.redirect_url;
                        }
                    } else {
                        alert(response.message)
                        console.log(response.message);
                    }


                    // Toastify({
                    //     node: $("#jd-saved-notification").clone().removeClass("hidden")[0],
                    //     duration: 3000,
                    //     newWindow: true,
                    //     close: true,
                    //     gravity: "bottom",
                    //     position: "right",
                    //     stopOnFocus: true
                    // }).showToast();

                },
                error: function(err) {
                    console.error('AJAX Error:', status, error);
                    alert('Failed to save note');
                }
            });
        });
    });
</script>

<?php get_footer(); ?>