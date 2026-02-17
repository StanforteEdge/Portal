/**
 * Request Management functionality
 */
const RequestManagement = {
    calendar: null,
    selectedDates: [],
    maxHybridDays: 2,

    /**
     * Initialize request management
     */
    init() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeCalendar();
        this.loadCurrentRequests();
    },

    /**
     * Initialize UI elements
     */
    initializeElements() {
        this.elements = {
            // Leave form elements
            leaveForm: document.getElementById('leave-form'),
            leaveType: document.getElementById('leave-type'),
            leaveStartDate: document.getElementById('leave-start-date'),
            leaveEndDate: document.getElementById('leave-end-date'),
            
            // Hybrid form elements
            hybridForm: document.getElementById('hybrid-form'),
            hybridDates: document.getElementById('hybrid-dates'),
            workPlan: document.getElementById('work-plan'),
            availableFrom: document.getElementById('available-from'),
            availableTo: document.getElementById('available-to'),
            
            // Request tables
            pendingTable: document.getElementById('pending-requests-table'),
            approvedTable: document.getElementById('approved-requests-table')
        };
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Leave form submission
        this.elements.leaveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitLeaveRequest();
        });

        // Hybrid form submission
        this.elements.hybridForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitHybridRequest();
        });

        // Date validation for leave requests
        this.elements.leaveStartDate.addEventListener('change', () => {
            this.validateLeaveDates();
        });
        this.elements.leaveEndDate.addEventListener('change', () => {
            this.validateLeaveDates();
        });
    },

    /**
     * Initialize calendar for hybrid work selection
     */
    initializeCalendar() {
        const dates = this.generateDateGrid();
        this.elements.hybridDates.innerHTML = dates;

        // Attach click handlers to dates
        this.elements.hybridDates.querySelectorAll('.date-cell').forEach(cell => {
            cell.addEventListener('click', () => this.toggleDate(cell));
        });
    },

    /**
     * Generate date grid for next 4 weeks
     */
    generateDateGrid() {
        const today = new Date();
        const minDate = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days from now
        let html = '';

        // Header row with days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        html += '<div class="grid grid-cols-5 gap-2 mb-2">';
        days.forEach(day => {
            html += `<div class="text-center text-xs font-medium">${day}</div>`;
        });
        html += '</div>';

        // Generate 4 weeks of dates
        html += '<div class="grid grid-cols-5 gap-2">';
        for (let i = 0; i < 28; i++) {
            const date = new Date(minDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const dayOfWeek = date.getDay();

            // Skip weekends and meeting days (Monday & Friday)
            if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 5) {
                continue;
            }

            const dateStr = AttendanceCore.formatDate(date);
            const disabled = this.isDateDisabled(date);
            
            html += `
                <div class="date-cell ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
                     data-date="${dateStr}"
                     ${disabled ? 'disabled' : ''}>
                    <div class="p-2 rounded border text-center ${disabled ? 'bg-gray-100' : 'hover:bg-primary hover:text-white'}">
                        <div class="text-xs">${AttendanceCore.formatDate(date, 'MM/DD')}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        return html;
    },

    /**
     * Check if date should be disabled
     */
    isDateDisabled(date) {
        // Check if date is already approved for someone else
        // This will be implemented when we load team calendar data
        return false;
    },

    /**
     * Toggle date selection
     */
    toggleDate(cell) {
        if (cell.hasAttribute('disabled')) return;

        const date = cell.dataset.date;
        const index = this.selectedDates.indexOf(date);

        if (index === -1) {
            // Check if we've reached the maximum days per week
            if (!this.canAddDate(date)) {
                AttendanceCore.showNotification('Maximum 2 days per week allowed', 'error');
                return;
            }
            this.selectedDates.push(date);
            cell.querySelector('div').classList.add('bg-primary', 'text-white');
        } else {
            this.selectedDates.splice(index, 1);
            cell.querySelector('div').classList.remove('bg-primary', 'text-white');
        }
    },

    /**
     * Check if date can be added (max 2 per week)
     */
    canAddDate(newDate) {
        const weekStart = new Date(newDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const datesThisWeek = this.selectedDates.filter(date => {
            const d = new Date(date);
            const w = new Date(d.getTime() - (d.getDay() * 24 * 60 * 60 * 1000));
            return w.getTime() === weekStart.getTime();
        });

        return datesThisWeek.length < this.maxHybridDays;
    },

    /**
     * Validate leave dates
     */
    validateLeaveDates() {
        const startDate = new Date(this.elements.leaveStartDate.value);
        const endDate = new Date(this.elements.leaveEndDate.value);

        if (endDate < startDate) {
            this.elements.leaveEndDate.value = this.elements.leaveStartDate.value;
        }
    },

    /**
     * Submit leave request
     */
    async submitLeaveRequest() {
        try {
            const formData = new FormData(this.elements.leaveForm);
            const data = Object.fromEntries(formData.entries());

            await AttendanceCore.makeRequest('submit_leave_request', data);
            AttendanceCore.showNotification('Leave request submitted successfully');
            
            this.elements.leaveForm.reset();
            this.loadCurrentRequests();
        } catch (error) {
            console.error('Leave request submission failed:', error);
        }
    },

    /**
     * Submit hybrid work request
     */
    async submitHybridRequest() {
        try {
            if (this.selectedDates.length === 0) {
                AttendanceCore.showNotification('Please select at least one date', 'error');
                return;
            }

            const formData = new FormData(this.elements.hybridForm);
            formData.append('dates', JSON.stringify(this.selectedDates));

            await AttendanceCore.makeRequest('submit_hybrid_request', Object.fromEntries(formData.entries()));
            AttendanceCore.showNotification('Hybrid work request submitted successfully');
            
            this.elements.hybridForm.reset();
            this.selectedDates = [];
            this.initializeCalendar();
            this.loadCurrentRequests();
        } catch (error) {
            console.error('Hybrid request submission failed:', error);
        }
    },

    /**
     * Load current requests
     */
    async loadCurrentRequests() {
        try {
            const requests = await AttendanceCore.makeRequest('get_requests');
            
            // Update pending requests table
            let pendingHtml = '';
            requests.pending.forEach(request => {
                pendingHtml += `
                    <tr>
                        <td>${this.formatRequestType(request.type)}</td>
                        <td>${this.formatRequestDates(request)}</td>
                        <td>${this.formatStatus(request.status)}</td>
                        <td>${AttendanceCore.formatDate(request.submitted_on)}</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="RequestManagement.cancelRequest('${request.id}')">
                                Cancel
                            </button>
                        </td>
                    </tr>
                `;
            });
            this.elements.pendingTable.innerHTML = pendingHtml || '<tr><td colspan="5" class="text-center">No pending requests</td></tr>';

            // Update approved requests table
            let approvedHtml = '';
            requests.approved.forEach(request => {
                approvedHtml += `
                    <tr>
                        <td>${this.formatRequestType(request.type)}</td>
                        <td>${this.formatRequestDates(request)}</td>
                        <td>${request.approved_by}</td>
                        <td>${AttendanceCore.formatDate(request.approved_on)}</td>
                    </tr>
                `;
            });
            this.elements.approvedTable.innerHTML = approvedHtml || '<tr><td colspan="4" class="text-center">No approved requests</td></tr>';
        } catch (error) {
            console.error('Failed to load requests:', error);
        }
    },

    /**
     * Cancel a request
     */
    async cancelRequest(requestId) {
        try {
            await AttendanceCore.makeRequest('cancel_request', { request_id: requestId });
            AttendanceCore.showNotification('Request cancelled successfully');
            this.loadCurrentRequests();
        } catch (error) {
            console.error('Failed to cancel request:', error);
        }
    },

    /**
     * Format request type for display
     */
    formatRequestType(type) {
        const types = {
            leave: '<span class="text-theme-1">Leave</span>',
            hybrid: '<span class="text-theme-9">Hybrid Work</span>'
        };
        return types[type] || type;
    },

    /**
     * Format request dates for display
     */
    formatRequestDates(request) {
        if (request.type === 'hybrid') {
            return request.dates.map(date => 
                AttendanceCore.formatDate(date, 'MM/DD')
            ).join(', ');
        }
        return `${AttendanceCore.formatDate(request.start_date)} - ${AttendanceCore.formatDate(request.end_date)}`;
    },

    /**
     * Format status for display
     */
    formatStatus(status) {
        const statuses = {
            pending: '<span class="text-theme-12">Pending</span>',
            approved: '<span class="text-theme-9">Approved</span>',
            rejected: '<span class="text-theme-6">Rejected</span>',
            cancelled: '<span class="text-theme-8">Cancelled</span>'
        };
        return statuses[status] || status;
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    AttendanceCore.init();
    RequestManagement.init();
});
