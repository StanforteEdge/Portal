(function($) {
    'use strict';

    // Initialize Dashboard
    function initDashboard() {
        fetchDashboardData();
    }

    // Fetch unified dashboard data
    function fetchDashboardData() {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        $.ajax({
            url: '/wp-json/api/v1/dashboard/summary',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(response) {
                if (response.success && response.data) {
                    renderCommonSections(response.data);
                    
                    // Trigger custom event for other sections to listen to data
                    $(document).trigger('dashboard:data:loaded', [response.data]);
                }
            },
            error: function(xhr) {
                console.error('Failed to load dashboard data', xhr);
            }
        });
    }

    // Render common sections (Notifications, etc)
    function renderCommonSections(data) {
        // 1. Pending Requests Stats
        if (data.staff && data.staff.requests) {
            // Using 'pending' count from the API response (which sums pending, submitted, pending_approval)
            $('#stat-pending-requests').text(data.staff.requests.pending || 0);
        }

        // 2. Notifications Stats
        if (data.user && data.user.notifications) {
            const unreadCount = data.user.notifications.unread_count || 0;
            $('#stat-notifications-count').text(unreadCount);
            
            // Also update the old alert box if it exists (though we hid it in the redesign)
            if (unreadCount > 0) {
                $('#notification-count').text(unreadCount);
                $('#dashboard-notifications-container').removeClass('hidden').fadeIn();
            }
        }

        // 3. Activity Feed (Recent Notifications)
        const feedContainer = $('#activity-feed-container');
        if (data.user && data.user.notifications && data.user.notifications.recent && data.user.notifications.recent.length > 0) {
            let feedHtml = '<div class="relative before:block before:absolute before:w-px before:h-[85%] before:bg-slate-200 before:dark:bg-darkmode-400 before:ml-5 before:mt-5">';
            
            data.user.notifications.recent.forEach(function(notification) {
                feedHtml += `
                    <div class="intro-x relative flex items-center mb-3">
                        <div class="before:block before:absolute before:w-20 before:h-px before:bg-slate-200 before:dark:bg-darkmode-400 before:mt-5 before:ml-5"></div>
                        <div class="w-10 h-10 flex-none image-fit rounded-full overflow-hidden">
                            <div class="w-full h-full bg-primary/10 flex items-center justify-center rounded-full text-primary">
                                <i data-lucide="bell" class="w-5 h-5"></i>
                            </div>
                        </div>
                        <div class="box px-5 py-3 ml-4 flex-1 zoom-in">
                            <div class="flex items-center">
                                <div class="font-medium">${notification.title || 'Notification'}</div>
                                <div class="text-xs text-slate-500 ml-auto">${formatTimeAgo(notification.created_at)}</div>
                            </div>
                            <div class="text-slate-500 mt-1">${notification.message || ''}</div>
                        </div>
                    </div>`;
            });
            
            feedHtml += '</div>';
            feedContainer.html(feedHtml);
            
            // Re-initialize icons for the new content
            if (window.lucide) {
                window.lucide.createIcons();
            }
        } else {
            feedContainer.html('<div class="text-center text-slate-500 py-4">No recent activity</div>');
        }
    }

    $(document).ready(initDashboard);

})(jQuery);

