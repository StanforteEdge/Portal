/**
 * Core Attendance functionality
 */
const AttendanceCore = {
    /**
     * Initialize AJAX settings
     */
    init() {
        // Add CSRF token to all AJAX requests
        $.ajaxSetup({
            headers: {
                'X-WP-Nonce': attendanceAjax.nonce
            }
        });

        // Global AJAX error handler
        $(document).ajaxError((event, jqXHR) => {
            if (jqXHR.status === 403) {
                this.showNotification('Session expired. Please refresh the page.', 'error');
            }
        });
    },

    /**
     * Make an AJAX call
     */
    async makeRequest(action, data = {}) {
        try {
            const response = await $.ajax({
                url: attendanceAjax.ajax_url,
                method: 'POST',
                data: {
                    action: `attendance_${action}`,
                    ...data
                }
            });

            if (!response.success) {
                throw new Error(response.message || 'Request failed');
            }

            return response.data;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    },

    /**
     * Format date for display
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },

    /**
     * Show notification using Toastify
     */
    showNotification(message, type = 'success') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            backgroundColor: type === 'success' ? '#48bb78' : '#f56565'
        }).showToast();
    },

    /**
     * Update UI elements
     */
    updateElement(selector, content) {
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = content;
        }
    },

    /**
     * Create chart using Chart.js
     */
    createChart(canvasId, config) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            ...config,
            options: {
                ...config.options,
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    /**
     * Format time difference
     */
    formatDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.abs(end - start);
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        return `${hours}h ${minutes}m`;
    },

    /**
     * Format work mode for display
     */
    formatWorkMode(mode) {
        const modes = {
            office: '<span class="badge badge-success">Office</span>',
            remote: '<span class="badge badge-info">Remote</span>',
            hybrid: '<span class="badge badge-warning">Hybrid</span>'
        };
        return modes[mode] || mode;
    },

    /**
     * Format status for display
     */
    formatStatus(status) {
        const statuses = {
            present: '<span class="badge badge-success">Present</span>',
            late: '<span class="badge badge-warning">Late</span>',
            absent: '<span class="badge badge-danger">Absent</span>'
        };
        return statuses[status] || status;
    }
};
