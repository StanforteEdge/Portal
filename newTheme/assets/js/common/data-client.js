(function (window, $) {
    'use strict';

    if (!$) {
        console.error('jQuery is required for data-client.js');
        return;
    }

    var ApiClient = {
        request: function (options) {
            return new Promise(function (resolve, reject) {
                var ajaxOptions = buildAjaxOptions(options, resolve, reject, false);
                $.ajax(ajaxOptions);
            });
        },
        get: function (url, params) {
            return this.request({ url: url, method: 'GET', params: params });
        },
        post: function (url, data) {
            return this.request({ url: url, method: 'POST', data: data });
        },
        put: function (url, data) {
            return this.request({ url: url, method: 'PUT', data: data });
        },
        delete: function (url) {
            return this.request({ url: url, method: 'DELETE' });
        }
    };

    function buildAjaxOptions(options, resolve, reject, isRetry) {
        var method = (options.method || 'GET').toUpperCase();
        var headers = buildHeaders(options.headers || {});
        var ajaxOptions = {
            url: options.url,
            method: method,
            dataType: 'json',
            headers: headers,
            data: prepareData(method, options.data, options.params),
            contentType: options.contentType || inferContentType(method),
            success: function (response) {
                resolve(response);
            },
            error: function (xhr) {
                if (xhr.status === 401 && !isRetry) {
                    handleUnauthorized(options, resolve, reject);
                    return;
                }
                reject(normalizeError(xhr));
            }
        };

        return ajaxOptions;
    }

    function buildHeaders(customHeaders) {
        var headers = $.extend({}, customHeaders);
        if (window.AuthUtils && typeof window.AuthUtils.getAuthToken === 'function') {
            var token = window.AuthUtils.getAuthToken();
            
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
        }
        headers['Accept'] = 'application/json';
        return headers;
    }

    function prepareData(method, data, params) {
        if (method === 'GET') {
            return params || {};
        }
        if (!data) {
            return null;
        }
        if (typeof data === 'string') {
            return data;
        }
        return JSON.stringify(data);
    }

    function inferContentType(method) {
        return method === 'GET' ? undefined : 'application/json';
    }

    function handleUnauthorized(options, resolve, reject) {
        if (!(window.AuthUtils && typeof window.AuthUtils.refreshToken === 'function')) {
            reject({ status: 401, message: 'Unauthorized' });
            return;
        }

        window.AuthUtils.refreshToken(function (success) {
            if (!success) {
                reject({ status: 401, message: 'Unauthorized' });
                return;
            }
            var retryOptions = buildAjaxOptions(options, resolve, reject, true);
            $.ajax(retryOptions);
        });
    }

    function normalizeError(xhr) {
        if (!xhr) {
            return { status: 0, message: 'Unknown error' };
        }
        var message;
        if (xhr.responseJSON && xhr.responseJSON.message) {
            message = xhr.responseJSON.message;
        } else if (xhr.statusText) {
            message = xhr.statusText;
        } else {
            message = 'Request failed';
        }
        return {
            status: xhr.status,
            message: message,
            response: xhr.responseJSON || null
        };
    }

    window.ApiClient = ApiClient;
})(window, window.jQuery);
