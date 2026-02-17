<!-- BEGIN: JS Assets-->


<!-- BEGIN: Error Notification Content -->
<div id="notification-error" class="toastify-content hidden flex"> <i class="text-danger toastify-icon"
        data-lucide="x-circle"></i>
    <div class="ml-4 mr-4">
        <div class="font-medium text-danger">Error</div>
        <div class="text-slate-500 mt-1 message"></div>
    </div>
</div>
<!-- END: Error Notification Content -->

<!-- BEGIN: Info Notification Content -->
<div id="notification-info" class="toastify-content hidden flex"> <i class="text-pending toastify-icon"
        data-lucide="alert-circle"></i>
    <div class="ml-4 mr-4">
        <div class="font-medium text-pending">Info</div>
        <div class="text-slate-500 mt-1 message"></div>
    </div>
</div>
<!-- END: Info Notification Content -->

<!-- BEGIN: Notification Content -->
<div id="notification-success" class="toastify-content hidden flex"> <i class="text-success toastify-icon"
        data-lucide="check-circle"></i>
    <div class="ml-4 mr-4">
        <div class="font-medium text-success">Success</div>
        <div class="text-slate-500 mt-1 message"></div>
    </div>
</div>
<!-- END: Notification Content -->

<!-- BEGIN: Confirmation Modal -->
<div id="confirmation-modal" class="modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="font-medium text-base mr-auto" id="confirmation-title">Please Confirm</h2>
                <button type="button" data-tw-dismiss="modal" class="btn btn-outline-danger hidden sm:flex">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="modal-body">
                <p class="text-slate-600" id="confirmation-message">Are you sure you want to continue?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary mr-2" id="confirmation-cancel-btn"
                    data-tw-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmation-confirm-btn">Confirm</button>
            </div>
        </div>
    </div>
</div>
<!-- END: Confirmation Modal -->

<!-- BEGIN: Standard Modal (Generated via Partial) -->
<?php
get_template_part('templates/partials/detail-modal', null, [
    'id' => 'standard-modal',
    'title' => 'Modal Title',
    'body' => '<!-- Dynamic Content -->',
    'footer' => '<!-- Dynamic Footer -->',
    'size' => '' // Default size, JS can toggle classes
]);
?>
<!-- END: Standard Modal -->

<?php
wp_footer();
?>

<!-- END: JS Assets-->
<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.12.0/toastify.min.js" integrity="sha512-0Yc4Jv5wX4+mjDuLxmHFGqgDtMFAEBLpPq/0nPVmAOwHPMkYXiS1YVYWTcrVQztftk/32089DDTyrCJO8hBCZw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> -->
<script>
    var successNotification = $("#notification-success").clone();
    var errorNotification = $("#notification-error").clone();
    var infoNotification = $("#notification-info").clone();

    function showToast(message, type = 'success') {
        const toastOptions = {
            duration: 3000,
            newWindow: true,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: 'transparent'
            },
        };

        const notification = type === 'success' ? successNotification : (type === 'info' ? infoNotification : errorNotification);

        notification.removeClass('hidden').find('.message').text(message);

        Toastify({
            node: notification[0],
            ...toastOptions,
        }).showToast();
    }

    (function () {
        // --- Confirmation Modal Logic ---
        const confirmModalElement = document.getElementById('confirmation-modal');
        const confirmTitleElement = document.getElementById('confirmation-title');
        const confirmMessageElement = document.getElementById('confirmation-message');
        const confirmConfirmButton = document.getElementById('confirmation-confirm-btn');
        const confirmCancelButton = document.getElementById('confirmation-cancel-btn');
        let confirmModalInstance = null;
        let confirmResolver = null;
        let confirmIsClosingByAction = false;

        function ensureConfirmModalInstance() {
            if (!confirmModalElement || !window.tailwind || !window.tailwind.Modal) return null;
            if (!confirmModalInstance) {
                confirmModalInstance = window.tailwind.Modal.getOrCreateInstance(confirmModalElement);
            }
            return confirmModalInstance;
        }

        function resolveConfirmPending(result) {
            if (confirmResolver) {
                const resolve = confirmResolver;
                confirmResolver = null;
                resolve(result);
            }
        }

        if (confirmModalElement && confirmConfirmButton && confirmCancelButton) {
            confirmConfirmButton.addEventListener('click', function () {
                confirmIsClosingByAction = true;
                resolveConfirmPending(true);
                const instance = ensureConfirmModalInstance();
                if (instance) instance.hide();
            });

            confirmCancelButton.addEventListener('click', function () {
                confirmIsClosingByAction = true;
                resolveConfirmPending(false);
            });

            confirmModalElement.addEventListener('hidden.tw.modal', function () {
                if (!confirmIsClosingByAction) resolveConfirmPending(false);
                confirmIsClosingByAction = false;
            });
        }

        window.showConfirmation = function (options = {}) {
            const instance = ensureConfirmModalInstance();

            if (!instance || !confirmModalElement) {
                const fallbackMessage = options.message || 'Are you sure you want to continue?';
                return Promise.resolve(window.confirm(fallbackMessage));
            }

            confirmTitleElement.textContent = options.title || 'Please Confirm';
            // Allow HTML in message for formatting
            confirmMessageElement.innerHTML = options.message || 'Are you sure you want to continue?';
            confirmConfirmButton.textContent = options.confirmText || 'Confirm';

            confirmConfirmButton.classList.remove('btn-danger', 'btn-primary');
            confirmConfirmButton.classList.add(options.confirmType === 'danger' ? 'btn-danger' : 'btn-primary');

            return new Promise((resolve) => {
                confirmResolver = resolve;
                confirmIsClosingByAction = false;
                instance.show();
            });
        };


        // --- Standard Dynamic Modal Logic ---
        const standardModalElement = document.getElementById('standard-modal');
        // Selectors based on detail-modal.php attributes
        const standardTitleSelector = '[data-modal-title]';
        const standardBodySelector = '[data-modal-body]';
        const standardFooterSelector = '[data-modal-footer]';

        let standardModalInstance = null;

        function ensureStandardModalInstance() {
            if (!standardModalElement || !window.tailwind || !window.tailwind.Modal) return null;
            if (!standardModalInstance) {
                standardModalInstance = window.tailwind.Modal.getOrCreateInstance(standardModalElement);
            }
            return standardModalInstance;
        }

        /**
         * Show the Standard Modal
         * @param {Object} options
         * @param {string} options.title - Modal title
         * @param {string|HTMLElement|jQuery} options.body - Modal body content
         * @param {string|HTMLElement|jQuery} [options.footer] - Modal footer content (optional)
         * @param {string} [options.size] - 'modal-sm', 'modal-lg', 'modal-xl', or empty for default
         */
        window.showModal = function (options = {}) {
            const instance = ensureStandardModalInstance();
            if (!instance) {
                console.error('Standard modal element or Tailwind dependencies missing');
                return;
            }

            // Select elements using Vanilla JS
            const titleEl = standardModalElement.querySelector(standardTitleSelector);
            const bodyEl = standardModalElement.querySelector(standardBodySelector);
            const footerEl = standardModalElement.querySelector(standardFooterSelector);

            // 1. Set Title
            if (titleEl) {
                titleEl.textContent = options.title || 'Modal';
            }

            // 2. Set Body
            if (bodyEl) {
                bodyEl.innerHTML = '';
                if (options.body) {
                    if (typeof options.body === 'string') {
                        bodyEl.innerHTML = options.body;
                    } else if (options.body instanceof HTMLElement) {
                        bodyEl.appendChild(options.body);
                    } else if (window.jQuery && options.body instanceof window.jQuery) {
                        options.body.appendTo(bodyEl);
                    } else {
                        // Fallback for jQuery-like objects or strict string coercion
                        bodyEl.innerHTML = String(options.body);
                    }
                }
            }

            // 3. Set Footer
            if (footerEl) {
                footerEl.innerHTML = '';
                if (options.footer) {
                    if (typeof options.footer === 'string') {
                        footerEl.innerHTML = options.footer;
                    } else if (options.footer instanceof HTMLElement) {
                        footerEl.appendChild(options.footer);
                    } else if (window.jQuery && options.footer instanceof window.jQuery) {
                        options.footer.appendTo(footerEl);
                    } else {
                        footerEl.innerHTML = String(options.footer);
                    }

                    footerEl.style.display = '';
                    footerEl.classList.remove('hidden');
                } else {
                    footerEl.style.display = 'none';
                }
            }

            // 4. Set Size
            // Need to find the dialog wrapper which usually has the size class
            const dialog = standardModalElement.querySelector('.modal-dialog');
            if (dialog) {
                dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl', 'max-w-3xl');
                if (options.size) {
                    dialog.classList.add(options.size);
                } else {
                    // Re-add default if no size specified, or leave plain
                    dialog.classList.add('max-w-3xl');
                }
            }

            // 5. Show
            instance.show();

            // Return element for chaining/finding
            return standardModalElement;
        };

        window.hideModal = function () {
            const instance = ensureStandardModalInstance();
            if (instance) {
                instance.hide();
            }
        };

    })();

    // ========================================
    // Global Date/Time Utility Functions
    // ========================================

    /**
     * Format time string (HH:MM:SS or HH:MM) to 12-hour format with AM/PM
     * @param {string} timeString - Time in 24-hour format (e.g., "14:30" or "14:30:00")
     * @returns {string} Formatted time (e.g., "2:30 PM")
     */
    window.formatTime = function (timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    /**
     * Format date object or string to YYYY-MM-DD for input fields
     * @param {string|Date} dateString - Date to format
     * @returns {string} Formatted date (e.g., "2024-01-20")
     */
    window.formatDateForInput = function (dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    /**
     * Format date to readable format (e.g., "Jan 20, 2024")
     * @param {string|Date} dateString - Date to format
     * @returns {string} Formatted date
     */
    window.formatDate = function (dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return String(dateString);

        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };

    /**
     * Format datetime to full readable format
     * @param {string|Date} value - DateTime to format
     * @returns {string} Formatted datetime (e.g., "Jan 20, 2024, 2:30 PM")
     */
    window.formatDateTime = function (value) {
        if (!value) return '—';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);

        return date.toLocaleString();
    };

    /**
     * Format datetime to relative time (e.g., "2h ago", "3d ago")
     * @param {string|Date} dateString - Date to format
     * @returns {string} Relative time string
     */
    window.formatTimeAgo = function (dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';

        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + 'm ago';

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h ago';

        const days = Math.floor(hours / 24);
        if (days < 7) return days + 'd ago';

        const weeks = Math.floor(days / 7);
        if (weeks < 4) return weeks + 'w ago';

        const months = Math.floor(days / 30);
        if (months < 12) return months + 'mo ago';

        const years = Math.floor(days / 365);
        return years + 'y ago';
    };

    // ========================================
    // Other Global Utility Functions
    // ========================================


    window.escapeHtml = function (text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    };

    window.debounce = function (func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };
</script>


</body>

</html>