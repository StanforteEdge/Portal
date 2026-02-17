<?php

/**
 * The header for our theme
 */

// Get page variables using PageHelper
$pageVars = PageHelper::getPageVariables();
$pageTitle = $pageVars['pageTitle'];
$breadcrumb = $pageVars['breadcrumb'];
$activeMenu = $pageVars['activeMenu'];
$requiredRoles = $pageVars['requiredRoles'];



// Get current template
$template = get_page_template_slug();
$isAuthPage = strpos($template, 'templates/pages/Auth/') !== false;
$isPublicPage = strpos($template, 'templates/pages/Public/') !== false;

/**
 * Page Type Behaviors:
 * - Auth Pages (login, register, etc.): Redirect logged-in users away
 * - Public Pages: Accessible to everyone (logged in or not), no restrictions, show full UI
 * - Protected Pages: Require login and permissions (handled elsewhere)
 */

// Public pages: Skip all auth checks, accessible to everyone
if ($isPublicPage) {
    // Do nothing - public pages are accessible to all users (logged in or not)
    // They will render with full UI (sidebar, navigation, etc.)
}
// Auth pages: Only redirect IF user is already logged in
elseif ($isAuthPage) {
    // Redirect logged-in users away from auth pages (login, register, etc.)
    AuthHelper::redirect_if_authenticated();
}
// Protected pages: Auth checks happen in individual templates via PageHelper::checkPageAccess()

?>

<!DOCTYPE html>
<!--
Template Name: Stanforte Edge - Staff Portal
-->

<html lang="en" class="light">
<!-- BEGIN: Head -->

<head>
    <meta charset="utf-8">
    <link
        href="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png"
        rel="shortcut icon">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Stanforte Edge Staff Portal">
    <meta name="keywords" content="admin template, stanforteedge">
    <meta name="author" content="LEFT4CODE">
    <title><?php echo esc_html($pageTitle); ?> - Stanforte Edge Staff Portal</title>
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-beta.1/dist/css/select2.min.css" rel="stylesheet" />

    <?php wp_head(); ?>
</head>

<body <?php body_class($isPublicPage ? ' py-5' : ($isAuthPage ? 'login py-5 md:py-0' : 'py-5 md:py-0')); ?>>
    <?php wp_body_open(); ?>

    <?php if (!$isAuthPage && !$isPublicPage): ?>
        <!-- BEGIN: Mobile Menu -->
        <div class="mobile-menu md:hidden">
            <div class="mobile-menu-bar">
                <a href="<?php echo home_url(); ?>" class="flex mr-auto">
                    <img alt="Stanforte Edge" class="w-12"
                        src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                </a>
                <a href="javascript:;" class="mobile-menu-toggler">
                    <i data-lucide="bar-chart-2" class="w-8 h-8 text-white transform -rotate-90"></i>
                </a>
            </div>
            <div class="scrollable">
                <a href="javascript:;" class="mobile-menu-toggler">
                    <i data-lucide="x-circle" class="w-8 h-8 text-white transform -rotate-90"></i>
                </a>
                <?php get_template_part('templates/partials/menu-items', null, ['menu_type' => 'mobile']); ?>
            </div>
        </div>
        <!-- END: Mobile Menu -->

        <div class="flex mt-[4.7rem] md:mt-0 overflow-hidden">
            <!-- BEGIN: Side Menu -->
            <nav class="side-nav">
                <a href="<?php echo home_url(); ?>" class="intro-x flex items-center pl-5 pt-4 mt-3">
                    <img alt="Stanforte Edge" class="w-6"
                        src="https://staff.stanforteedge.com/wp-content/uploads/2025/07/Stanforteedge-Identity_Stanforteedge-Icon-scaled.png">
                    <span class="hidden xl:block text-white text-lg ml-3">Stanforte Edge</span>
                </a>
                <div class="side-nav__devider my-6"></div>
                <?php get_template_part('templates/partials/menu-items', null, ['menu_type' => 'side']); ?>
            </nav>
            <!-- END: Side Menu -->

            <!-- BEGIN: Content -->
            <div class="content">
                <!-- BEGIN: Top Bar -->
                <div class="top-bar -mx-4 px-4 md:mx-0 md:px-0">
                    <!-- BEGIN: Breadcrumb -->
                    <nav aria-label="breadcrumb" class="-intro-x mr-auto sm:flex">
                        <ol class="breadcrumb">
                            <?php if (!empty($breadcrumb)):
                                $count = count($breadcrumb);
                                foreach ($breadcrumb as $index => $item):
                                    $isLast = $index === $count - 1;
                                    if (is_array($item)) {
                                        $name = $item['name'];
                                        $url = $item['url'] ?? null;
                                    } else {
                                        $name = $item;
                                        $url = null;
                                    }
                                    ?>
                                    <li class="breadcrumb-item<?php echo $isLast ? ' active' : ''; ?>" <?php echo $isLast ? ' aria-current="page"' : ''; ?>>
                                        <?php if (!$isLast && $url): ?>
                                            <a href="<?php echo esc_url($url); ?>"><?php echo esc_html($name); ?></a>
                                        <?php else: ?>
                                            <?php echo esc_html($name); ?>
                                        <?php endif; ?>
                                    </li>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </ol>
                    </nav>

                    <!-- BEGIN: Account Menu -->
                    <div class="intro-x dropdown w-8 h-8">
                        <div class="dropdown-toggle w-8 h-8 rounded-full overflow-hidden shadow-lg image-fit zoom-in"
                            role="button" aria-expanded="false" data-tw-toggle="dropdown">
                            <?php echo get_avatar(get_current_user_id(), 32, '', '', array('class' => 'rounded-full')); ?>
                        </div>
                        <div class="dropdown-menu w-56">
                            <ul class="dropdown-content bg-primary text-white">
                                <li class="p-2">
                                    <div class="font-medium"><?php echo esc_html(wp_get_current_user()->display_name); ?>
                                    </div>
                                </li>
                                <li>
                                    <hr class="dropdown-divider border-white/[0.08]">
                                </li>
                                <li>
                                    <a href="<?php echo home_url('/profile'); ?>" class="dropdown-item hover:bg-white/5">
                                        <i data-lucide="user" class="w-4 h-4 mr-2"></i> Profile
                                    </a>
                                </li>
                                <li>
                                    <a href="javascript:void(0);" onclick="logout()" class="dropdown-item hover:bg-white/5">
                                        <i data-lucide="toggle-right" class="w-4 h-4 mr-2"></i> Logout
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <!-- END: Account Menu -->
                </div>
                <!-- END: Top Bar -->

            <?php endif; ?>