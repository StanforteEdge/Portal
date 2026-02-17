<?php
/**
 * Dynamic Menu Helper for Stanforte Edge Portal
 * Clean, consolidated menu system without JS dependencies
 */

class StanforteMenuHelper {

    public static function render_mobile_menu($menu_config = null) {
        ?>
        <!-- BEGIN: Mobile Menu -->
        <div class="mobile-menu md:hidden">
            <div class="mobile-menu-bar">
                <a href="<?php echo home_url(); ?>" class="flex mr-auto">
                    <img alt="Stanforte Edge Portal" class="w-6" src="<?php echo get_template_directory_uri(); ?>/assets/images/logo.png">
                </a>
                <input type="checkbox" id="mobile-menu-toggle" class="hidden">
                <label for="mobile-menu-toggle" class="mobile-menu-toggler">
                    <i data-lucide="bar-chart-2" class="w-8 h-8 text-white transform -rotate-90"></i>
                </label>
            </div>
            <div class="scrollable">
                <label for="mobile-menu-toggle" class="mobile-menu-toggler">
                    <i data-lucide="x-circle" class="w-8 h-8 text-white transform -rotate-90"></i>
                </label>
                <ul class="scrollable__content py-2">
                    <?php self::render_mobile_menu_items($menu_config); ?>
                </ul>
            </div>
        </div>
        <!-- END: Mobile Menu -->
        <?php
    }

    public static function render_sidebar_menu($menu_config = null) {
        ?>
        <!-- BEGIN: Side Menu -->
        <nav class="side-nav">
            <a href="<?php echo home_url(); ?>" class="intro-x flex items-center pl-5 pt-4 mt-3">
                <img alt="Stanforte Edge" class="w-6" src="<?php echo get_template_directory_uri(); ?>/assets/images/logo.png">
                <span class="hidden xl:block text-white text-lg ml-3">Stanforte Edge</span>
            </a>
            <div class="side-nav__devider my-6"></div>
            <ul>
                <?php self::render_sidebar_menu_items($menu_config); ?>
            </ul>
        </nav>
        <!-- END: Side Menu -->
        <?php
    }

    /**
     * Render mobile menu items from configuration
     */
    private static function render_mobile_menu_items($menu_config = null) {
        $menu_items = $menu_config ?: self::get_menu_structure();

        foreach ($menu_items as $item) {
            echo self::render_mobile_menu_item($item);
        }
    }

    /**
     * Render sidebar menu items from configuration
     */
    private static function render_sidebar_menu_items($menu_config = null) {
        $menu_items = $menu_config ?: self::get_menu_structure();

        foreach ($menu_items as $item) {
            echo self::render_side_menu_item($item);
        }
    }

    /**
     * Render a single mobile menu item using exact template structure
     */
    public static function render_mobile_menu_item($item) {
        // Handle divider
        if (isset($item['type']) && $item['type'] === 'divider') {
            return '<li class="menu__devider my-6"></li>';
        }

        $has_children = !empty($item['children']);
        $output = '<li>';

        if ($has_children) {
            // Parent menu item with children
            $output .= '<a href="javascript:;" class="menu">';
            $output .= '<div class="menu__icon"> <i data-lucide="' . esc_attr($item['icon']) . '"></i> </div>';
            $output .= '<div class="menu__title"> ' . esc_html($item['title']) . ' <i data-lucide="chevron-down" class="menu__sub-icon "></i> </div>';
            $output .= '</a>';
            $output .= '<ul class="">';

            foreach ($item['children'] as $child) {
                $output .= '<li>';
                $output .= '<a href="' . esc_url($child['url']) . '" class="menu">';
                $output .= '<div class="menu__icon"> <i data-lucide="' . esc_attr($child['icon']) . '"></i> </div>';
                $output .= '<div class="menu__title">' . esc_html($child['title']) . '</div>';
                $output .= '</a></li>';
            }

            $output .= '</ul>';
        } else {
            // Single menu item
            $output .= '<a href="' . esc_url($item['url']) . '" class="menu">';
            $output .= '<div class="menu__icon"> <i data-lucide="' . esc_attr($item['icon']) . '"></i> </div>';
            $output .= '<div class="menu__title"> ' . esc_html($item['title']) . ' </div>';
            $output .= '</a>';
        }

        $output .= '</li>';
        return $output;
    }

    /**
     * Render a single side menu item using exact template structure
     */
    public static function render_side_menu_item($item) {
        // Handle divider
        if (isset($item['type']) && $item['type'] === 'divider') {
            return '<li class="menu__devider my-6"></li>';
        }

        $has_children = !empty($item['children']);
        $output = '<li>';

        if ($has_children) {
            // Parent menu item with children
            $output .= '<a href="javascript:;" class="menu">';
            $output .= '<div class="menu__icon"> <i data-lucide="' . esc_attr($item['icon']) . '"></i> </div>';
            $output .= '<div class="menu__title"> ' . esc_html($item['title']) . ' <i data-lucide="chevron-down" class="menu__sub-icon "></i> </div>';
            $output .= '</a>';
            $output .= '<ul class="">';

            foreach ($item['children'] as $child) {
                $output .= '<li>';
                $output .= '<a href="' . esc_url($child['url']) . '" class="menu">';
                $output .= '<div class="menu__icon"> <i data-lucide="' . esc_attr($child['icon']) . '"></i> </div>';
                $output .= '<div class="menu__title">' . esc_html($child['title']) . '</div>';
                $output .= '</a></li>';
            }

            $output .= '</ul>';
        } else {
            // Single menu item
            $output .= '<a href="' . esc_url($item['url']) . '" class="menu">';
            $output .= '<div class="menu__icon"> <i data-lucide="' . esc_attr($item['icon']) . '"></i> </div>';
            $output .= '<div class="menu__title"> ' . esc_html($item['title']) . ' </div>';
            $output .= '</a>';
        }

        $output .= '</li>';
        return $output;
    }

    /**
     * Check if current page matches menu item
     */
    public static function is_menu_item_active($url) {
        $current_url = home_url(add_query_arg(null, null));

        // Handle hash-based routing for profile pages
        if (strpos($url, '/profile') !== false) {
            if (strpos($current_url, '/profile') !== false) {
                return true;
            }
        }

        return strpos($current_url, $url) !== false;
    }

    /**
     * Add active classes to menu items
     */
    public static function get_menu_item_classes($url, $active_class = 'active') {
        $classes = [];

        if (self::is_menu_item_active($url)) {
            $classes[] = $active_class;
        }

        return implode(' ', $classes);
    }
}
?>
