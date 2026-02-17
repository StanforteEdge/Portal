<?php /* Template Name:  Staff: Requestss */
?>

<?php
get_header();
$b_link = '/home';
$b_title = 'Home';
$p_title = 'My Requests';

include get_template_directory() . "/layout/menu.php";

global $wpdb;
$requestTypes = $wpdb->get_results("SELECT a.name, a._ID FROM staff_jet_cct_request_types a");
$projects = $wpdb->get_results("SELECT * FROM staff_jet_cct_projects a");

?>

<div class="flex  flex-row justify-between">
    <h2 class="h-full py-5 font-medium flex align-center justify-start text-2xl">My Requests</h2>
    <div class="flex flex-row gap-2 items-center justify-end">
        <a href="/requests/new" class="btn btn-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" icon-name="plus" data-lucide="plus" class="lucide lucide-plus text-white block mr-2 ">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>New</a>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" id="mobile-sort" stroke-linejoin="round" icon-name="more-vertical" data-lucide="more-vertical" class="lucide md:hidden  lucide-more-vertical block mx-auto">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
        </svg>
    </div>
</div>


<div id="menu-sort" class="intro-y hidden md:flex sm:no-wrap flex-wrap w-full justify-between gap-6 mt-5">
    <div class="flex  flex-wrap sm:w-auto items-center justify-center md:justify-start align-center">
        <select id="show-type" class="w-32 mr-2 form-select box  sm:mt-0">
            <option value="" selected>All Requests Types </option>
            <?php foreach ($requestTypes as $requestType) : ?>
                <option value="<?= $requestType->_ID; ?>"><?= $requestType->name; ?></option>
            <?php endforeach; ?>
        </select>
        <select id="show-project" class="w-32 mr-2 form-select box  sm:mt-0">
            <option value="" selected>All Projects </option>
            <?php foreach ($projects as $project) : ?>
                <option value="<?= $project->_ID; ?>"><?= $project->title; ?></option>
            <?php endforeach; ?>
        </select>
    </div>
    <div id="show-count-div" class="justify-center flex py-2 text-slate-500  items-center mx-auto "><span class="show-count"></span>
    </div>
    <div class="flex items-center justify-center md:justify-end">
        <select id="show-orderby" class="w-32 mr-2 form-select box  sm:mt-0">
            <option value="" selected>Order By</option>
            <option value="a._ID">ID </option>
            <option value="a.type">Type </option>
            <option value="a.due_date">Due Date </option>
            <option value="a.amount">Amount</option>
            <option value="a.status">Status</option>
            <option value="a.project">Project</option>
        </select>
        <select id="show-order" class="w-20 mr-2 form-select box  sm:mt-0">
            <option value="" selected>Order</option>
            <option value="desc">DESC</option>
            <option value="asc">ASC</option>
        </select>
        <div class=" relative text-slate-500">
            <input id="table-search" type="text" class="form-control  box pr-3" placeholder="Search..." value="">
            <i class="w-4 h-4 absolute my-auto inset-y-0 mr-3 right-0" data-lucide="search"></i>
        </div>
    </div>
</div>

<!-- BEGIN: Data List -->
<div class="intro-y col-span-12 mt-5 pt-5 overflow-auto lg:overflow-visible">
    <div id="show-count-div" class="justify-center flex md:hidden mobile-sort text-slate-500  items-center mx-auto "><span class="show-count"></span>
    </div>
    <table class="table table-report -mt-2">
        <thead>
            <tr>
                <th class="whitespace-nowrap">Request</th>
                <th class="text-center whitespace-nowrap">Amount</th>
                <th class="text-center whitespace-nowrap">Date</th>
                <th class="text-center whitespace-nowrap">Project</th>
                <th class="text-center whitespace-nowrap">Due Date</th>
                <th class="text-center whitespace-nowrap">Status</th>
            </tr>
        </thead>
        <tbody id="table-list">
        </tbody>
    </table>
</div>
<!-- END: Data List -->
<!-- BEGIN: Pagination -->

<div class="intro-y mt-3 flex flex-row justify-between">
    <select id="show-limit" class="w-20 mr-2 form-select box  sm:mt-0">
        <option value="10" selected>10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
    </select>
    <div class="flex">
        <button id="first-page" class=" btn m-1 " type="button"><i class="w-4 h-4" data-lucide="chevrons-left"></i> </a></button>
        <button id="previous-page" class=" btn m-1 " type="button"><i class="w-4 h-4" data-lucide="chevron-left"></i> </a></button>
        <div id="pagination" class="flex">
        </div>
        <button id="next-page" class=" btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevron-right"></i> </a></button>
        <button id="last-page" class=" btn m-1" type="button"><i class="w-4 h-4" data-lucide="chevrons-right"></i> </a></button>
    </div>
</div>

<!-- END: Pagination -->
<!-- END: Content -->
</div>
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
             perPage: 10,
             currentPage: 1,
             type: "",
             project: "",
             order: 'DESC',
             orderBy: '_ID',
             searchTerm: "",
             totalPages: "",
             totalResults: "",
             staff: <?= $staff->_ID; ?>,
             fetchUrl: 'https://staff.stanforteedge.com/wp-json/api/v1/requests'
         }, true)


         let queryData = getStorage("queryData");

         function fetchData(obj) {
             $.get(obj.fetchUrl, {
                     _search: obj.searchTerm,
                     _orderby: obj.orderBy,
                     _per_page: obj.perPage,
                     _order: obj.order,
                     _page: obj.currentPage,
                     _type: obj.type,
                     _project: obj.project,
                     _staff: obj.staff
                 })
                 .done(function(data) {
                     updateResultDiv(data);
                 })
                 .fail(function() {
                     $('tbody, #table-list').html('<tr><td colspan="7" class="text-center whitespace-nowrap">No requests found.</td></tr>');
                 });
         }


         fetchData({
             ...queryData
         })

         function checkStatus(status) {
             let stat;
             if (status == 1) {
                 stat = '<div class="text-warning">Draft</div>';
             } else if (status == 2) {
                 stat = '<div class="text-pending">Pending - Team Lead</div>';
             } else if (status == 3) {
                 stat = '<div class="text-danger">Unapproved - Team Lead</div>';
             } else if (status == 4) {
                 stat = '<div class="text-pending">Pending - Accounts</div>';
             }else if (status == 5) {
                 stat = '<div class="text-danger">Unapproved</div>';
             }else if (status == 6) {
                 stat = '<div class="text-pending">Pending - COO</div>';
             }else if (status == 7) {
                 stat = '<div class="text-danger">Unapproved</div>';
             }else if (status == 8) {
                 stat = '<div class="text-pending">Pending - ED</div>';
             }else if (status == 9) {
                 stat = '<div class="text-danger">Unapproved</div>';
             }else if (status == 10) {
                 stat = '<div class="text-success">Un-disbursed</div>';
             }else if (status == 11) {
                 stat = '<div class="text-success">Disbursed</div>';
             }else if (status == 12) {
                 stat = '<div class="text-success">Received</div>';
             }else if (status == 13) {
                 stat = '<div class="text-primary">Retired</div>';
             }else if (status == 14) {
                 stat = '<div class="text-primary">Completed</div>';
             } else {
                 '<div class="btn-secondry">Draft</div>';
             }

             return stat;
         }

         function formatCode(code, number) {

             var paddedNumber = number.toString();
             while (paddedNumber.length < 5) {
                 paddedNumber = "0" + paddedNumber;
             }

             var formattedCodeNumber = code + paddedNumber;
             return formattedCodeNumber;
         }

    //      Function to format amount as currency with commas and naira sign
        function formatAmount(amount) {
            // Convert string to a number if possible
            if (typeof amount === 'string' && !isNaN(parseFloat(amount))) {
                amount = parseFloat(amount);
            }

            // Check if amount is a number
            if (typeof amount === 'number') {
                // Format amount with commas
                return '₦' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            } else {
                // Return error message if amount is not a number
                return 'Invalid amount';
            }
        }

        function updateResultDiv(data) {
            storageData = getStorage("queryData")
            storageData.currentPage = data.current_page;
            storageData.totalPages = data.total_pages;
            storageData.totalResults = data.total_results;
            setStorage("queryData", storageData, true)
            let paginationContainer = $('#pagination');
            let patientList = $('tbody, #table-list');
            patientList.html("")
            let showCount = $('.show-count');

            renderPagination(storageData.currentPage, storageData.totalPages);
            showResultCount(showCount);
            // Iterate over the data and append each item to the table
            $.each(data.results, function(index, request) {
                // check if the document has the properties you need

                $('#table-list').append('<tr><td class="text-start whitespace-nowrap"><a href="/requests/request/?id=' + request._ID + '" class="underline font-medium decoration-dotted ml-1" target="_blank">' + formatCode(request.code, request._ID) + '</a></td><td class="text-center whitespace-nowrap">' + formatAmount(request.amount) + '</td><td class="text-center whitespace-nowrap">' + formatDate(request.cct_created) + '</td><td class="text-center">' + (request.project_title ? request.project_title : "None" ) + '</td><td class="w-40">' + formatDate(request.due_date) + '</td><td class="table-report__action text-center w-56">' + checkStatus(request.status) + '</tr>');
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

        // Add event listener for order by select
        $('#show-type').on('change', function() {
            let storageData = getStorage("queryData");
            let type = $(this).val();
            storageData.type = type;
            setStorage("queryData", storageData);
            fetchData(storageData);
        });

        // Add event listener for order by select
        $('#show-project').on('change', function() {
            let storageData = getStorage("queryData");
            let project = $(this).val();
            storageData.project = project;
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

        $('#mobile-sort').on("click", function() {
            $('#menu-sort').toggleClass("hidden border-b pb-3");
            $('#add-sort').toggleClass("hidden");
            $('.mobile-sort').toggleClass("hidden");
        });

    });
</script>


<?php get_footer(); ?>