<?php
/**
 * StanforteEdge Theme Functions
 * 
 * @package StanforteEdge
 * 
 * This file should only contain theme-specific functionality.
 * All business logic has been moved to the Stanforte Edge Core plugin.
 */

// Check if the plugin is active
if (!defined('SE_DIR')) {
    add_action('admin_notices', function() {
        echo '<div class="error"><p>Stanforte Edge Core plugin is required for this theme to function properly.</p></div>';
    });
    return;
}

// Enqueue frontend.js and localize nonce for REST API
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('my-frontend-js', get_template_directory_uri() . '/js/frontend.js', ['jquery'], null, true);
    wp_localize_script('my-frontend-js', 'wpApiSettings', [
        'root'  => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
    ]);
});

function cyfiapp_theme_support()
{
    //adds dynamic title tag to pages
    add_theme_support('title-tag');
}
add_action('after_setup_theme', 'cyfiapp_theme_support');

function cyfiapp_register_styles()
{
    wp_enqueue_style('cyfiapp-main-css', get_template_directory_uri() . "/assets/css/app.css", array(), 1.0, 'all');
}
add_action('wp_enqueue_scripts', 'cyfiapp_register_styles');


function stanforte_register_scripts()
{
    wp_enqueue_script('stanforte-global', get_template_directory_uri() . "/assets/js/app.js", array(), 1.0, true);
    wp_localize_script('stanforte-global', 'wpApiSettings', [
        'root'  => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest'),
    ]);
}
add_action('wp_enqueue_scripts', 'stanforte_register_scripts');




//Remove Adminbar from frontend
add_filter('show_admin_bar', '__return_false');

//login error
function custom_login_failed_redirect()
{
    $referrer = wp_get_referer();
    if (!empty($referrer) && !strstr($referrer, 'wp-login') && !strstr($referrer, 'wp-admin')) {
        $login_url = home_url('/login');
        $login_url = add_query_arg('login', 'failed', $login_url);
        wp_redirect($login_url);
        exit;
    }
}
add_action('wp_login_failed', 'custom_login_failed_redirect');

//redirect after login
function custom_login_redirect()
{
    if ($_SESSION['login_status'] == 'success') {
        re_direct(home_url('/home'));
        exit();
    }
}
add_action('wp_login', 'custom_login_redirect');

/* Redirection Function */
function re_direct($location)
{
    echo "<script>window.location.href = '$location'</script>";
}

function cyfiapp_modify_jquery()
{
    //check if front-end is being viewed
    if (!is_admin()) {
        // Remove default WordPress jQuery
        wp_deregister_script('jquery');
        // Register new jQuery script via Google Library    
        wp_register_script('jquery', 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js', false, '3.6.3');
        // Enqueue the script   
        wp_enqueue_script('jquery');
    }
}
add_action('init', 'cyfiapp_modify_jquery');

//Logout link
$redirect_to = home_url(); // URL to redirect the user to after logging out
$logout_link = wp_logout_url($redirect_to); // Create the logout link

function stanmail($from, $to, $subject, $message, $request = '')
{
    $messageId = ''; // Initialize messageId

    // If request is provided, try to find a matching email
    if ($request != '') {
        global $wpdb;

        // Execute the query
        $messageId = 'CAGqiZ=yPYODSPPrPpUovVF=n_2KzFeM5uQGCRR7pzC8HU9ZOUw@mail.gmail.com';
    }

    $headers = array(
        'From: Stanforte Edge Portal <accounts@stanforteedge.com>',
        'Reply-To: Stanforte Edge Portal <' . $from . '>',
        'Content-Type: text/html; charset=UTF-8',
    );

    // Load your email template
    $template = get_stylesheet_directory() . '/layout/email-template.php';
    ob_start();
    include $template;
    $template_content = ob_get_clean();
    $template_content = str_replace('{title_content}', $subject, $template_content);
    $template_content = str_replace('{body_content}', $message, $template_content);

    // Send the email
    if ($messageId) {
        // Set Reply-To header to original email address (if messageId is found)
        $headers['References'] = $messageId;
        $headers['In-Reply-To'] = $messageId; // Replace with the actual sender address if different
        $sent = wp_mail($to, $subject, $template_content, $headers, array($messageId)); // Send as reply
    } else {
        $sent = wp_mail($to, $subject, $template_content, $headers); // Send as new email
    }

    // Return true if sent, false otherwise
    // Return an array with sending status and message ID

    return $messageId ? $messageId : $sent . '' . $request;
}

// This rule will allow you to use URLs like form/123.
function custom_form_rewrite_rule()
{
    // Existing rules for requests
    add_rewrite_rule('^requests/request/([0-9]+)/?$', 'index.php?pagename=requests/request&id=$matches[1]', 'top');
    add_rewrite_rule('^requests/team/request/([0-9]+)/?$', 'index.php?pagename=requests/team/request&id=$matches[1]', 'top');
    add_rewrite_rule('^requests/approvals/request/([0-9]+)/?$', 'index.php?pagename=requests/approvals/request&id=$matches[1]', 'top');
    add_rewrite_rule('^accounts/requests/request/([0-9]+)/?$', 'index.php?pagename=accounts/requests/request&id=$matches[1]', 'top');
    
}
add_action('init', 'custom_form_rewrite_rule');

function add_query_vars_filter($vars)
{
    $vars[] = 'id';
    return $vars;
}
add_filter('query_vars', 'add_query_vars_filter');

//API for Documents
// function staff_api_documents($data)
// {
//     global $wpdb;

//     $table_name1 = $wpdb->prefix . 'jet_cct_documents';
//     $table_name2 = $wpdb->prefix . 'jet_cct_document_type';

//     // Get the current page number
//     $page = isset($data['_page']) ? intval($data['_page']) : 1;
//     // Number of items per page
//     $per_page = isset($data['_per_page']) ? intval($data['_per_page']) : 10;
//     // Calculate the offset
//     $offset = ($page - 1) * $per_page;

//     $orderby = "status"; // default value
//     if (isset($data['_orderby'])) {
//         $orderby = $data['_orderby'];
//     }

//     $order = "ASC"; // default value
//     if (isset($data['_order'])) {
//         $order = $data['_order'];
//     }

//     $search = ''; // default value
//     if (isset($data['_search'])) {
//         $search = sanitize_text_field($data['_search']);
//     }

//     $ID = isset($data['_ID']) ? intval($data['_ID']) : '';
//     $status = isset($data['status']) ? intval($data['status']) : '';

//     $query = "SELECT * FROM $table_name1 a INNER JOIN $table_name2 b ON a.type = b._ID WHERE a._ID != ' ' ";

//     if ($search) {
//         $query .= " AND a.title LIKE '%$search%' OR a.content LIKE '%$search%' OR b.name LIKE '%$search%' ";
//     }

//     if ($ID) {
//         $query .= " AND a._ID = $ID ";
//     }

//     if ($status) {
//         $query .= " AND a.status = $status ";
//     }

//     $query .= " ORDER BY $orderby $order LIMIT $per_page OFFSET $offset";
//     $results = $wpdb->get_results($query);


//     // count the total number of results
//     $query = "SELECT COUNT(*) FROM $table_name1 a WHERE a._ID != ' ' ";

//     if ($search) {
//         $query .= " AND a.title LIKE '%$search%' OR a.content LIKE '%$search%' OR b.name LIKE '%$search%' ";
//     }

//     if ($ID) {
//         $query .= " AND a._ID = $ID ";
//     }

//     if ($status) {
//         $query .= " AND a.status = $status ";
//     }

//     $total_results = $wpdb->get_var($query);

//     if (empty($results)) {
//         return new WP_Error('no_results', 'No results found', array('status' => 404));
//     }

//     $response = array();
//     $response['total_results'] = $total_results;
//     $response['total_pages'] = ceil($total_results / $per_page);
//     $response['per_page'] = $per_page;
//     $response['current_page'] = $page;
//     $response['results'] = array();
//     // $response['results'] = array();
//     foreach ($results as $result) {
//         $response['results'][] = array(
//             '_ID' => $result->_ID,
//             'title' => $result->title,
//             'content' => $result->content,
//             'status' => $result->status,
//             'name' => $result->name,
//             'color' => $result->color,
//             'cct_created' => $result->cct_created,
//             'cct_modified' => $result->cct_modified,
//             // Add other fields as needed
//         );
//     }
//     return new WP_REST_Response($response, 200);
// }
// add_action('rest_api_init', function () {
//     register_rest_route('api/v1', '/documents', array(
//         'methods' => 'GET',
//         'callback' => 'staff_api_documents',
//         'args' => array(
//             'orderby' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_orderby_values = array('title', 'type', 'status');
//                     return in_array($param, $valid_orderby_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order by field',
//                 'type' => 'string',
//                 'default' => 'status',
//             ),
//             'ID' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'The ID of the Document',
//                 'type' => 'integer'
//             ),
//             'status' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'The status of the Document',
//                 'type' => 'integer'
//             ),
//             'order' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_order_values = array('ASC', 'DESC');
//                     return in_array(strtoupper($param), $valid_order_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order field',
//                 'type' => 'string',
//                 'default' => 'DESC',
//             ),
//             'search' => array(
//                 'validate_callback' => function ($param) {
//                     return is_string($param);
//                 },
//                 'required' => false,
//                 'description' => 'Search by keyword',
//                 'type' => 'string',
//                 'default' => '',
//             ),
//             'page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Current page',
//                 'type' => 'integer',
//                 'default' => 1,
//             ),
//             'per_page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Number of items per page',
//                 'type' => 'integer',
//                 'default' => 10,
//             ),



//         ),
//     ));
// });

//API for JDs
// function staff_api_jds($data)
// {
//     global $wpdb;

//     $table_name1 = $wpdb->prefix . 'jet_cct_job_descriptions';

//     // Get the current page number
//     $page = isset($data['_page']) ? intval($data['_page']) : 1;
//     // Number of items per page
//     $per_page = isset($data['_per_page']) ? intval($data['_per_page']) : 10;
//     // Calculate the offset
//     $offset = ($page - 1) * $per_page;

//     $orderby = "status"; // default value
//     if (isset($data['_orderby'])) {
//         $orderby = $data['_orderby'];
//     }

//     $order = "ASC"; // default value
//     if (isset($data['_order'])) {
//         $order = $data['_order'];
//     }

//     $search = ''; // default value
//     if (isset($data['_search'])) {
//         $search = sanitize_text_field($data['_search']);
//     }

//     $ID = isset($data['_ID']) ? intval($data['_ID']) : '';
//     $status = isset($data['status']) ? intval($data['status']) : '';

//     $query = "SELECT * FROM $table_name1 a WHERE a._ID != ' ' ";

//     if ($search) {
//         $query .= " AND a.position LIKE '%$search%' OR a.responsibility LIKE '%$search%' OR a.qualifications LIKE '%$search%' ";
//     }

//     if ($ID) {
//         $query .= " AND a._ID = $ID ";
//     }

//     if ($status) {
//         $query .= " AND a.status = $status ";
//     }

//     $query .= " ORDER BY $orderby $order LIMIT $per_page OFFSET $offset";
//     $results = $wpdb->get_results($query);


//     // count the total number of results
//     $query = "SELECT COUNT(*) FROM $table_name1 a WHERE a._ID != ' ' ";

//     if ($search) {
//         $query .= " AND a.position LIKE '%$search%' OR a.responsibility LIKE '%$search%' OR a.qualifications LIKE '%$search%' ";
//     }

//     if ($ID) {
//         $query .= " AND a._ID = $ID ";
//     }

//     if ($status) {
//         $query .= " AND a.status = $status ";
//     }

//     $total_results = $wpdb->get_var($query);

//     if (empty($results)) {
//         return new WP_Error('no_results', 'No results found', array('status' => 404));
//     }

//     $response = array();
//     $response['total_results'] = $total_results;
//     $response['total_pages'] = ceil($total_results / $per_page);
//     $response['per_page'] = $per_page;
//     $response['current_page'] = $page;
//     $response['results'] = array();
//     // $response['results'] = array();
//     foreach ($results as $result) {
//         $response['results'][] = array(
//             '_ID' => $result->_ID,
//             'position' => $result->position,
//             'responsibility' => $result->responsibility,
//             'status' => $result->status,
//             'qualifications' => $result->qualifications,
//             'cct_created' => $result->cct_created,
//             'cct_modified' => $result->cct_modified,
//             // Add other fields as needed
//         );
//     }
//     return new WP_REST_Response($response, 200);
// }
// add_action('rest_api_init', function () {
//     register_rest_route('api/v1', '/jds', array(
//         'methods' => 'GET',
//         'callback' => 'staff_api_jds',
//         'args' => array(
//             'orderby' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_orderby_values = array('_ID', 'status');
//                     return in_array($param, $valid_orderby_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order by field',
//                 'type' => 'string',
//                 'default' => 'status',
//             ),
//             'ID' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'The ID of the Document',
//                 'type' => 'integer'
//             ),
//             'status' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'The status of the Document',
//                 'type' => 'integer'
//             ),
//             'order' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_order_values = array('ASC', 'DESC');
//                     return in_array(strtoupper($param), $valid_order_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order field',
//                 'type' => 'string',
//                 'default' => 'ASC',
//             ),
//             'search' => array(
//                 'validate_callback' => function ($param) {
//                     return is_string($param);
//                 },
//                 'required' => false,
//                 'description' => 'Search by keyword',
//                 'type' => 'string',
//                 'default' => '',
//             ),
//             'page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Current page',
//                 'type' => 'integer',
//                 'default' => 1,
//             ),
//             'per_page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Number of items per page',
//                 'type' => 'integer',
//                 'default' => 10,
//             ),



//         ),
//     ));
// });

//API for Profiles
// function staff_api_profiles($data)
// {
//     global $wpdb;

//     $table_name1 = $wpdb->prefix . 'jet_cct_profiles';
//     $table_name2 = $wpdb->prefix . 'jet_cct_job_descriptions';
//     $table_name3 = $wpdb->prefix . 'jet_cct_team_members';
//     $table_name4 = $wpdb->prefix . 'jet_cct_teams';

//     // Get the current page number
//     $page = isset($data['_page']) ? intval($data['_page']) : 1;
//     // Number of items per page
//     $per_page = isset($data['_per_page']) ? intval($data['_per_page']) : 10;
//     // Calculate the offset
//     $offset = ($page - 1) * $per_page;

//     //Get the column to display
//     $column = "*";
//     if (isset($data['_column'])) {
//         $column = $data['_column'];
//     }

//     $orderby = "first_name"; // default value
//     if (isset($data['_orderby'])) {
//         $orderby = $data['_orderby'];
//     }

//     $order = "ASC"; // default value
//     if (isset($data['_order'])) {
//         $order = $data['_order'];
//     }

//     $type = ""; // default value
//     if (isset($data['_type'])) {
//         $type = sanitize_text_field($data['_type']);
//     }

//     $ID = ""; // default value
//     if (isset($data['_ID'])) {
//         $type = sanitize_text_field($data['_ID']);
//     }

//     $search = ''; // default value
//     if (isset($data['_search'])) {
//         $search = sanitize_text_field($data['_search']);
//     }

//     $query = "SELECT a._ID , a.user_id, a.first_name, a.middle_name, a.last_name, a.sex, a.dob, a.address, a.email, a.personal_email, a.type, a.phone, a.phone_2, a.status, a.city, a.state, a.pic, a.cover, a.bio, b.position, b.summary, b.responsibility 
//     -- c.team, c.team_status, d.name 
//     FROM $table_name1 a 
//     LEFT JOIN $table_name2 b ON b._ID = a.role
//     -- LEFT JOIN $table_name3 c ON a._ID = c.staff
//     -- LEFT JOIN $table_name4 d ON d._ID = c.team
//     WHERE a._ID != '' ";

//     if ($search) {
//         $query .= " AND a.first_name LIKE '%$search%' OR a.last_name LIKE '%$search%' OR a.email LIKE '%$search%' ";
//     }
//     if ($type) {
//         $query .= " AND a.type = '$type' ";
//     }

//     if ($ID) {
//         $query .= " AND a._ID = '$ID' ";
//     }

//     $query .= " ORDER BY $orderby $order LIMIT $per_page OFFSET $offset";
//     $results = $wpdb->get_results($query);


//     // count the total number of results
//     $query = "SELECT COUNT(*) FROM $table_name1 a WHERE a._ID != '' ";
//     if ($search) {
//         $query .= " AND a.first_name LIKE '%$search%' OR a.last_name LIKE '%$search%' OR a.email LIKE '%$search%' ";
//     }
//     if ($type) {
//         $query .= " AND a.type = '$type' ";
//     }

//     if ($ID) {
//         $query .= " AND a._ID = '$ID' ";
//     }

//     $total_results = $wpdb->get_var($query);

//     if (empty($results)) {
//         return new WP_Error('no_results', 'No results found', array('status' => 404));
//     }

//     $response = array();
//     $response['total_results'] = $total_results;
//     $response['total_pages'] = ceil($total_results / $per_page);
//     $response['per_page'] = $per_page;
//     $response['current_page'] = $page;
//     $response['results'] = array();
//     if ($column !== '*') {
//         // $response['results'] = array();
//         foreach ($results as $result) {
//             $response['results'][] = array(
//                 $column => $result->$column
//             );
//         }
//     } else {
//         // $response['results'] = array();
//         foreach ($results as $result) {
//             $response['results'][] = array(
//                 '_ID' => $result->_ID,
//                 'user_id' => $result->user_id,
//                 'pic' => $result->pic,
//                 'cover' => $result->cover,
//                 'first_name' => $result->first_name,
//                 'middle_name' => $result->middle_name,
//                 'last_name' => $result->last_name,
//                 'email' => $result->email,
//                 'personal_email' => $result->personal_email,
//                 'phone' => $result->phone,
//                 'phone_2' => $result->phone_2,
//                 'dob' => $result->dob,
//                 'sex' => $result->sex,
//                 'address' => $result->address,
//                 'city' => $result->city,
//                 'state' => $result->state,
//                 'bio' => $result->bio,
//                 'position' => $result->position,
//                 'status' => $result->status,
//                 // 'team' => $result->name
//                 // Add other fields as needed
//             );
//         }
//     }

//     return new WP_REST_Response($response, 200);
// }
// add_action('rest_api_init', function () {
//     register_rest_route('api/v1', '/profiles', array(
//         'methods' => 'GET',
//         'callback' => 'staff_api_profiles',
//         'args' => array(

//             'orderby' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_orderby_values = array('_ID', 'first_name', 'last_name', 'email');
//                     return in_array($param, $valid_orderby_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order by field',
//                 'type' => 'string',
//                 'default' => 'first_name',
//             ),
//             'order' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_order_values = array('ASC', 'DESC');
//                     return in_array(strtoupper($param), $valid_order_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order field',
//                 'type' => 'string',
//                 'default' => 'ASC',
//             ),
//             'member' => array(
//                 'validate_callback' => function ($param) {
//                     return is_string($param);
//                 },
//                 'required' => false,
//                 'description' => 'Choose Member Type',
//                 'type' => 'string',
//                 'default' => '',
//             ),
//             'search' => array(
//                 'validate_callback' => function ($param) {
//                     return is_string($param);
//                 },
//                 'required' => false,
//                 'description' => 'Search by keyword',
//                 'type' => 'string',
//                 'default' => '',
//             ),
//             'column' => array(
//                 'validate_callback' => function ($param) {
//                     return is_string($param);
//                 },
//                 'required' => true,
//                 'description' => 'Column',
//                 'type' => 'string',
//                 'default' => '*',
//             ),
//             'page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Current page',
//                 'type' => 'integer',
//                 'default' => 1,
//             ),
//             'per_page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Number of items per page',
//                 'type' => 'integer',
//                 'default' => 10,
//             ),



//         ),
//     ));
// });

//API for Requests
// function staff_api_requests($data)
// {
//     global $wpdb;

//     $table_name1 = $wpdb->prefix . 'jet_cct_requests_financial';
//     $table_name2 = $wpdb->prefix . 'jet_cct_projects';
//     $table_name3 = $wpdb->prefix . 'jet_cct_profiles';
//     $table_name4 = $wpdb->prefix . 'jet_cct_teams';
//     $table_name5 = $wpdb->prefix . 'jet_cct_request_types';

//     // Get the current page number
//     $page = isset($data['_page']) ? intval($data['_page']) : 1;
//     // Number of items per page
//     $per_page = isset($data['_per_page']) ? intval($data['_per_page']) : 10;
//     // Calculate the offset
//     $offset = ($page - 1) * $per_page;

//     //Get the column to display
//     // $column = "*";
//     // if (isset($data['_column'])) {
//     //     $column = $data['_column'];
//     // }

//     $orderby = "_ID"; // default value
//     if (isset($data['_orderby'])) {
//         $orderby = $data['_orderby'];
//     }

//     $order = "DESC"; // default value
//     if (isset($data['_order'])) {
//         $order = $data['_order'];
//     }

//     $type = ""; // default value
//     if (isset($data['_type'])) {
//         $type = sanitize_text_field($data['_type']);
//     }

//     $staff = ""; // default value
//     if (isset($data['_staff'])) {
//         $staff = $data['_staff'];
//     }

//     $team = ''; // default value
//     if (isset($data['_team'])) {
//         $team = sanitize_text_field($data['_team']);
//     }

//     $project = ""; // default value
//     if (isset($data['_project'])) {
//         $project = $data['_project'];
//     }

//     $search = ''; // default value
//     if (isset($data['_search'])) {
//         $search = sanitize_text_field($data['_search']);
//     }

//     $status = ''; // default value
//     if (isset($data['_status'])) {
//         $status = sanitize_text_field($data['_status']);
//     }

//     $query = "SELECT a._ID, a.type, a.staff, a.team, a.project, a.amount, a.description, a.status, a.due_date, a.cct_created, b.title as project_title, c.first_name, c.last_name, d.name as team_name, e.name as request_type, e.code 
//     FROM $table_name1 a 
//     LEFT JOIN $table_name2 b ON b._ID = a.project 
//     LEFT JOIN $table_name3 c ON c._ID = a.staff
//     LEFT JOIN $table_name4 d ON d._ID = a.team
//     LEFT JOIN $table_name5 e ON e._ID = a.type
//     WHERE a._ID != ' '  
//     ";


//     if ($search) {
//         $query .= " AND c.first_name LIKE '%$search%' OR c.last_name LIKE '%$search%' OR d.name LIKE '%$search%' OR a.description LIKE '%$search%' OR b.title LIKE '%$search%' ";
//     }
//     if ($type) {
//         $query .= " AND a.type = '$type' ";
//     }

//     if ($staff) {
//         $query .= " AND a.staff = '$staff' ";
//     }

//     if ($team) {
//         $team_values = explode(',', $team); // Convert string to array of team numbers
//         $team_values = array_map('intval', $team_values); // Convert array values to integers
//         $team_str = implode(',', $team_values); // Convert back to comma-separated string
//         $query .= " AND a.team IN ($team_str) ";
//     }

//     if ($project) {
//         $query .= " AND a.project = '$project' ";
//     }

//     if ($status) {
//         $status_values = explode(',', $status); // Convert string to array of status numbers
//         $status_values = array_map('intval', $status_values); // Convert array values to integers
//         $status_str = implode(',', $status_values); // Convert back to comma-separated string
//         $query .= " AND a.status IN ($status_str) ";
//     }

//     $query .= " ORDER BY $orderby $order LIMIT $per_page OFFSET $offset";
//     $results = $wpdb->get_results($query);


//     // count the total number of results
//     $query = "SELECT COUNT(*) FROM $table_name1 a WHERE a._ID != ' ' ";
//     if ($search) {
//         $query .= " AND c.first_name LIKE '%$search%' OR c.last_name LIKE '%$search%' OR d.name LIKE '%$search%' OR a.description LIKE '%$search%' OR b.title LIKE '%$search%' ";
//     }
//     if ($type) {
//         $query .= " AND a.type = '$type' ";
//     }

//     if ($staff) {
//         $query .= " AND a.staff = '$staff' ";
//     }

//     if ($team) {
//         $team_values = explode(',', $team); // Convert string to array of team numbers
//         $team_values = array_map('intval', $team_values); // Convert array values to integers
//         $team_str = implode(',', $team_values); // Convert back to comma-separated string
//         $query .= " AND a.team IN ($team_str) ";
//     }

//     if ($project) {
//         $query .= " AND a.project = '$project' ";
//     }

//     if ($status) {
//         $status_values = explode(',', $status); // Convert string to array of status numbers
//         $status_values = array_map('intval', $status_values); // Convert array values to integers
//         $status_str = implode(',', $status_values); // Convert back to comma-separated string
//         $query .= " AND a.status IN ($status_str) ";
//     }

//     $total_results = $wpdb->get_var($query);

//     if (empty($results)) {
//         return new WP_Error('no_results', 'No results found', array('status' => 404));
//     }

//     $response = array();
//     $response['total_results'] = $total_results;
//     $response['total_pages'] = ceil($total_results / $per_page);
//     $response['per_page'] = $per_page;
//     $response['current_page'] = $page;
//     $response['results'] = array();

//     foreach ($results as $result) {
//         $response['results'][] = array(
//             '_ID' => $result->_ID,
//             'type' => $result->type,
//             'staff' => $result->staff,
//             'team' => $result->team,
//             'project' => $result->project,
//             'description' => $result->description,
//             'amount' => $result->amount,
//             'project_title' => $result->project_title,
//             'first_name' => $result->first_name,
//             'last_name' => $result->last_name,
//             'team_name' => $result->team_name,
//             'request_type' => $result->request_type,
//             'code' => $result->code,
//             'status' => $result->status,
//             'cct_created' => $result->cct_created,
//             'due_date' => $result->due_date,
//             // Add other fields as needed
//         );
//     }
//     return new WP_REST_Response($response, 200);
// }
// add_action('rest_api_init', function () {
//     register_rest_route('api/v1', '/requests', array(
//         'methods' => 'GET',
//         'callback' => 'staff_api_requests',
//         'args' => array(

//             'orderby' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_orderby_values = array('_ID', 'due_date');
//                     return in_array($param, $valid_orderby_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order by field',
//                 'type' => 'string',
//                 'default' => 'due_date',
//             ),
//             'order' => array(
//                 'validate_callback' => function ($param) {
//                     $valid_order_values = array('ASC', 'DESC');
//                     return in_array(strtoupper($param), $valid_order_values);
//                 },
//                 'required' => false,
//                 'description' => 'Order field',
//                 'type' => 'string',
//                 'default' => 'DESC',
//             ),
//             'search' => array(
//                 'validate_callback' => function ($param) {
//                     return is_string($param);
//                 },
//                 'required' => false,
//                 'description' => 'Search by keyword',
//                 'type' => 'string',
//                 'default' => '',
//             ),
//             'staff' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Current staff',
//                 'type' => 'integer',
//                 'default' => 0,
//             ),
//             'project' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Project',
//                 'type' => 'integer',
//                 'default' => 0,
//             ),
//             'column' => array(
//                 'validate_callback' => function ($param) {
//                     return is_string($param);
//                 },
//                 'required' => true,
//                 'description' => 'Column',
//                 'type' => 'string',
//                 'default' => '*',
//             ),
//             'page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Current page',
//                 'type' => 'integer',
//                 'default' => 1,
//             ),
//             'per_page' => array(
//                 'validate_callback' => function ($param) {
//                     return is_numeric($param);
//                 },
//                 'required' => false,
//                 'description' => 'Number of items per page',
//                 'type' => 'integer',
//                 'default' => 10,
//             ),
//             'status' => array(
//                 'validate_callback' => function ($param) {
//                     // Check if it's a valid string of comma-separated numbers
//                     return is_string($param);
//                 },
//                 'required' => false,
//                 'description' => 'Status',
//                 'type' => 'string',
//                 'default' => '',
//             ),


//         ),
//     ));
// });

// function get_staff_data($user_id)
// {
//     global $wpdb;

//     // Check if user ID is valid
//     if (empty($user_id)) {
//         return new WP_Error('invalid_user_id', 'Invalid user ID');
//     }

//     // Get the profile data
//     $profile = $wpdb->get_row("SELECT * FROM staff_jet_cct_profiles WHERE user_id = '$user_id'");
//     // Return an object with the profile and job description data
//     return (object) [
//         'ID' => $profile->_ID,
//         'user_id' => $profile->_user_id,
//         'first_name' => $profile->middle_name,
//         'middle_name' => $profile->middle_name,
//         'last_name' => $profile->last_name,
//         'sex' => $profile->sex,
//         'email' => $profile->email,
//         'personal_email' => $profile->personal_email,
//         'address' => $profile->address,
//         'phone' => $profile->phone,
//         'phone_2' => $profile->phone_2,
//         'city' => $profile->city,
//         'state' => $profile->state,
//         'pic' => $profile->pic,
//         'cover' => $profile->cover,
//         'religion' => $profile->religion,
//         'bio' => $profile->bio,
//         'marital' => $profile->middle_name,
//         'languages' => $profile->languages,
//     ];
// }


// function get_staff_team($id)
// {
//     global $wpdb;

//     // Check if user ID is valid
//     if (empty($id)) {
//         return new WP_Error('invalid_user_id', 'Invalid user ID');
//     }

//     // Get the team data
//     $team_data = $wpdb->get_results("SELECT b._ID, b.name, a.team_status 
//                                         FROM staff_jet_cct_team_members a 
//                                         INNER JOIN staff_jet_cct_teams b 
//                                         ON b._ID = a.team 
//                                         WHERE a.staff = '$id'");

//     // Check if team data exists
//     if (empty($team_data)) {
//         return new WP_Error('team_not_found', 'Team not found');
//     }

//     // Return an array of objects with the team data
//     $teams = array();
//     foreach ($team_data as $team) {
//         $teams[] = (object) [
//             '_ID' => $team->_ID,
//             'name' => $team->name,
//             'status' => $team->team_status
//         ];
//     }
//     return $teams;
// }





// Hide admin bar for non-administrators
function hide_admin_bar()
{
    if (!current_user_can('administrator')) {
        show_admin_bar(false);
    }
}
add_action('after_setup_theme', 'hide_admin_bar');

// Add this to your theme's functions.php or custom plugin
function filter_debug_messages()
{
    if (!current_user_can('administrator')) {
        // Disable debug messages for non-administrators
        error_reporting(0);
        @ini_set('display_errors', 0);
        define('WP_DEBUG', false);
        define('WP_DEBUG_DISPLAY', false);
        define('SCRIPT_DEBUG', false);
    }
}
add_action('init', 'filter_debug_messages');

// Optionally, you can also hide the debug.log message in admin bar
function remove_debug_admin_bar_for_non_admins($wp_admin_bar)
{
    if (!current_user_can('administrator')) {
        $wp_admin_bar->remove_menu('debug-bar');
    }
}
add_action('admin_bar_menu', 'remove_debug_admin_bar_for_non_admins', 999);

function scan_all_template_files($base_dir = '') {
    if (empty($base_dir)) {
        $base_dir = get_template_directory();
    }
    
    $template_files = array();
    
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($base_dir),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    foreach ($files as $file) {
        // Skip dots (. and ..) and hidden files
        if ($file->isFile() && 
            $file->getExtension() === 'php' && 
            !preg_match('/^\./', $file->getFilename())) {
            
            $relative_path = str_replace($base_dir, '', $file->getPathname());
            $template_files[] = array(
                'path' => $relative_path,
                'name' => basename($file->getPathname()),
                'full_path' => $file->getPathname()
            );
        }
    }
    
    return $template_files;
}

function register_theme_templates($page_templates, $theme, $post) {
    $templates = scan_all_template_files();
    
    foreach ($templates as $template) {
        $file_content = file_get_contents($template['full_path']);
        if (preg_match('#Template Name:(.+?)(\*/|\?>|$)#mi', $file_content, $matches)) {
            $template_name = trim($matches[1]);
            $page_templates[ltrim($template['path'], '/')] = $template_name;
        }
    }
    
    return $page_templates;
}
add_filter('theme_page_templates', 'register_theme_templates', 10, 3);
