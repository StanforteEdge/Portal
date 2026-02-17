/**
 * Team Lead Dashboard functionality
 */
const TeamLeadDashboard = {
    calendar: null,
    teamRequests: [],

    /**
     * Initialize dashboard
     */
    init() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeCalendar();
        this.loadTeamRequests();
        
        // Refresh data every 5 minutes
        setInterval(() => this.loadTeamRequests(), 300000);
    },

    /**
     * Initialize UI elements
     */
    initializeElements() {
        this.elements = {
            requestsTable: document.getElementById('team-requests-table'),
            calendarEl: document.getElementById('team-calendar'),
            departmentSelect: document.getElementById('department-select'),
            dateRange: document.getElementById('date-range')
        };
    },

    /**
     * Initialize team calendar
     */
    initializeCalendar() {
        // Using bundled FullCalendar from app.js
        this.calendar = new FullCalendar.Calendar(this.elements.calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            themeSystem: 'tailwind',
            events: [],
            eventClick: info => this.handleEventClick(info.event),
            // Disable drag and drop
            editable: false,
            // Disable date selection
            selectable: false,
            // Disable event creation
            eventStartEditable: false,
            eventDurationEditable: false
        });
        
        this.calendar.render();
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Department filter
        if (this.elements.departmentSelect) {
            this.elements.departmentSelect.addEventListener('change', () => {
                this.loadTeamRequests();
            });
        }

        // Date range filter
        if (this.elements.dateRange) {
            this.elements.dateRange.addEventListener('change', () => {
                this.loadTeamRequests();
            });
        }
    },

    /**
     * Load team requests
     */
    async loadTeamRequests() {
        try {
            const filters = {
                department: this.elements.departmentSelect?.value,
                date_range: this.elements.dateRange?.value
            };

            const requests = await AttendanceCore.makeRequest('get_team_requests', filters);
            this.teamRequests = requests;
            
            this.updateRequestsTable();
            this.updateCalendar();
        } catch (error) {
            console.error('Failed to load team requests:', error);
        }
    },

    /**
     * Update requests table
     */
    updateRequestsTable() {
        let html = '';
        this.teamRequests.forEach(request => {
            html += `
                <tr data-id="${request.id}">
                    <td>
                        <div class="flex items-center">
                            <div class="w-10 h-10 image-fit zoom-in">
                                <img class="rounded-full" src="${request.employee_avatar}" alt="Employee photo">
                            </div>
                            <div class="ml-4">
                                <div class="font-medium">${request.employee_name}</div>
                                <div class="text-slate-500 text-xs">${request.employee_position}</div>
                            </div>
                        </div>
                    </td>
                    <td>${this.formatRequestType(request.type)}</td>
                    <td>${this.formatRequestDates(request)}</td>
                    <td>
                        ${request.type === 'hybrid' ? `
                            <div class="text-xs">
                                <div><strong>Work Plan:</strong> ${request.work_plan}</div>
                                <div><strong>Available:</strong> ${request.available_from} - ${request.available_to}</div>
                                <div><strong>Channels:</strong> ${request.channels.join(', ')}</div>
                            </div>
                        ` : request.reason}
                    </td>
                    <td>${AttendanceCore.formatDate(request.submitted_on)}</td>
                    <td>
                        <div class="flex justify-center">
                            <button class="btn btn-success btn-sm mr-2" 
                                    onclick="TeamLeadDashboard.processRequest('${request.id}', 'approve')">
                                <i data-lucide="check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" 
                                    onclick="TeamLeadDashboard.processRequest('${request.id}', 'reject')">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        this.elements.requestsTable.innerHTML = html || '<tr><td colspan="6" class="text-center">No pending requests</td></tr>';
        
        // Initialize icons
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    /**
     * Update calendar with team schedule
     */
    updateCalendar() {
        // Remove existing events
        this.calendar.removeAllEvents();

        // Add requests to calendar
        this.teamRequests.forEach(request => {
            if (request.type === 'hybrid') {
                request.dates.forEach(date => {
                    this.calendar.addEvent({
                        id: `${request.id}-${date}`,
                        title: `${request.employee_name} (Hybrid)`,
                        start: date,
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6'
                    });
                });
            } else {
                this.calendar.addEvent({
                    id: request.id,
                    title: `${request.employee_name} (${request.type})`,
                    start: request.start_date,
                    end: request.end_date,
                    backgroundColor: '#f59e0b',
                    borderColor: '#f59e0b'
                });
            }
        });
    },

    /**
     * Handle calendar event click
     */
    handleEventClick(event) {
        const requestId = event.id.split('-')[0];
        const request = this.teamRequests.find(r => r.id === requestId);
        
        if (request) {
            this.showRequestDetails(request);
        }
    },

    /**
     * Show request details modal
     */
    showRequestDetails(request) {
        // Implementation depends on your modal library
        // Here's an example using tailwind-modal
        const modal = tailwind.Modal.getInstance(document.querySelector('#request-details-modal'));
        
        // Update modal content
        document.querySelector('#modal-employee-name').textContent = request.employee_name;
        document.querySelector('#modal-request-type').textContent = this.formatRequestType(request.type);
        document.querySelector('#modal-request-dates').textContent = this.formatRequestDates(request);
        document.querySelector('#modal-request-details').innerHTML = request.type === 'hybrid' 
            ? `
                <div class="mt-2">
                    <p class="font-medium">Work Plan</p>
                    <p class="text-gray-600">${request.work_plan}</p>
                </div>
                <div class="mt-2">
                    <p class="font-medium">Availability</p>
                    <p class="text-gray-600">${request.available_from} - ${request.available_to}</p>
                </div>
                <div class="mt-2">
                    <p class="font-medium">Communication Channels</p>
                    <p class="text-gray-600">${request.channels.join(', ')}</p>
                </div>
            `
            : `
                <div class="mt-2">
                    <p class="font-medium">Reason</p>
                    <p class="text-gray-600">${request.reason}</p>
                </div>
            `;

        modal.show();
    },

    /**
     * Process request (approve/reject)
     */
    async processRequest(requestId, action) {
        try {
            await AttendanceCore.makeRequest('process_request', {
                request_id: requestId,
                action: action
            });

            AttendanceCore.showNotification(`Request ${action}ed successfully`);
            this.loadTeamRequests();
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
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
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    AttendanceCore.init();
    TeamLeadDashboard.init();
});
