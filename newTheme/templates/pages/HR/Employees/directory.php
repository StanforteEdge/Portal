<?php
/**
 * Template Name: HR: Employee Directory
 * Description: Employee listing and management for HR
 */

$pageTitle = 'Employee Directory';
$breadcrumb = [
    ['name' => 'Dashboard', 'url' => home_url('/dashboard')],
    ['name' => 'HR', 'url' => home_url('/hr/employees')],
    ['name' => 'Employees']
];
$activeMenu = 'hr-employees';
$requiredRoles = ['hr.employees.view'];

get_header();
?>

<!-- NETWORK ERROR DEBUG -->
<div id="network-err" class="hidden mb-4 alert alert-danger">
    <strong>API Error:</strong> <span id="network-err-msg"></span>
</div>

<!-- EMPLOYEE DIRECTORY -->
<div id="view-employees">
    <div class="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 class="text-lg font-medium mr-auto">
            Employees
        </h2>
        <div class="w-full sm:w-auto flex mt-4 sm:mt-0 gap-2">
            <button id="btn-refresh" class="btn btn-secondary shadow-md">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            </button>
            <a href="<?php echo home_url('/hr/employees/add'); ?>" class="btn btn-primary shadow-md">
                <i data-lucide="user-plus" class="w-4 h-4 mr-2"></i> Add Employee
            </a>
        </div>
    </div>

    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Filters -->
        <div class="intro-y col-span-12 flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div class="hidden md:block text-slate-500">
                Showing <span id="employee-count">0</span> employees
            </div>
            <div class="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto md:ml-0 flex gap-2 flex-wrap">
                <!-- Search -->
                <div class="w-56 relative text-slate-500">
                    <input type="text" id="search-input" class="form-control w-56 box pr-10"
                        placeholder="Search employees...">
                    <i data-lucide="search" class="w-4 h-4 absolute my-auto inset-y-0 right-0 mr-3"></i>
                </div>

                <!-- Department Filter -->
                <select id="filter-department" class="form-select w-48">
                    <option value="">All Departments</option>
                </select>

                <!-- Status Filter -->
                <select id="filter-status" class="form-select w-40">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                </select>

                <!-- Employment Type Filter -->
                <select id="filter-type" class="form-select w-40">
                    <option value="">All Types</option>
                    <option value="staff">Staff</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                    <option value="consultant">Consultant</option>
                    <option value="management">Management</option>
                </select>
            </div>
        </div>

        <!-- TABLE -->
        <div class="intro-y col-span-12 overflow-auto lg:overflow-visible">
            <table class="table table-report -mt-2">
                <thead>
                    <tr>
                        <th class="whitespace-nowrap">EMPLOYEE</th>
                        <th class="whitespace-nowrap">EMPLOYEE ID</th>
                        <th class="whitespace-nowrap">POSITION</th>
                        <th class="whitespace-nowrap">DEPARTMENT</th>
                        <th class="text-center whitespace-nowrap">STATUS</th>
                        <th class="text-center whitespace-nowrap">ACTIONS</th>
                    </tr>
                </thead>
                <tbody id="employee-table-body">
                    <!-- Populated via JS -->
                </tbody>
            </table>
            <div id="employee-loading" class="p-8 text-center text-gray-500">Loading employees...</div>
            <div id="employee-empty" class="hidden p-8 text-center text-gray-500">
                No employees found.
                <a href="<?php echo home_url('/hr/employees/add'); ?>" class="text-primary">Add your first employee</a>
            </div>
        </div>

        <!-- Pagination -->
        <div id="pagination-container"
            class="intro-y col-span-12 flex flex-wrap sm:flex-row sm:flex-nowrap items-center hidden">
            <nav class="w-full sm:w-auto sm:mr-auto">
                <ul class="pagination" id="pagination-list">
                    <!-- Populated via JS -->
                </ul>
            </nav>
            <select id="per-page-select" class="w-20 form-select box mt-3 sm:mt-0">
                <option value="10">10</option>
                <option value="20" selected>20</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
        </div>
    </div>
</div>

<script>
    (function ($) {
        'use strict';

        // Config
        const API = {
            employees: '/wp-json/api/v1/hr/employees',
            departments: '/wp-json/api/v1/taxonomy-terms?taxonomy_slug=departments'
        };

        // State
        const state = {
            employees: [],
            departments: [],
            filters: {
                search: '',
                department: '',
                status: '',
                employment_type: ''
            },
            pagination: {
                page: 1,
                perPage: 20,
                total: 0,
                totalPages: 0
            }
        };

        // --- INIT ---
        async function init() {
            await loadDepartments();
            await loadEmployees();
            bindEvents();
        }

        // --- LOAD DATA ---
        async function loadDepartments() {
            try {
                const res = await window.ApiClient.get(API.departments);
                state.departments = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                renderDepartmentFilter();
            } catch (e) {
                console.warn('Departments load failed', e);
            }
        }

        async function loadEmployees() {
            $('#employee-loading').show();
            $('#employee-table-body').empty();
            $('#employee-empty').hide();
            $('#pagination-container').addClass('hidden');

            try {
                // Build query params
                const params = new URLSearchParams();
                params.append('page', state.pagination.page);
                params.append('per_page', state.pagination.perPage);

                if (state.filters.search) params.append('search', state.filters.search);
                if (state.filters.department) params.append('department', state.filters.department);
                if (state.filters.status) params.append('status', state.filters.status);
                if (state.filters.employment_type) params.append('employment_type', state.filters.employment_type);

                const res = await window.ApiClient.get(`${API.employees}?${params.toString()}`);

                state.employees = res.data?.data || [];
                state.pagination.total = res.data?.total || 0;
                state.pagination.totalPages = res.data?.total_pages || 0;

                renderEmployees();
                renderPagination();
            } catch (err) {
                console.error(err);
                $('#network-err').removeClass('hidden').find('span').text(err.message || 'Failed to load employees');
            } finally {
                $('#employee-loading').hide();
            }
        }

        // --- RENDER ---
        function renderDepartmentFilter() {
            const $select = $('#filter-department');
            $select.find('option:not(:first)').remove();

            state.departments.forEach(dept => {
                $select.append(`<option value="${dept.id}">${dept.name}</option>`);
            });
        }

        function renderEmployees() {
            const $tbody = $('#employee-table-body');
            $tbody.empty();

            $('#employee-count').text(state.pagination.total);

            if (state.employees.length === 0) {
                $('#employee-empty').removeClass('hidden');
                return;
            }

            state.employees.forEach(emp => {
                const statusBadge = getStatusBadge(emp.employment_status);
                const departmentName = getDepartmentName(emp.department_id);
                const avatar = emp.avatar || '/wp-content/themes/newTheme/assets/images/default-avatar.png';

                const html = `
            <tr class="intro-x">
                <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                    <div class="flex items-center">
                        <div class="w-10 h-10 image-fit zoom-in">
                            <img alt="${emp.first_name} ${emp.last_name}" class="rounded-full" src="${avatar}">
                        </div>
                        <div class="ml-4">
                            <div class="font-medium whitespace-nowrap">${emp.first_name} ${emp.last_name}</div>
                            <div class="text-slate-500 text-xs whitespace-nowrap mt-0.5">${emp.email || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                    <div class="bg-slate-100 dark:bg-darkmode-400/70 border border-slate-200 dark:border-darkmode-400 text-slate-500 px-2 py-1 rounded text-xs w-fit">
                        ${emp.employee_id}
                    </div>
                </td>
                <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                    <div class="text-slate-500 text-sm">${emp.position || '-'}</div>
                </td>
                <td class="first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                    <div class="text-slate-500 text-sm">${departmentName}</div>
                </td>
                <td class="text-center first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                    ${statusBadge}
                </td>
                <td class="table-report__action w-56 first:rounded-l-md last:rounded-r-md bg-white border-b-0 dark:bg-darkmode-600 shadow-[20px_3px_20px_#0000000b]">
                    <div class="flex justify-center items-center">
                        <a href="/hr/employees/edit/${emp.id}" class="flex items-center mr-3 text-primary">
                            <i data-lucide="edit" class="w-4 h-4 mr-1"></i> Edit
                        </a>
                        <a href="/hr/employees/view/${emp.id}" class="flex items-center mr-3">
                            <i data-lucide="eye" class="w-4 h-4 mr-1"></i> View
                        </a>
                    </div>
                </td>
            </tr>
            `;

                $tbody.append(html);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        function renderPagination() {
            if (state.pagination.totalPages <= 1) {
                $('#pagination-container').addClass('hidden');
                return;
            }

            $('#pagination-container').removeClass('hidden');
            const $list = $('#pagination-list');
            $list.empty();

            // Previous button
            $list.append(`
            <li class="page-item ${state.pagination.page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${state.pagination.page - 1}">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                </a>
            </li>
        `);

            // Page numbers
            for (let i = 1; i <= state.pagination.totalPages; i++) {
                if (i === 1 || i === state.pagination.totalPages || (i >= state.pagination.page - 2 && i <= state.pagination.page + 2)) {
                    $list.append(`
                    <li class="page-item ${i === state.pagination.page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `);
                } else if (i === state.pagination.page - 3 || i === state.pagination.page + 3) {
                    $list.append(`<li class="page-item disabled"><a class="page-link">...</a></li>`);
                }
            }

            // Next button
            $list.append(`
            <li class="page-item ${state.pagination.page === state.pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${state.pagination.page + 1}">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </a>
            </li>
        `);

            if (window.lucide) window.lucide.createIcons();
        }

        // --- HELPERS ---
        function getStatusBadge(status) {
            const badges = {
                'active': '<div class="flex items-center justify-center text-success"><i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Active</div>',
                'inactive': '<div class="flex items-center justify-center text-slate-500"><i data-lucide="circle" class="w-4 h-4 mr-1"></i> Inactive</div>',
                'on_leave': '<div class="flex items-center justify-center text-warning"><i data-lucide="clock" class="w-4 h-4 mr-1"></i> On Leave</div>',
                'terminated': '<div class="flex items-center justify-center text-danger"><i data-lucide="x-circle" class="w-4 h-4 mr-1"></i> Terminated</div>'
            };
            return badges[status] || badges['inactive'];
        }

        function getDepartmentName(deptId) {
            if (!deptId) return '-';
            const dept = state.departments.find(d => d.id == deptId);
            return dept ? dept.name : '-';
        }

        // --- EVENTS ---
        function bindEvents() {
            // Search with debounce
            let searchTimeout;
            $('#search-input').on('input', function () {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    state.filters.search = $(this).val().trim();
                    state.pagination.page = 1;
                    loadEmployees();
                }, 300);
            });

            // Filters
            $('#filter-department, #filter-status, #filter-type').on('change', function () {
                state.filters.department = $('#filter-department').val();
                state.filters.status = $('#filter-status').val();
                state.filters.employment_type = $('#filter-type').val();
                state.pagination.page = 1;
                loadEmployees();
            });

            // Per page
            $('#per-page-select').on('change', function () {
                state.pagination.perPage = parseInt($(this).val());
                state.pagination.page = 1;
                loadEmployees();
            });

            // Pagination
            $(document).on('click', '.page-link', function (e) {
                e.preventDefault();
                const page = parseInt($(this).data('page'));
                if (page && page !== state.pagination.page && page > 0 && page <= state.pagination.totalPages) {
                    state.pagination.page = page;
                    loadEmployees();
                }
            });

            // Refresh
            $('#btn-refresh').on('click', () => loadEmployees());
        }

        // --- START ---
        $(function () {
            init();
        });

    })(jQuery);
</script>

<?php get_footer(); ?>