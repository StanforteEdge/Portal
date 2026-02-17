<?php
// Load WordPress environment
require_once('../../../../wp-load.php');

if (!empty($_FILES['files'])) {
    $request = isset($_POST['request']) ? intval($_POST['request']) : 0;
    $staff = isset($_POST['staff']) ? intval($_POST['staff']) : 0;
    $type = isset($_POST['type']) ? $_POST['type'] : '';
    $files = $_FILES['files'];
    $upload_dir = wp_upload_dir();
    $file_names = array();
    $errors = array();

    for ($i = 0; $i < count($files['name']); $i++) {
        $tmp_name = $files['tmp_name'][$i];
        $fileName = $files['name'][$i];
        // Rename the file with the value of $request
        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
        $newFileName = 'request-' . $request . '(' . $fileName . ').' . $fileExtension;
        // $uploadedFi[] = $index .'-File New Name: ' . $newFileName;
        $destination = $upload_dir['path'] . '/' . $newFileName;

        if (move_uploaded_file($tmp_name, $destination)) {
            global $wpdb;

            // Insert file URL into custom table
            $file_url = $upload_dir['url'] . '/' . $newFileName;
            $table_name = 'staff_jet_cct_files';
            $wpdb->insert(
                $table_name,
                array(
                    'url' => $file_url,
                    'type' => $type,
                    'staff' => $staff,
                    'request' => $request,
                    'name' => $newFileName
                )
            );

            $file_names[] = $newFileName;
        } else {
            $errors[] = 'Error uploading file: ' . $newFileName;
        }
    }

    if (empty($errors)) {
        echo json_encode(array('success' => true, 'file_names' => $file_names));
    } else {
        echo json_encode(array('success' => false, 'error' => implode(', ', $errors)));
    }
} else {
    echo json_encode(array('success' => false, 'error' => 'No files uploaded'));
}
?>
