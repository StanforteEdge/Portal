/**
 * Employee Dashboard functionality
 */
const EmployeeDashboard = {
    status: null,
    charts: {},
    approvedHybridDates: [],

    /**
     * Initialize dashboard
     */
    init() {
        this.initializeElements();
        this.loadApprovedHybridDates();
        this.attachEventListeners();
        this.loadDashboard();
        
        // Refresh status every minute
        setInterval(() => this.updateStatus(), 60000);
    },

    /**
     * Initialize UI elements
     */
    initializeElements() {
        this.elements = {
            checkInBtn: document.getElementById('btn-check-in'),
            checkOutBtn: document.getElementById('btn-check-out'),
            workModeSelect: document.getElementById('work-mode'),
            statusDisplay: document.getElementById('current-status'),
            timeDisplay: document.getElementById('current-time'),
            activityTable: document.getElementById('recent-activity'),
            timeOffTable: document.getElementById('time-off-overview')
        };

        // Update current time
        setInterval(() => {
            const now = new Date();
            this.elements.timeDisplay.textContent = now.toLocaleTimeString();
        }, 1000);
    },

    /**
     * Load approved hybrid work dates
     */
    async loadApprovedHybridDates() {
        try {
            const requests = await AttendanceCore.makeRequest('get_approved_hybrid_dates');
            this.approvedHybridDates = requests.map(r => r.date);
            this.updateWorkModeOptions();
        } catch (error) {
            console.error('Failed to load hybrid dates:', error);
        }
    },

    /**
     * Update work mode options based on approved hybrid dates
     */
    updateWorkModeOptions() {
        const today = AttendanceCore.formatDate(new Date());
        const isHybridApproved = this.approvedHybridDates.includes(today);
        
        // Get the hybrid option
        const hybridOption = this.elements.workModeSelect.querySelector('option[value="hybrid"]');
        
        if (hybridOption) {
            if (isHybridApproved) {
                hybridOption.disabled = false;
                hybridOption.textContent = 'Hybrid Work (Approved)';
            } else {
                hybridOption.disabled = true;
                hybridOption.textContent = 'Hybrid Work (Not Approved)';
            }
        }
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Check In button
        this.elements.checkInBtn.addEventListener('click', async () => {
            try {
                const workMode = this.elements.workModeSelect.value;
                
                // Validate hybrid work mode
                if (workMode === 'hybrid') {
                    const today = AttendanceCore.formatDate(new Date());
                    if (!this.approvedHybridDates.includes(today)) {
                        AttendanceCore.showNotification('Hybrid work not approved for today', 'error');
                        return;
                    }
                }
                
                await AttendanceCore.makeRequest('check_in', { work_mode: workMode });
                AttendanceCore.showNotification('Successfully checked in');
                this.updateStatus();
            } catch (error) {
                console.error('Check-in failed:', error);
            }
        });

        // Check Out button
        this.elements.checkOutBtn.addEventListener('click', async () => {
            try {
                await AttendanceCore.makeRequest('check_out');
                AttendanceCore.showNotification('Successfully checked out');
                this.updateStatus();
            } catch (error) {
                console.error('Check-out failed:', error);
            }
        });

        // Work mode select
        this.elements.workModeSelect.addEventListener('change', () => {
            localStorage.setItem('preferred_work_mode', this.elements.workModeSelect.value);
        });
    },

    /**
     * Load dashboard data
     */
    async loadDashboard() {
        await Promise.all([
            this.updateStatus(),
            this.loadRecentActivity(),
            this.loadTimeOffOverview(),
            this.loadAttendanceStats()
        ]);
    },

    /**
     * Update current status
     */
    async updateStatus() {
        try {
            const status = await AttendanceCore.makeRequest('get_status');
            this.status = status;

            // Update UI
            this.elements.checkInBtn.disabled = status.is_checked_in;
            this.elements.checkOutBtn.disabled = !status.is_checked_in;
            
            if (status.current_session) {
                const session = status.current_session;
                this.elements.statusDisplay.innerHTML = `
                    <div class="flex items-center">
                        <div class="mr-3">
                            ${AttendanceCore.formatStatus(session.status)}
                            ${AttendanceCore.formatWorkMode(session.work_mode)}
                        </div>
                        <div>
                            Checked in at ${AttendanceCore.formatDate(session.check_in, 'HH:mm')}
                        </div>
                    </div>
                `;
            } else {
                this.elements.statusDisplay.innerHTML = '<span class="badge badge-secondary">Not Checked In</span>';
            }
        } catch (error) {
            console.error('Status update failed:', error);
        }
    },

    /**
     * Load recent activity
     */
    async loadRecentActivity() {
        try {
            const records = await AttendanceCore.makeRequest('get_records', {
                start_date: AttendanceCore.formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            });

            let html = '';
            records.forEach(record => {
                html += `
                    <tr>
                        <td>${AttendanceCore.formatDate(record.check_in, 'MM/DD/YYYY')}</td>
                        <td>${AttendanceCore.formatDate(record.check_in, 'HH:mm')}</td>
                        <td>${record.check_out ? AttendanceCore.formatDate(record.check_out, 'HH:mm') : '-'}</td>
                        <td>${record.check_out ? AttendanceCore.formatDuration(record.check_in, record.check_out) : '-'}</td>
                        <td>${AttendanceCore.formatWorkMode(record.work_mode)}</td>
                        <td>${AttendanceCore.formatStatus(record.status)}</td>
                    </tr>
                `;
            });

            this.elements.activityTable.querySelector('tbody').innerHTML = html;
        } catch (error) {
            console.error('Activity load failed:', error);
        }
    },

    /**
     * Load time off overview
     */
    async loadTimeOffOverview() {
        try {
            const balance = await AttendanceCore.makeRequest('timeoff_get_balance');
            const requests = await AttendanceCore.makeRequest('timeoff_get_requests');

            // Update balance display
            const balanceHtml = Object.entries(balance).map(([type, data]) => `
                <div class="col-span-12 sm:col-span-6 xl:col-span-4">
                    <div class="box p-5">
                        <div class="text-base text-slate-500">${type.replace('_', ' ').toUpperCase()}</div>
                        <div class="mt-1">
                            <div class="text-3xl font-medium leading-8">${data.remaining}</div>
                            <div class="text-base text-slate-500">Days Remaining</div>
                        </div>
                        <div class="mt-3">
                            <div class="flex">
                                <div class="mr-3">Used: ${data.used}</div>
                                <div>Total: ${data.total}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            document.getElementById('time-off-balance').innerHTML = balanceHtml;

            // Update requests table
            let requestsHtml = '';
            requests.forEach(request => {
                requestsHtml += `
                    <tr>
                        <td>${request.type}</td>
                        <td>${AttendanceCore.formatDate(request.start_date)} - ${AttendanceCore.formatDate(request.end_date)}</td>
                        <td>${request.status}</td>
                        <td>${request.reason}</td>
                    </tr>
                `;
            });

            this.elements.timeOffTable.querySelector('tbody').innerHTML = requestsHtml;
        } catch (error) {
            console.error('Time off overview load failed:', error);
        }
    },

    /**
     * Load attendance statistics
     */
    async loadAttendanceStats() {
        try {
            const stats = await AttendanceCore.makeRequest('get_stats');
            
            // Create attendance trend chart
            this.charts.trend = AttendanceCore.createChart('attendance-trend', {
                type: 'line',
                data: {
                    labels: stats.dates,
                    datasets: [{
                        label: 'Work Hours',
                        data: stats.hours,
                        borderColor: '#3b82f6',
                        tension: 0.1
                    }]
                }
            });

            // Create status distribution chart
            this.charts.status = AttendanceCore.createChart('status-distribution', {
                type: 'doughnut',
                data: {
                    labels: ['Present', 'Late', 'Absent'],
                    datasets: [{
                        data: [stats.present, stats.late, stats.absent],
                        backgroundColor: ['#48bb78', '#ecc94b', '#f56565']
                    }]
                }
            });
        } catch (error) {
            console.error('Stats load failed:', error);
        }
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    AttendanceCore.init();
    EmployeeDashboard.init();
});
