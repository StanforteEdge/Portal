/**
 * Admin Dashboard functionality
 */
const AdminDashboard = {
    charts: {},
    filters: {
        department: null,
        dateRange: 'today'
    },

    /**
     * Initialize dashboard
     */
    init() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadDashboard();
        
        // Refresh data every 5 minutes
        setInterval(() => this.loadDashboard(), 300000);
    },

    /**
     * Initialize UI elements
     */
    initializeElements() {
        this.elements = {
            departmentSelect: document.getElementById('department-select'),
            dateRangeSelect: document.getElementById('date-range'),
            presentCount: document.getElementById('present-count'),
            lateCount: document.getElementById('late-count'),
            absentCount: document.getElementById('absent-count'),
            attendanceTable: document.getElementById('attendance-table'),
            requestsTable: document.getElementById('requests-table')
        };
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Department filter
        this.elements.departmentSelect.addEventListener('change', () => {
            this.filters.department = this.elements.departmentSelect.value;
            this.loadDashboard();
        });

        // Date range filter
        this.elements.dateRangeSelect.addEventListener('change', () => {
            this.filters.dateRange = this.elements.dateRangeSelect.value;
            this.loadDashboard();
        });

        // Time off request actions
        this.elements.requestsTable.addEventListener('click', async (e) => {
            if (e.target.matches('[data-action]')) {
                const requestId = e.target.closest('tr').dataset.id;
                const action = e.target.dataset.action;
                
                try {
                    await this.processTimeOffRequest(requestId, action);
                    this.loadTimeOffRequests();
                } catch (error) {
                    console.error('Request processing failed:', error);
                }
            }
        });
    },

    /**
     * Load dashboard data
     */
    async loadDashboard() {
        await Promise.all([
            this.loadDepartmentStats(),
            this.loadAttendanceList(),
            this.loadTimeOffRequests(),
            this.loadAttendanceCharts()
        ]);
    },

    /**
     * Load department statistics
     */
    async loadDepartmentStats() {
        try {
            const stats = await AttendanceCore.makeRequest('get_department', {
                department_id: this.filters.department,
                date_range: this.filters.dateRange
            });

            // Update counters
            this.elements.presentCount.textContent = stats.present;
            this.elements.lateCount.textContent = stats.late;
            this.elements.absentCount.textContent = stats.absent;

            // Update progress bars
            const total = stats.present + stats.late + stats.absent;
            document.getElementById('present-progress').style.width = `${(stats.present / total) * 100}%`;
            document.getElementById('late-progress').style.width = `${(stats.late / total) * 100}%`;
            document.getElementById('absent-progress').style.width = `${(stats.absent / total) * 100}%`;
        } catch (error) {
            console.error('Department stats load failed:', error);
        }
    },

    /**
     * Load attendance list
     */
    async loadAttendanceList() {
        try {
            const records = await AttendanceCore.makeRequest('get_department_records', {
                department_id: this.filters.department,
                date: AttendanceCore.formatDate(new Date())
            });

            let html = '';
            records.forEach(record => {
                html += `
                    <tr>
                        <td>
                            <div class="flex items-center">
                                <div class="w-10 h-10 image-fit zoom-in">
                                    <img class="rounded-full" src="${record.user_avatar}" alt="Employee photo">
                                </div>
                                <div class="ml-4">
                                    <div class="font-medium">${record.user_name}</div>
                                    <div class="text-slate-500 text-xs">${record.user_position}</div>
                                </div>
                            </div>
                        </td>
                        <td>${AttendanceCore.formatDate(record.check_in, 'HH:mm')}</td>
                        <td>${record.check_out ? AttendanceCore.formatDate(record.check_out, 'HH:mm') : '-'}</td>
                        <td>${AttendanceCore.formatWorkMode(record.work_mode)}</td>
                        <td>${AttendanceCore.formatStatus(record.status)}</td>
                    </tr>
                `;
            });

            this.elements.attendanceTable.querySelector('tbody').innerHTML = html;
        } catch (error) {
            console.error('Attendance list load failed:', error);
        }
    },

    /**
     * Load time off requests
     */
    async loadTimeOffRequests() {
        try {
            const requests = await AttendanceCore.makeRequest('timeoff_get_department_requests', {
                department_id: this.filters.department
            });

            let html = '';
            requests.forEach(request => {
                html += `
                    <tr data-id="${request.id}">
                        <td>
                            <div class="font-medium">${request.employee_name}</div>
                            <div class="text-slate-500 text-xs">${request.type}</div>
                        </td>
                        <td>${AttendanceCore.formatDate(request.start_date)} - ${AttendanceCore.formatDate(request.end_date)}</td>
                        <td>${request.reason}</td>
                        <td>
                            <div class="flex justify-center">
                                <button class="btn btn-success btn-sm mr-2" data-action="approve">
                                    <i data-lucide="check"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" data-action="reject">
                                    <i data-lucide="x"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            this.elements.requestsTable.querySelector('tbody').innerHTML = html;
            
            // Initialize icons
            if (window.lucide) {
                lucide.createIcons();
            }
        } catch (error) {
            console.error('Time off requests load failed:', error);
        }
    },

    /**
     * Process time off request
     */
    async processTimeOffRequest(requestId, action) {
        try {
            await AttendanceCore.makeRequest('timeoff_process', {
                request_id: requestId,
                status: action === 'approve' ? 'approved' : 'rejected'
            });

            AttendanceCore.showNotification(`Request ${action}d successfully`);
        } catch (error) {
            AttendanceCore.showNotification(`Failed to ${action} request`, 'error');
            throw error;
        }
    },

    /**
     * Load attendance charts
     */
    async loadAttendanceCharts() {
        try {
            const stats = await AttendanceCore.makeRequest('get_department_stats', {
                department_id: this.filters.department,
                date_range: this.filters.dateRange
            });

            // Daily attendance trend
            this.charts.trend = AttendanceCore.createChart('attendance-trend', {
                type: 'line',
                data: {
                    labels: stats.dates,
                    datasets: [{
                        label: 'Present',
                        data: stats.present_counts,
                        borderColor: '#48bb78',
                        fill: false
                    }, {
                        label: 'Late',
                        data: stats.late_counts,
                        borderColor: '#ecc94b',
                        fill: false
                    }]
                }
            });

            // Work mode distribution
            this.charts.workMode = AttendanceCore.createChart('work-mode-distribution', {
                type: 'pie',
                data: {
                    labels: ['Office', 'Remote', 'Hybrid'],
                    datasets: [{
                        data: [stats.office_count, stats.remote_count, stats.hybrid_count],
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899']
                    }]
                }
            });

            // Department comparison
            this.charts.departments = AttendanceCore.createChart('department-comparison', {
                type: 'bar',
                data: {
                    labels: stats.departments,
                    datasets: [{
                        label: 'Average Attendance Rate',
                        data: stats.department_rates,
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Charts load failed:', error);
        }
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    AttendanceCore.init();
    AdminDashboard.init();
});
