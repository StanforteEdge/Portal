// Global auth utilities
(function (window, $) {
    'use strict';

    if (!$ || !$.ajax) {
        console.error('jQuery with AJAX support is required for auth.js');
        return;
    }

    window.AuthUtils = {
        // Auth cache system
        cache: {
            user: null,
            lastChecked: null,
            cacheDuration: 5 * 60 * 1000, // 5 minutes cache

            isValid: function () {
                return this.user &&
                    this.lastChecked &&
                    (Date.now() - this.lastChecked) < this.cacheDuration;
            },

            set: function (user) {
                this.user = user;
                this.lastChecked = Date.now();
                console.log('Auth cache updated:', user ? 'authenticated' : 'not authenticated');
            },

            clear: function () {
                this.user = null;
                this.lastChecked = null;
                console.log('Auth cache cleared');
            }
        },

        // Decode JWT payload
        decodeToken: function (token) {
            try {
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                return decoded;
            } catch (e) {
                return null;
            }
        },

        // Check if token is expired
        isTokenExpired: function (token) {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) return true;
            return Date.now() >= decoded.exp * 1000;
        },

        // Refresh token
        refreshToken: function (callback) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                callback(false);
                return;
            }

            $.ajax({
                url: '/wp-json/api/v1/auth/refresh',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ refresh_token: refreshToken }),
                success: function (response) {
                    if (response.data && response.data.access_token && response.data.access_token.token) {
                        localStorage.setItem('jwt_token', response.data.access_token.token);
                        if (response.data.refresh_token) {
                            localStorage.setItem('refresh_token', response.data.refresh_token);
                        }
                        callback(true);
                    } else {
                        callback(false);
                    }
                },
                error: function () {
                    callback(false);
                }
            });
        },

        // Get auth token utility
        getAuthToken: function () {
            return localStorage.getItem('jwt_token') || '';
        },

        // Lazy loading auth check with caching
        checkAuthAndGetUser: function (callback) {
            console.log('Auth check requested');

            // Check cache first
            if (this.cache.isValid()) {
                console.log('Using cached auth status');
                callback(this.cache.user);
                return;
            }

            console.log('Cache expired or empty, validating with server');
            this.validateWithServer(callback);
        },

        // Server validation
        validateWithServer: function (callback) {
            const token = localStorage.getItem('jwt_token');

            if (!token) {
                console.log('No token found');
                this.cache.set(null);
                callback(null);
                return;
            }

            // Check if token is expired locally first
            if (this.isTokenExpired(token)) {
                console.log('Token expired locally');
                this.cache.set(null);

                // Try to refresh token
                this.refreshToken((refreshSuccess) => {
                    if (refreshSuccess) {
                        // Token refreshed, validate again
                        this.validateWithServer(callback);
                    } else {
                        // Refresh failed, clear tokens
                        localStorage.removeItem('jwt_token');
                        localStorage.removeItem('refresh_token');
                        callback(null);
                    }
                });
                return;
            }

            // Token looks valid locally, validate with server
            this.getUserInfo(callback);
        },

        // Get user info from /auth/status
        getUserInfo: function (callback) {
            // Priority 1: Use server-injected context for Zero-Fetch performance
            if (window.userContext && window.userContext.isLoggedIn && window.userContext.user) {
                console.log('Using Zero-Fetch user context from header');
                const user = window.userContext.user;
                window.currentUser = user;
                this.cache.set(user);

                // Sync roles to cookie for legacy components/PHP
                const roles = user.rbac_roles || user.roles || [];
                document.cookie = 'user_roles=' + JSON.stringify(roles) + '; path=/; max-age=' + (7 * 24 * 60 * 60) + '; SameSite=Lax';

                if (typeof callback === 'function') callback(user);
                return;
            }

            const token = localStorage.getItem('jwt_token');

            if (!token) {
                this.cache.set(null);
                if (typeof callback === 'function') callback(null);
                return;
            }

            $.ajax({
                url: '/wp-json/api/v1/auth/status',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function (response) {
                    if (response.data && response.data.user) {
                        window.currentUser = response.data.user;
                        window.AuthUtils.cache.set(response.data.user);

                        // Store roles in cookie for PHP access
                        const userRoles = response.data.user.rbac_roles || response.data.user.roles || [];
                        document.cookie = 'user_roles=' + JSON.stringify(userRoles) + '; path=/; max-age=' + (7 * 24 * 60 * 60) + '; SameSite=Lax';

                        if (typeof callback === 'function') callback(response.data.user);
                    } else {
                        window.AuthUtils.cache.set(null);
                        if (typeof callback === 'function') callback(null);
                    }
                },
                error: function (xhr) {
                    console.log('Auth validation failed:', xhr.status);

                    // Clear cache and tokens on auth failure
                    window.AuthUtils.cache.clear();
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('refresh_token');
                    document.cookie = 'user_roles=; path=/; max-age=0';
                    if (typeof callback === 'function') callback(null);
                }
            });
        }
    };

    // Check auth on page load - Fast check + background validation
    $(document).ready(function () {
        console.log('Page loaded, checking auth...');

        const currentPath = window.location.pathname;
        const authPages = ['/login', '/login/', '/forgot-password', '/forgot-password/', '/reset-password', '/reset-password/', '/pdf/', '/pv/', '/'];
        const publicPages = ['/organogram', '/organogram/']; // Public pages that don't require auth
        const token = localStorage.getItem('jwt_token');

        // FAST CHECK (No API call - instant redirect)
        if (authPages.includes(currentPath)) {
            console.log('Current path: ', currentPath);
            console.log('Auth pages: ', authPages);
            console.log('Token: ', token);

            // On auth pages with token - redirect immediately
            if (token) {
                console.log('Token exists on auth page, redirecting...');
                // Redirect to unified dashboard
                window.location.href = '/dashboard';
            }
            console.log('No token on auth page, staying and showing login form');
            // No token on auth page - stay and show login form
            return;
        }

        // Public pages - skip auth check entirely
        if (publicPages.includes(currentPath)) {
            console.log('Public page detected, skipping auth check');
            return;
        }

        // On protected pages without token - redirect to login immediately
        if (!token) {
            console.log('No token on protected page, redirecting to login');
            // Clear cookies to prevent AuthHelper from redirecting back
            document.cookie = 'logged_in=; path=/; max-age=0';
            document.cookie = 'user_roles=; path=/; max-age=0';
            window.location.href = '/';
            return;
        }

        // BACKGROUND VALIDATION (After page renders)
        // Token exists on protected page - validate in background
        setTimeout(function () {
            window.AuthUtils.checkAuthAndGetUser(function (user) {
                if (!user) {
                    console.log('Token validation failed, redirecting to login');
                    // Clear cookies
                    document.cookie = 'logged_in=; path=/; max-age=0';
                    document.cookie = 'user_roles=; path=/; max-age=0';
                    window.location.href = '/login';
                } else {
                    console.log('User authenticated:', user.first_name || user.email);
                }
            });
        }, 100); // Small delay to let page render first
    });

    // Logout function
    window.logout = function () {
        const token = localStorage.getItem('jwt_token');

        // Clear cookies
        document.cookie = 'logged_in=; path=/; max-age=0';
        document.cookie = 'user_roles=; path=/; max-age=0';

        if (token) {
            $.ajax({
                url: '/wp-json/api/v1/auth/logout',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function () {
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('refresh_token');
                    window.AuthUtils.cache.clear();
                    window.location.href = '/login';
                },
                error: function () {
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('refresh_token');
                    window.AuthUtils.cache.clear();
                    window.location.href = '/login';
                }
            });
        } else {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('refresh_token');
            window.AuthUtils.cache.clear();
            window.location.href = '/login';
        }
    };
})(window, window.jQuery);
