<!-- BEGIN: Requests Section -->
<div class="col-span-12 mt-8">
    <div class="intro-y flex items-center h-10">
        <h2 class="text-lg font-medium truncate mr-5">
            <i data-lucide="inbox" class="w-5 h-5 inline mr-2"></i>
            My Requests
        </h2>
        <a href="<?php echo home_url('/requests'); ?>" class="ml-auto text-primary hover:text-primary-dark">
            View All Requests →
        </a>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-12 gap-6 mt-5">
        <!-- Draft Requests -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="file-edit" class="report-box__icon text-slate-500"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="requests-stat-draft">
                        <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                    </div>
                    <div class="text-base text-slate-500 mt-1">Draft</div>
                </div>
            </div>
        </div>

        <!-- Pending Approval -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="clock" class="report-box__icon text-warning"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="requests-stat-pending">
                        <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                    </div>
                    <div class="text-base text-slate-500 mt-1">Pending Approval</div>
                </div>
            </div>
        </div>

        <!-- Approved -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="check-circle" class="report-box__icon text-success"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="requests-stat-approved">
                        <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                    </div>
                    <div class="text-base text-slate-500 mt-1">Approved</div>
                </div>
            </div>
        </div>

        <!-- Total Requests -->
        <div class="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
            <div class="report-box zoom-in">
                <div class="box p-5">
                    <div class="flex">
                        <i data-lucide="file-text" class="report-box__icon text-primary"></i>
                    </div>
                    <div class="text-3xl font-medium leading-8 mt-6" id="requests-stat-total">
                        <div class="animate-pulse bg-slate-200 h-8 w-20 rounded"></div>
                    </div>
                    <div class="text-base text-slate-500 mt-1">Total Requests</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Requests -->
    <div class="col-span-12 mt-5 intro-y">
        <div class="box p-5">
            <div class="flex items-center justify-between mb-4">
                <div class="font-medium text-base">Recent Requests</div>
                <a href="<?php echo home_url('/requests/new'); ?>" class="btn btn-primary btn-sm">
                    <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
                    New Request
                </a>
            </div>
            <div id="recent-requests-list">
                <!-- Loading skeleton -->
                <div class="space-y-3">
                    <?php for ($i = 0; $i < 3; $i++): ?>
                        <div class="flex items-center animate-pulse">
                            <div class="w-10 h-10 bg-slate-200 rounded-full"></div>
                            <div class="ml-3 flex-1">
                                <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    <?php endfor; ?>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END: Requests Section -->

<script>
    // Load requests stats
    document.addEventListener('DOMContentLoaded', async function () {
        try {
            const token = localStorage.getItem('jwt_token') || '';

            // Fetch stats
            const statsResponse = await fetch('/wp-json/api/v1/requests/my-stats', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.data) {
                    document.getElementById('requests-stat-draft').textContent = statsData.data.draft || '0';
                    document.getElementById('requests-stat-pending').textContent = statsData.data.pending || '0';
                    document.getElementById('requests-stat-approved').textContent = statsData.data.approved || '0';
                    document.getElementById('requests-stat-total').textContent = statsData.data.total || '0';
                }
            }

            // Fetch recent requests
            const recentResponse = await fetch('/wp-json/api/v1/requests?per_page=3&orderby=date&order=desc', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (recentResponse.ok) {
                const recentData = await recentResponse.json();
                const listContainer = document.getElementById('recent-requests-list');

                if (recentData.data && recentData.data.length > 0) {
                    listContainer.innerHTML = recentData.data.map(request => `
                    <a href="/requests/view?id=${request.id}" class="flex items-center p-3 hover:bg-slate-50 rounded-md transition-colors">
                        <div class="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                            <i data-lucide="file-text" class="w-5 h-5"></i>
                        </div>
                        <div class="ml-3 flex-1">
                            <div class="font-medium">${request.title || 'Untitled Request'}</div>
                            <div class="text-xs text-slate-500 mt-0.5">
                                ${request.status} • ${new Date(request.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </a>
                `).join('');

                    // Re-initialize Lucide icons
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                } else {
                    listContainer.innerHTML = '<div class="text-center text-slate-500 py-4">No requests yet. <a href="/requests/new" class="text-primary">Create your first request</a></div>';
                }
            }
        } catch (e) {
            console.error('Failed to load requests stats', e);
        }
    });
</script>