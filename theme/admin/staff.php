<?php /* Template Name:  Admin: Staff */


?>

<?php
get_header();
$p_title = 'Dashboard';
$b_link = '/admin';
$b_title = 'Staff';

include get_template_directory() . "/layout/menu.php";

?>


<h2 class="intro-y text-lg font-medium mt-10">
    Staff
</h2>
<div class="intro-y flex flex-wrap justify-between gap-6 mt-5">

    <div class="flex w-full sm:w-auto justify-center align-center">
        <select id="show-limit" class="w-20 mr-2 form-select box  sm:mt-0">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
        </select>

        <select id="show-orderby" class="w-20 mr-2 form-select box  sm:mt-0">
            <option value="_ID">ID</option>
            <option value="first_name">First Name</option>
            <option value="last_name">Last Name</option>
            <option value="email">Email</option>
            <option value="state">State</option>
            <option value="education">Education</option>
            <option value="employment">Employment</option>
        </select>
        <select id="show-order" class="w-20 mr-2 form-select box  sm:mt-0">
            <option value="asc">ASC</option>
            <option value="desc">DESC</option>
        </select>
    </div>
    <div id="show-count" class="justify-center flex w-full lg:w-auto order-last items-center order-3 lg:order-2 mx-auto text-slate-500"></div>
    <div class=" flex justify-between flex-wrap gap-y-3 lg:order-last sm:w-auto mt-3 sm:mt-0 sm:ml-auto md:ml-0">
        <div class=" relative text-slate-500">
            <input id="table-search" type="text" class="form-control  box pr-10" placeholder="Search..." value="">
            <i class="w-4 h-4 absolute my-auto inset-y-0 mr-3 right-0" data-lucide="search"></i>
        </div>
        <a href="/admin/staff-add"><button class="btn btn-primary shadow-md ml-2">Add New Staff</button></a>
        <a href="/dietitian/appointments/add"><button class="btn hidden btn-primary shadow-md ml-2 ">Add Appointment</button></a>
    </div>
</div>
<!-- BEGIN: Data List -->
<div id="data-list" class="grid grid-cols-2 gap-6 mt-5 mb-5">
</div>
<!-- BEGIN: Pagination -->

<div class="flex">
    <button id="first-page" class=" btn m-1 " type="button"><i class="w-4 h-4" data-lucide="chevrons-left"></i> </a></button>
    <button id="previous-page" class=" btn m-1 " type="button"><i class="w-4 h-4" data-lucide="chevron-left"></i> </a></button>
    <div id="pagination" class="flex">
    </div>
    <button id="next-page" class=" btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevron-right"></i> </a></button>
    <button id="last-page" class=" btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevrons-right"></i> </a></button>
</div>

<!-- END: Pagination -->
<!-- END: Content -->
</div>
</div>

<div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
    <table class="table table-report -mt-2">
        <thead>
            <tr>
                <th class="whitespace-nowrap">STAFF NAME</th>
                <th class="whitespace-nowrap">TEAM</th>
                <th class="text-center whitespace-nowrap">STAFF TYPE</th>
                <th class="text-center whitespace-nowrap">STATUS</th>
                <th class="text-center whitespace-nowrap">ACTIONS</th>
            </tr>
        </thead>
        <tbody>
            <?php
            global $wpdb;
            $staff = $wpdb->get_results("SELECT a.*, b.name as team_name, c.name as staff_type 
                                       FROM staff_jet_cct_profiles a 
                                       LEFT JOIN staff_jet_cct_teams b ON b._ID = a.team 
                                       LEFT JOIN staff_jet_cct_staff_types c ON c._ID = a.staff_type
                                       ORDER BY a.first_name ASC");
            foreach ($staff as $member) :
            ?>
                <tr class="intro-x">
                    <td>
                        <a href="/admin/staff-view?id=<?= $member->_ID ?>" class="font-medium whitespace-nowrap"><?= $member->first_name . ' ' . $member->last_name ?></a>
                        <div class="text-slate-500 text-xs whitespace-nowrap mt-0.5"><?= $member->email ?></div>
                    </td>
                    <td>
                        <div class="font-medium whitespace-nowrap"><?= $member->team_name ?></div>
                    </td>
                    <td class="text-center"><?= $member->staff_type ?></td>
                    <td class="w-40">
                        <div class="flex items-center justify-center <?= $member->status == 1 ? 'text-success' : 'text-danger' ?>">
                            <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> <?= $member->status == 1 ? 'Active' : 'Inactive' ?>
                        </div>
                    </td>
                    <td class="table-report__action w-56">
                        <div class="flex justify-center items-center">
                            <a class="flex items-center mr-3" href="/admin/staff-view?id=<?= $member->_ID ?>">
                                <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View
                            </a>
                            <a class="flex items-center mr-3" href="/admin/staff-edit?id=<?= $member->_ID ?>">
                                <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Edit
                            </a>
                        </div>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<script>
    //get results on page load
    jQuery(document).ready(function($) {

        function getStorage(key, obj = true) {
            if (obj) {
                const value = localStorage.getItem(key)
                return JSON.parse(value)
            }
            return localStorage.getItem(key)
        }

        function setStorage(key, item, obj = true) {
            if (obj) {
                localStorage.setItem(key, JSON.stringify(item))
                return
            }
            localStorage.setItem(key, item)
        }

        function removeStorage(key, item, obj = true) {
            if (obj) {
                let data = JSON.parse(localStorage.getItem(key))
                delete data[`${item}`]
                localStorage.setItem(key, JSON.stringify(data))

            }

            localStorage.removeItem(key)
        }

        

        setStorage("queryData", {
            perPage: 20,
            currentPage: 1,
            order: 'ASC',
            orderBy: 'first_name',
            searchTerm: "",
            totalPages: "",
            totalResults: "",
            fetchUrl: 'https://staff.stanforteedge.com/wp-json/api/v1/profiles'
        }, true)


        let queryData = getStorage("queryData");

        function fetchData(obj) {
            $.get(obj.fetchUrl, {
                _search: obj.searchTerm,
                _orderby: obj.orderBy,
                _per_page: obj.perPage,
                _order: obj.order,
                _page: obj.currentPage,
            }, function(data) {
                console.log(data);
                console.log('here');
                updateResultDiv(data);
            });
        }


        fetchData({
            ...queryData
        })

        function updateResultDiv(data) {
            storageData = getStorage("queryData")
            storageData.currentPage = data.current_page;
            storageData.totalPages = data.total_pages;
            storageData.totalResults = data.total_results;
            setStorage("queryData", storageData, true)
            let paginationContainer = $('#pagination');
            let patientList = $('data-list');
            patientList.html("")
            let showCount = $('#show-count');

            renderPagination(storageData.currentPage, storageData.totalPages);
            showResultCount(showCount);
            // Iterate over the data and append each item to the table
            $.each(data.results, function(index, staff) {
                // check if the staff has the properties you need

                console.log(staff.status);
                let status = "";
                if (staff.status == 1){
                    status = 'Active';
                }else if(staff.status == 2){
                    status = 'Inactive';
                }

                // check if the item has the properties you need
                $('#data-list').append(`
                    <div class="flex-col">
                        <div class="intro-y col-span-12 md:col-span-6">
                            <div class="box">
                                <div class="flex flex-col lg:flex-row items-center p-5">
                                    <div class="w-24 h-24 lg:w-12 lg:h-12 image-fit lg:mr-1">
                                        <img alt="CYFAAN Image" class="rounded-full" src="${staff.pic ? staff.pic : 'https://staff.stanforteedge.com/wp-content/uploads/2024/02/user.png'}">
                                    </div>
                                    <div class="lg:ml-2  lg:mr-auto text-center lg:text-left mt-3 lg:mt-0">
                                        <a  class="font-medium" href="">${staff.first_name} ${staff.last_name}</a> 
                                        <div class=" flex  mt-0.5"><div class="text-slate-500 pl-1 bl text-xs mt-0.5">${staff.position}</div> 
                                        </div>
                                   </div>
                                <div class="flex mt-4 lg:mt-0">
                                    <a class="btn btn-outline-secondary py-1 px-2" href="/admin/staff/view?id=${staff._ID}">View</a>
                                </div>
                            </div>
                        </div>
                    </div>`);
            });
        }

        function showResultCount(showCount) {
            const storageData = getStorage("queryData")

            const setCount = (obj) => {
                if (!obj.totalResults) {
                    showCount.html('No results found');
                } else {

                    if (obj.totalResults >= obj.perPage) {
                        if (obj.currentPage === 1) {
                            showCount.html(`Showing 1 to ${obj.perPage} of ${obj.totalResults} entries`);
                        } else if (obj.currentPage === obj.totalPages) {
                            showCount.html(`Showing ${((obj.currentPage-1)*obj.perPage)+1} to ${obj.totalResults}  of ${obj.totalResults}entries`);

                        } else {
                            showCount.html(`Showing ${((obj.currentPage-1)*obj.perPage)+1} to ${obj.perPage*obj.currentPage}  of ${obj.totalResults}entries`);
                        }

                    } else {
                        showCount.html('Showing 1 to ' + obj.totalResults + ' of ' + obj.totalResults + ' entries');
                    }

                }
            }
            setCount(storageData)

        }

        function compareDates(date) {
            var currentDate = new Date();
            var inputDate = new Date(inputDate);
            if (currentDate < inputDate) {
                return '<div class="flex items-center justify-center text-success">Upcoming</div>';
            } else {
                return '<div class="flex items-center justify-center text-success">Past</div>';
            }
        }

        function secondsTo12HourTime(seconds) {
            var hours = Math.floor(seconds / 60);
            var minutes = Math.floor((seconds % 3600) / 60);

            // Use the modulo operator to get the number of hours in the 12-hour format
            const hour12 = hours % 12;

            // If the hour is 0, then it should be 12
            const hour12String = hour12 === 0 ? "12" : hour12.toString();

            // Use the ternary operator to determine if the time is AM or PM
            const ampm = hours < 12 ? "AM" : "PM";

            return `${hour12String} ${ampm}`;
        }

        function formatDate(dateString) {
            // Parse the date string and create a Date object
            const date = new Date(dateString);

            // Use the toLocaleDateString method to format the date as a string
            const formattedDate = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            });

            return formattedDate;
        }
        // Function to create and render pagination numbers
        function renderPagination(currentPage, totalPages) {
            var paginationContainer = $('#pagination');
            paginationContainer.html("");
            var startPage, endPage;
            if (totalPages <= 5) {
                startPage = 1;
                endPage = totalPages;
            } else {
                if (currentPage <= 3) {
                    startPage = 1;
                    endPage = 5;
                } else if (currentPage + 2 >= totalPages) {
                    startPage = totalPages - 4;
                    endPage = totalPages;
                } else {
                    startPage = currentPage - 2;
                    endPage = currentPage + 2;
                }
            }

            for (var i = startPage; i <= endPage; i++) {
                var paginationNumber = $('<button>').text(i).addClass('page-item btn m-1');
                paginationNumber.attr('type', 'button');
                paginationNumber.attr('data-page', i);
                if (i === currentPage) {
                    paginationNumber.addClass('btn-primary');
                }
                paginationNumber.on('click', function() {
                    let currentPage = $(this).text();
                    let storageData = getStorage("queryData")
                    storageData.currentPage = currentPage;
                    setStorage("queryData", storageData);
                    fetchData({
                        ...storageData
                    })
                });
                paginationContainer.append(paginationNumber);
            }
        }

        $('#first-page').on('click', function() {
            currentPage = 1;
            let storageData = getStorage("queryData")
            storageData.currentPage = currentPage
            setStorage("queryData", storageData);
            fetchData(storageData);
            $('#previous-page').addClass("hidden");
            $('#next-page').removeClass("hidden");
        });

        $('#previous-page').on('click', function() {
            let storageData = getStorage("queryData")

            if (storageData.currentPage == 1) {
                $('#previous-page').addClass("hidden");
                storageData.currentPage = 1;

            } else {
                $('#previous-page').removeClass("hidden");
                storageData.currentPage = Math.floor(storageData.currentPage - 1);
            }
            setStorage("queryData", storageData);
            fetchData(storageData);
            $('#next-page').removeClass("hidden");
        });

        $('#next-page').on('click', function() {
            let storageData = getStorage("queryData")
            if (storageData.currentPage === storageData.totalPages) {
                $('#next-page').addClass("hidden");
                storageData.currentPage = storageData.totalPages;
            } else {
                $('#previous-page').removeClass("hidden");
                storageData.currentPage = Math.floor(storageData.currentPage + 1);
            }
            setStorage("queryData", storageData);
            fetchData(storageData);
        });

        $('#last-page').on('click', function() {
            let storageData = getStorage("queryData")
            let currentPage = storageData.totalPages;
            storageData.currentPage = currentPage
            setStorage("queryData", storageData);
            fetchData(storageData);
            $('#next-page').addClass("hidden");
            $('#previous-page').removeClass("hidden");
        });

        function delay(fn, ms) {
            let timer = 0
            return function(...args) {
                clearTimeout(timer)
                timer = setTimeout(fn.bind(this, ...args), ms || 0)
            }
        }

        // Add event listener for search input
        $('#table-search').keyup(delay(function(e) {
            let storageData = getStorage("queryData");
            let searchTerm = $(this).val();
            storageData.searchTerm = searchTerm;
            setStorage("queryData", storageData);
            fetchData(storageData)
        }, 500));

        // Add event listener for order by select
        $('#show-orderby').on('change', function() {
            let storageData = getStorage("queryData");
            let orderBy = $(this).val();
            storageData.orderBy = orderBy;
            setStorage("queryData", storageData);
            fetchData(storageData);
        });

        // Add event listener for Order select
        $('#show-order').on('change', function() {
            let storageData = getStorage("queryData");
            let order = $(this).val();
            storageData.order = order;
            setStorage("queryData", storageData);
            fetchData(storageData);
        });

        // Add event listener for Order select
        $('#show-limit').on('change', function() {
            let storageData = getStorage("queryData");
            let perPage = $(this).val();
            storageData.perPage = perPage;
            storageData.currentPage = 1;
            setStorage("queryData", storageData);
            fetchData(storageData);
        });

    });
</script>

<?php get_footer(); ?>