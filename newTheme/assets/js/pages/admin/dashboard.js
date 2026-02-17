(function($) {
    'use strict';

    const AdminDashboard = {
        init() {
            this.loadStats();
            this.loadRecentActivity();
            this.loadRoleDistribution();
            this.checkSystemHealth();
        },

        async loadStats() {
            try {
                const response = await window.ApiClient.get('/admin/stats');
                
                if (response.success) {
                    const stats = response.data;
                    
                    // Update stat cards
                    $('#stat-total-users').text(stats.total_users || 0);
                    $('#stat-active-users').text(stats.active_users || 0);
                    $('#stat-total-roles').text(stats.total_roles || 0);
                    $('#stat-pending-actions').text(stats.pending_actions || 0);
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
                // Show error state
                $('.report-box .text-3xl').html('<span class="text-danger">--</span>');
            }
        },

        async loadRecentActivity() {
            try {
                const response = await window.ApiClient.get('/admin/activity?limit=5');
                
                if (response.success && response.data.length > 0) {
                    const html = response.data.map(activity => `
                        <div class="flex items-start mb-4 last:mb-0">
                            <div class="w-10 h-10 flex-none image-fit rounded-full overflow-hidden">
                                <img src="${activity.user_avatar || '/wp-content/uploads/2025/07/user.jpg'}" alt="${activity.user_name}">
                            </div>
                            <div class="ml-3 flex-1">
                                <div class="flex items-center">
                                    <span class="font-medium">${activity.user_name}</span>
                                    <span class="text-xs text-slate-500 ml-2">${this.formatTime(activity.created_at)}</span>
                                </div>
                                <div class="text-slate-500 text-sm mt-1">${activity.description}</div>
                            </div>
                        </div>
                    `).join('');
                    
                    $('#recent-activity-list').html(html);
                } else {
                    $('#recent-activity-list').html(`
                        <div class="text-center text-slate-500 py-8">
                            <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                            <p>No recent activity</p>
                        </div>
                    `);
                }
                
                // Re-initialize lucide icons
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            } catch (error) {
                console.error('Failed to load recent activity:', error);
                $('#recent-activity-list').html(`
                    <div class="text-center text-danger py-8">
                        <p>Failed to load activity</p>
                    </div>
                `);
            }
        },

        async loadRoleDistribution() {
            try {
                const response = await window.ApiClient.get('/admin/roles/distribution');
                
                if (response.success) {
                    const data = response.data;
                    const ctx = document.getElementById('role-distribution-chart');
                    
                    if (ctx && typeof Chart !== 'undefined') {
                        new Chart(ctx, {
                            type: 'doughnut',
                            data: {
                                labels: data.map(item => item.role_name),
                                datasets: [{
                                    data: data.map(item => item.user_count),
                                    backgroundColor: [
                                        '#3b82f6', // blue
                                        '#10b981', // green
                                        '#f59e0b', // yellow
                                        '#ef4444', // red
                                        '#8b5cf6', // purple
                                        '#ec4899', // pink
                                    ],
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    }
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to load role distribution:', error);
            }
        },

        async checkSystemHealth() {
            try {
                const response = await window.ApiClient.get('/admin/health');
                
                if (response.success) {
                    const health = response.data;
                    
                    const statusBadge = (status) => {
                        const classes = {
                            'healthy': 'bg-success text-white',
                            'warning': 'bg-warning text-white',
                            'error': 'bg-danger text-white'
                        };
                        return `<span class="px-2 py-1 rounded text-xs ${classes[status] || 'bg-slate-200'}">${status}</span>`;
                    };
                    
                    const html = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i data-lucide="database" class="w-5 h-5 text-slate-500 mr-3"></i>
                                <span>Database</span>
                            </div>
                            ${statusBadge(health.database || 'unknown')}
                        </div>
                        <div class="flex items-center justify-between mt-4">
                            <div class="flex items-center">
                                <i data-lucide="server" class="w-5 h-5 text-slate-500 mr-3"></i>
                                <span>API Services</span>
                            </div>
                            ${statusBadge(health.api || 'unknown')}
                        </div>
                        <div class="flex items-center justify-between mt-4">
                            <div class="flex items-center">
                                <i data-lucide="hard-drive" class="w-5 h-5 text-slate-500 mr-3"></i>
                                <span>Storage</span>
                            </div>
                            ${statusBadge(health.storage || 'unknown')}
                        </div>
                    `;
                    
                    $('#system-health').html(html);
                    
                    // Re-initialize lucide icons
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            } catch (error) {
                console.error('Failed to check system health:', error);
            }
        },

        formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000); // seconds
            
            if (diff < 60) return 'Just now';
            if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
            if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
            
            return date.toLocaleDateString();
        }
    };

    // Initialize on page load
    $(document).ready(function() {
        AdminDashboard.init();
    });

})(jQuery);
