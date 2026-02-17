<?php /* Template Name:  Test */

get_header();
$b_link = '/requests';
$b_title = 'Requests';
$p_title = 'New Request';

include get_template_directory() . "/layout/menu.php";
// print_r($staff);


// Check if the form is submitted
if(isset($_POST['submit'])){
    // Call the stanmail function and store the result in $sent variable
    $sent = stanmail('it@stanforteedge.com', 'olalekan@stanforteedge.com', 'Re: Request: PC/01/160 - Sent', "Thanks", 160);
    // Output the result
    echo $sent;
}
?>


<form method="POST">
    <button type="submit" name="submit" class="btn btn-primary">Submit</button>
</form>


<?php get_footer(); ?>