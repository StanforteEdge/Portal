<div class="col-span-12 lg:col-span-4 2xl:col-span-3 flex lg:block flex-col-reverse">
        <div class="intro-y box mt-5 lg:mt-0">
            <div class="relative flex items-center p-5">
                <div class="w-12 h-12 image-fit">
                    <img alt="Midone - HTML Admin Template" class="rounded-full" src="<?= !empty($staff->pic) ? $staff->pic : 'https://staff.stanforteedge.com/wp-content/uploads/2024/02/user.png'; ?>">
                </div>
                <div class="ml-4 mr-auto">
                    <div class="font-medium text-base"><?= $staff->first_name . ' ' . $staff->last_name; ?></div>
                    <div class="text-slate-500"><?= $staff->position; ?></div>
                </div>
                <div class="dropdown ">
                    <a class="dropdown-toggle hidden w-5 h-5 block" href="javascript:;" aria-expanded="false" data-tw-toggle="dropdown"> <i data-lucide="more-horizontal" class="w-5 h-5 text-slate-500"></i> </a>
                    <div class="dropdown-menu w-56">
                        <ul class="dropdown-content">
                            <div class="p-5 sm:hidden border-slate-200/60 dark:border-darkmode-400">
                                <a href="/profile" class="flex items-center <?php if (is_page('profile')) {echo 'text-primary font-medium';} ?>  " href=""> <i data-lucide="activity" class="w-4 h-4 mr-2"></i> Overview </a>
                                <a href="/profile/jd/" class="flex items-center <?php if (is_page('profile/jd')) {echo 'text-primary font-medium';} ?> mt-5" href=""> <i data-lucide="box" class="w-4 h-4 mr-2"></i> Job Description </a>
                                <a href="/profile/bio/" class="flex items-center <?php if (is_page('profile/bio')) {echo 'text-primary font-medium';} ?> mt-5" href=""> <i data-lucide="lock" class="w-4 h-4 mr-2"></i> Personal Information </a>
                                <a href="/profile/documents/" class="flex items-center <?php if (is_page('profile/documents')) {echo 'text-primary font-medium';} ?> mt-5" href=""> <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Documents </a>
                                <a href="/profile/skills/" class="flex items-center <?php if (is_page('profile/skills')) {echo 'text-primary font-medium';} ?> mt-5" href=""> <i data-lucide="award" class="w-4 h-4 mr-2"></i> Skills </a>
                                <a href="/settings" class="flex items-center <?php if (is_page('settings')) {echo 'text-primary font-medium';} ?> mt-5" > <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Staff Settings </a>
                            </div>
                            <div class="p-5 hidden border-t border-slate-200/60 dark:border-darkmode-400">
                                <a class="flex items-center" href=""> <i data-lucide="activity" class="w-4 h-4 mr-2"></i> Email Settings </a>
                                <a class="flex items-center mt-5" href=""> <i data-lucide="box" class="w-4 h-4 mr-2"></i> Saved Credit Cards </a>
                                <a class="flex items-center mt-5" href=""> <i data-lucide="lock" class="w-4 h-4 mr-2"></i> Social Networks </a>
                                <a class="flex items-center mt-5" href=""> <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Tax Information </a>
                            </div>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="p-5 border-t sm:block border-slate-200/60 dark:border-darkmode-400">
                <a href="/profile" class="flex items-center <?php if (is_page('profile')) {echo 'text-primary font-medium';} ?> hover:font-medium" href=""> <i data-lucide="activity" class="w-4 h-4 mr-2"></i> Overview </a>
                <a href="/profile/jd/" class="flex items-center <?php if (is_page('profile/jd')) {echo 'text-primary font-medium';} ?> mt-5 hover:font-medium " href=""> <i data-lucide="box" class="w-4 h-4 mr-2"></i> Job Description </a>
                <a href="/profile/bio/" class="flex items-center <?php if (is_page('profile/bio')) { echo 'text-primary font-medium';} ?> hover:font-medium mt-5" > <i data-lucide="lock" class="w-4 h-4 mr-2"></i> Personal Information</a>
                <a href="/profile/documents/" class="flex items-center <?php if (is_page('profile/documents')) {echo 'text-primary font-medium';} ?> hover:font-medium mt-5" href=""> <i data-lucide="file-text" class="w-4 h-4 mr-2"></i> Documents </a>
                <a href="/profile/skills/" class="flex items-center <?php if (is_page('profile/skills')) {echo 'text-primary font-medium';} ?> hover:font-medium mt-5" href=""> <i data-lucide="award" class="w-4 h-4 mr-2"></i> Skills </a>
                <a href="/settings/" class="flex items-center <?php if (is_page('settings')) { echo 'text-primary font-medium';} ?> hover:font-medium mt-5" > <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Staff Settings </a>
            </div>
            <div class="p-5 border-t hidden  border-slate-200/60 dark:border-darkmode-400">
                <a class="flex items-center" href=""> <i data-lucide="activity" class="w-4 h-4 mr-2"></i> Email Settings </a>
                <a class="flex items-center mt-5" href=""> <i data-lucide="box" class="w-4 h-4 mr-2"></i> Saved Credit Cards </a>
                <a class="flex items-center mt-5" href=""> <i data-lucide="lock" class="w-4 h-4 mr-2"></i> Social Networks </a>
                <a class="flex items-center mt-5" href=""> <i data-lucide="settings" class="w-4 h-4 mr-2"></i> Tax Information </a>
            </div>
            <div class="p-5 border-t hidden border-slate-200/60 dark:border-darkmode-400 flex">
                <button type="button" class="btn btn-primary py-1 px-2">New Group</button>
                <button type="button" class="btn btn-outline-secondary py-1 px-2 ml-auto">New Quick Link</button>
            </div>
        </div>
    </div>