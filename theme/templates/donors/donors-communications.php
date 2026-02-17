<?php
/* Template Name: Donors: Communications */

get_header();
$b_link = '/donors';
$b_title = 'Donors';
$p_title = 'Donor Communications';

include get_template_directory() . "/layout/menu.php";

// Check if user has permission to view this page
$user = wp_get_current_user();
$allowed_roles = array('administrator', 'finance', 'crm');
if (!array_intersect($allowed_roles, (array) $user->roles)) {
    wp_redirect(home_url('/donors'));
    exit;
}

// Check if donor ID is provided
if (!isset($_GET['id'])) {
    wp_redirect(home_url('/donors'));
    exit;
}
?>
<div class="wrapper">
    <div class="wrapper-box">
        <div class="content">
            <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
                <h2 class="text-lg font-medium mr-auto">Donor Communications</h2>
                <div class="w-full sm:w-auto flex mt-4 sm:mt-0">
                    <button class="btn btn-primary shadow-md mr-2" data-tw-toggle="modal" data-tw-target="#add-communication-modal">New Communication</button>
                    <a href="<?php echo home_url('/donors/edit'); ?>?id=<?php echo $_GET['id']; ?>" class="btn btn-outline-secondary">Back to Donor</a>
                </div>
            </div>

            <!-- BEGIN: Donor Info -->
            <div class="intro-y box p-5 mt-5">
                <div class="flex flex-col lg:flex-row">
                    <div class="lg:mr-auto">
                        <div class="font-medium text-base">John Doe Foundation</div>
                        <div class="text-slate-500">contact@jdf.org</div>
                        <div class="text-slate-500">+1234567890</div>
                    </div>
                    <div class="flex flex-col mt-4 lg:mt-0">
                        <div class="text-slate-500">Last Contact: <span class="font-medium">2024-01-15</span></div>
                        <div class="text-slate-500">Status: <span class="text-success">Active</span></div>
                    </div>
                </div>
            </div>
            <!-- END: Donor Info -->

            <!-- BEGIN: Communications List -->
            <div class="intro-y box p-5 mt-5">
                <div class="flex flex-col sm:flex-row sm:items-end xl:items-start mb-5">
                    <form id="communications-filter-form" class="xl:flex sm:mr-auto">
                        <div class="sm:flex items-center sm:mr-4">
                            <label class="w-12 flex-none xl:w-auto xl:flex-initial mr-2">Type</label>
                            <select class="form-select w-full sm:w-32 2xl:w-full mt-2 sm:mt-0 sm:w-auto">
                                <option value="all">All Types</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="meeting">Meeting</option>
                                <option value="letter">Letter</option>
                            </select>
                        </div>
                        <div class="sm:flex items-center sm:mr-4 mt-2 xl:mt-0">
                            <label class="w-12 flex-none xl:w-auto xl:flex-initial mr-2">Date</label>
                            <input type="date" class="form-control sm:w-40 2xl:w-full mt-2 sm:mt-0">
                        </div>
                        <div class="mt-2 xl:mt-0">
                            <button type="button" class="btn btn-primary w-full sm:w-16">Search</button>
                            <button type="button" class="btn btn-secondary w-full sm:w-16 mt-2 sm:mt-0 sm:ml-1">Reset</button>
                        </div>
                    </form>
                </div>

                <!-- Communications Timeline -->
                <div class="mt-5">
                    <!-- Timeline Item -->
                    <div class="relative flex items-center mb-6">
                        <div class="w-12 h-12 flex-none image-fit">
                            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                                <i data-lucide="mail" class="w-5 h-5"></i>
                            </div>
                        </div>
                        <div class="ml-4 mr-auto">
                            <div class="font-medium">Email Communication</div>
                            <div class="text-slate-500 mt-1">Annual Report Follow-up</div>
                            <div class="text-slate-500 mt-1">By: Jane Smith</div>
                            <div class="text-xs text-slate-500 mt-1">2024-01-15 14:30</div>
                        </div>
                        <div class="flex">
                            <a href="javascript:;" class="btn btn-sm btn-secondary mr-2" data-tw-toggle="modal" data-tw-target="#view-communication-modal">View</a>
                        </div>
                    </div>

                    <!-- Timeline Item -->
                    <div class="relative flex items-center mb-6">
                        <div class="w-12 h-12 flex-none image-fit">
                            <div class="w-10 h-10 rounded-full bg-success flex items-center justify-center text-white">
                                <i data-lucide="phone" class="w-5 h-5"></i>
                            </div>
                        </div>
                        <div class="ml-4 mr-auto">
                            <div class="font-medium">Phone Call</div>
                            <div class="text-slate-500 mt-1">Quarterly Update Discussion</div>
                            <div class="text-slate-500 mt-1">By: John Smith</div>
                            <div class="text-xs text-slate-500 mt-1">2024-01-10 11:00</div>
                        </div>
                        <div class="flex">
                            <a href="javascript:;" class="btn btn-sm btn-secondary mr-2" data-tw-toggle="modal" data-tw-target="#view-communication-modal">View</a>
                        </div>
                    </div>
                </div>

                <!-- BEGIN: Pagination -->
                <div class="intro-y flex flex-wrap sm:flex-row sm:flex-nowrap items-center mt-6">
                    <nav class="w-full sm:w-auto sm:mr-auto">
                        <ul class="pagination">
                            <li class="page-item">
                                <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevrons-left"></i> </a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevron-left"></i> </a>
                            </li>
                            <li class="page-item active"> <a class="page-link" href="#">1</a> </li>
                            <li class="page-item"> <a class="page-link" href="#">2</a> </li>
                            <li class="page-item"> <a class="page-link" href="#">3</a> </li>
                            <li class="page-item">
                                <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevron-right"></i> </a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#"> <i class="w-4 h-4" data-lucide="chevrons-right"></i> </a>
                            </li>
                        </ul>
                    </nav>
                </div>
                <!-- END: Pagination -->
            </div>
            <!-- END: Communications List -->
        </div>
        <!-- END: Content -->
    </div>
</div>

<!-- BEGIN: Add Communication Modal -->
<div id="add-communication-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Add New Communication</h2>
            </div>
            <div class="modal-body grid grid-cols-12 gap-4">
                <div class="col-span-12">
                    <label for="comm-type" class="form-label">Communication Type</label>
                    <select id="comm-type" class="form-select">
                        <option value="email">Email</option>
                        <option value="phone">Phone Call</option>
                        <option value="meeting">Meeting</option>
                        <option value="letter">Letter</option>
                    </select>
                </div>
                <div class="col-span-12">
                    <label for="comm-subject" class="form-label">Subject</label>
                    <input id="comm-subject" type="text" class="form-control" placeholder="Enter subject">
                </div>
                <div class="col-span-12">
                    <label for="comm-notes" class="form-label">Notes</label>
                    <textarea id="comm-notes" class="form-control" rows="4" placeholder="Enter communication details"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20 mr-1">Cancel</button>
                <button type="button" class="btn btn-primary w-20">Save</button>
            </div>
        </div>
    </div>
</div>
<!-- END: Add Communication Modal -->

<!-- BEGIN: View Communication Modal -->
<div id="view-communication-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto">Communication Details</h2>
            </div>
            <div class="modal-body">
                <div class="mb-4">
                    <label class="form-label">Type</label>
                    <div class="text-slate-500">Email</div>
                </div>
                <div class="mb-4">
                    <label class="form-label">Subject</label>
                    <div class="text-slate-500">Annual Report Follow-up</div>
                </div>
                <div class="mb-4">
                    <label class="form-label">Date & Time</label>
                    <div class="text-slate-500">2024-01-15 14:30</div>
                </div>
                <div class="mb-4">
                    <label class="form-label">Staff Member</label>
                    <div class="text-slate-500">Jane Smith</div>
                </div>
                <div>
                    <label class="form-label">Notes</label>
                    <div class="text-slate-500">Discussed the annual report and upcoming funding opportunities. The donor expressed interest in supporting our education initiatives.</div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-secondary w-20">Close</button>
            </div>
        </div>
    </div>
</div>
<!-- END: View Communication Modal -->

<?php get_footer(); ?>
