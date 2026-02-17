<?php /* Template Name:  Team: Projects */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = 'My Projects';

include get_template_directory() . "/layout/menu.php";

global $wpdb;
$projects = $wpdb->get_results("SELECT * FROM staff_jet_cct_projects a");
?>

<div class="flex flex-row justify-between">
    <h2 class="h-full py-5 font-medium flex align-center justify-start text-2xl">My Projects</h2>
    <div class="flex flex-row gap-2 items-center justify-end">
        <a href="/projects/new" class="btn btn-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="plus" data-lucide="plus" class="lucide lucide-plus text-white block mr-2 ">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>New</a>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" id="mobile-sort" stroke-linejoin="round" icon-name="more-vertical" data-lucide="more-vertical" class="lucide md:hidden lucide-more-vertical block mx-auto">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
        </svg>
    </div>
</div>

<div id="menu-sort" class="intro-y hidden md:flex sm:no-wrap flex-wrap w-full justify-between gap-6 mt-5">
    <div class="flex flex-wrap sm:w-auto items-center justify-center md:justify-start align-center">
        <select id="show-type" class="w-32 mr-2 form-select box sm:mt-0">
            <option value="" selected>All Project Types</option>
            <?php foreach ($projectTypes as $projectType) : ?>
                <option value="<?= $projectType->_ID; ?>"><?= $projectType->name; ?></option>
            <?php endforeach; ?>
        </select>
        <select id="show-department" class="w-32 mr-2 form-select box sm:mt-0">
            <option value="" selected>All Departments</option>
            <?php foreach ($departments as $department) : ?>
                <option value="<?= $department->_ID; ?>"><?= $department->name; ?></option>
            <?php endforeach; ?>
        </select>
    </div>
    <div id="show-count-div" class="justify-center flex py-2 text-slate-500 items-center mx-auto"><span class="show-count"></span>
    </div>
    <div class="flex items-center justify-center md:justify-end">
        <select id="show-orderby" class="w-32 mr-2 form-select box sm:mt-0">
            <option value="" selected>Order By</option>
            <option value="a._ID">ID</option>
            <option value="a.type">Type</option>
            <option value="a.start_date">Start Date</option>
            <option value="a.end_date">End Date</option>
            <option value="a.status">Status</option>
            <option value="a.department">Department</option>
        </select>
        <select id="show-order" class="w-20 mr-2 form-select box sm:mt-0">
            <option value="" selected>Order</option>
            <option value="desc">DESC</option>
            <option value="asc">ASC</option>
        </select>
        <div class="relative text-slate-500">
            <input id="table-search" type="text" class="form-control box pr-3" placeholder="Search..." value="">
            <i class="w-4 h-4 absolute my-auto inset-y-0 mr-3 right-0" data-lucide="search"></i>
        </div>
    </div>
</div>

<!-- BEGIN: Data List -->
<div class="intro-y col-span-12 mt-5 pt-5 overflow-auto lg:overflow-visible">
    <div id="show-count-div" class="justify-center flex md:hidden mobile-sort text-slate-500 items-center mx-auto"><span class="show-count"></span>
    </div>
    <table class="table table-report -mt-2">
        <thead>
            <tr>
                <th class="whitespace-nowrap">ID</th>
                <th class="text-center whitespace-nowrap">Title</th>
            </tr>
        </thead>
        <tbody id="table-list">
            <?php foreach ($projects as $project) : ?>
                <tr>
                    <td class="text-center whitespace-nowrap"><?= $project->_ID; ?></td>
                    <td class="text-start whitespace-nowrap"><?= $project->title; ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<!-- BEGIN: Pagination -->
<div class="intro-y mt-3 flex flex-row justify-between">
    <select id="show-limit" class="w-20 mr-2 form-select box sm:mt-0">
        <option value="10" selected>10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
    </select>
    <div class="flex">
        <button id="first-page" class="btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevrons-left"></i></button>
        <button id="previous-page" class="btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevron-left"></i></button>
        <div id="pagination" class="flex">
        </div>
        <button id="next-page" class="btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevron-right"></i></button>
        <button id="last-page" class="btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevrons-right"></i></button>
    </div>
</div>

<script>
    // jQuery(document).ready(function($) {
    //     function getStorage(key, obj = true) {
    //         if (obj) {
    //             const value = localStorage.getItem(key)
    //             return JSON.parse(value)
    //         }
    //         return localStorage.getItem(key)
    //     }

    //     function setStorage(key, item, obj = true) {
    //         if (obj) {
    //             localStorage.setItem(key, JSON.stringify(item))
    //             return
    //         }
    //         localStorage.setItem(key, item)
    //     }

    //     function removeStorage(key, item, obj = true) {
    //         if (obj) {
    //             let data = JSON.parse(localStorage.getItem(key))
    //             delete data[`${item}`]
    //             localStorage.setItem(key, JSON.stringify(data))
    //         }
    //         localStorage.removeItem(key)
    //     }

    //     setStorage("queryData", {
    //         perPage: 10,
    //         currentPage: 1,
    //         type: "",
    //         department: "",
    //         order: 'DESC',
    //         orderBy: '_ID',
    //         searchTerm: "",
    //         totalPages: "",
    //         totalResults: "",
    //         staff: <?= $staff->_ID; ?>,
    //         fetchUrl: 'https://staff.stanforteedge.com/wp-json/api/v1/projects'
    //     }, true)

    //     let queryData = getStorage("queryData");

    //     function fetchData(obj) {
    //         $.get(obj.fetchUrl, {
    //                 _search: obj.searchTerm,
    //                 _orderby: obj.orderBy,
    //                 _per_page: obj.perPage,
    //                 _order: obj.order,
    //                 _page: obj.currentPage,
    //                 _type: obj.type,
    //                 _department: obj.department,
    //                 _staff: obj.staff
    //             })
    //             .done(function(data) {
    //                 updateResultDiv(data);
    //             })
    //             .fail(function() {
    //                 $('tbody, #table-list').html('<tr><td colspan="7" class="text-center whitespace-nowrap">No projects found.</td></tr>');
    //             });
    //     }

    //     fetchData({
    //         ...queryData
    //     })

    //     function checkStatus(status) {
    //         let stat;
    //         if (status == 1) {
    //             stat = '<div class="text-warning">Planning</div>';
    //         } else if (status == 2) {
    //             stat = '<div class="text-pending">In Progress</div>';
    //         } else if (status == 3) {
    //             stat = '<div class="text-success">Completed</div>';
    //         } else if (status == 4) {
    //             stat = '<div class="text-danger">On Hold</div>';
    //         } else if (status == 5) {
    //             stat = '<div class="text-danger">Cancelled</div>';
    //         }
    //         return stat;
    //     }

    //     function updateResultDiv(data) {
    //         storageData = getStorage("queryData")
    //         storageData.currentPage = data.current_page;
    //         storageData.totalPages = data.total_pages;
    //         storageData.totalResults = data.total_results;
    //         setStorage("queryData", storageData)

    //         $('.show-count').html(data.total_results + ' Results Found');

    //         if (data.results.length > 0) {
    //             var html = '';
    //             data.results.forEach(function(item) {
    //                 html += `<tr class="intro-x">
    //                     <td class="w-40">
    //                         <a href="/project/${item._ID}" class="font-medium whitespace-nowrap">${item.title}</a>
    //                     </td>
    //                     <td class="text-center">${item.type_name}</td>
    //                     <td class="text-center">${item.department_name}</td>
    //                     <td class="text-center">${item.start_date}</td>
    //                     <td class="text-center">${item.end_date}</td>
    //                     <td class="w-40 text-center">
    //                         ${checkStatus(item.status)}
    //                     </td>
    //                 </tr>`;
    //             });
    //             $('#table-list').html(html);
    //         } else {
    //             $('#table-list').html('<tr><td colspan="7" class="text-center whitespace-nowrap">No projects found.</td></tr>');
    //         }

    //         renderPagination(data.current_page, data.total_pages);
    //     }

    //     function renderPagination(currentPage, totalPages) {
    //         var paginationContainer = $('#pagination');
    //         paginationContainer.html("");
    //         var startPage, endPage;
    //         if (totalPages <= 5) {
    //             startPage = 1;
    //             endPage = totalPages;
    //         } else {
    //             if (currentPage <= 3) {
    //                 startPage = 1;
    //                 endPage = 5;
    //             } else if (currentPage + 2 >= totalPages) {
    //                 startPage = totalPages - 4;
    //                 endPage = totalPages;
    //             } else {
    //                 startPage = currentPage - 2;
    //                 endPage = currentPage + 2;
    //             }
    //         }

    //         for (var i = startPage; i <= endPage; i++) {
    //             var activeClass = i === currentPage ? 'btn-primary' : '';
    //             paginationContainer.append(`<button class="btn m-1 ${activeClass} page-number" data-page="${i}">${i}</button>`);
    //         }
    //     }

    //     $('#show-type').on('change', function() {
    //         let storageData = getStorage("queryData");
    //         let type = $(this).val();
    //         storageData.type = type;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $('#show-department').on('change', function() {
    //         let storageData = getStorage("queryData");
    //         let department = $(this).val();
    //         storageData.department = department;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $('#show-orderby').on('change', function() {
    //         let storageData = getStorage("queryData");
    //         let orderby = $(this).val();
    //         storageData.orderBy = orderby;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $('#show-order').on('change', function() {
    //         let storageData = getStorage("queryData");
    //         let order = $(this).val();
    //         storageData.order = order;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $('#show-limit').on('change', function() {
    //         let storageData = getStorage("queryData");
    //         let perPage = $(this).val();
    //         storageData.perPage = perPage;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $('#table-search').on('keyup', function() {
    //         let storageData = getStorage("queryData");
    //         let searchTerm = $(this).val();
    //         storageData.searchTerm = searchTerm;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $(document).on('click', '.page-number', function() {
    //         let storageData = getStorage("queryData");
    //         let page = $(this).data('page');
    //         storageData.currentPage = page;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $('#first-page').on('click', function() {
    //         let storageData = getStorage("queryData");
    //         storageData.currentPage = 1;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });

    //     $('#previous-page').on('click', function() {
    //         let storageData = getStorage("queryData");
    //         if (storageData.currentPage > 1) {
    //             storageData.currentPage--;
    //             setStorage("queryData", storageData);
    //             fetchData(storageData);
    //         }
    //     });

    //     $('#next-page').on('click', function() {
    //         let storageData = getStorage("queryData");
    //         if (storageData.currentPage < storageData.totalPages) {
    //             storageData.currentPage++;
    //             setStorage("queryData", storageData);
    //             fetchData(storageData);
    //         }
    //     });

    //     $('#last-page').on('click', function() {
    //         let storageData = getStorage("queryData");
    //         storageData.currentPage = storageData.totalPages;
    //         setStorage("queryData", storageData);
    //         fetchData(storageData);
    //     });
    // });
</script>

<?php get_footer(); ?>
