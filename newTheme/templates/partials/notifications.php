<!-- BEGIN: Error Notification Content -->
<div id="error-notification-content" class="toastify-content hidden flex"> <i class="text-danger toastify-icon" data-lucide="x-circle"></i>
     <div class="ml-4 mr-4">
         <div class="font-medium text-danger">Error</div>
         <div class="text-slate-500 kkk mt-1 error-message"></div>
     </div>
 </div>
<!-- END: Error Notification Content -->

<!-- BEGIN: Info Notification Content -->
<div id="info-notification-content" class="toastify-content hidden flex"> <i class="text-pending toastify-icon" data-lucide="alert-circle"></i>
     <div class="ml-4 mr-4">
         <div class="font-medium text-pending">Info</div>
         <div class="text-slate-500 mt-1 info-message"></div>
     </div>
 </div>
<!-- END: Info Notification Content -->

<!-- BEGIN: Notification Content -->
<div id="success-notification-content" class="toastify-content hidden flex"> <i class="text-success toastify-icon" data-lucide="check-circle"></i>
     <div class="ml-4 mr-4">
         <div class="font-medium text-success">Success</div>
         <div class="text-slate-500 mt-1 success-message"></div>
     </div>
 </div> <!-- END: Notification Content -->

<script>
// Global notification functions
console.log('Loading showNotification...');

if (typeof jQuery === 'undefined') {
    console.error('jQuery is not loaded!');
}

if (typeof Toastify === 'undefined') {
    console.error('Toastify is not loaded!');
}

window.showNotification = {
    error: function(message) {
        console.log('showNotification.error called with:', message);
        console.log('showNotification.error method exists:', typeof this.error);
        
        try {
            // Update error message
            jQuery('#error-notification-content .error-message').text(message);
            jQuery('.toastify-icon').removeClass('hidden');
            
            // Show notification - requires user interaction to dismiss
            Toastify({
                node: jQuery('#error-notification-content')
                    .clone()
                    .removeClass('hidden')[0],
                duration: 0, // Persistent until dismissed
                newWindow: true,
                close: true,
                stopOnFocus: true,
            }).showToast();
        } catch (e) {
            console.error('Error in showNotification.error:', e);
        }
    },
    
    success: function(message) {
        console.log('showNotification.success called with:', message);
        console.log('showNotification.success method exists:', typeof this.success);
        
        try {
            // Update success message
            jQuery('#success-notification-content .success-message').text(message);
            jQuery('.toastify-icon').removeClass('hidden');
            
            // Show notification
            Toastify({
                node: jQuery('#success-notification-content')
                    .clone()
                    .removeClass('hidden')[0],
                duration: 5000,
                newWindow: true,
                close: true,
                stopOnFocus: true,
            }).showToast();
        } catch (e) {
            console.error('Error in showNotification.success:', e);
        }
    },

    info: function(message) {
        console.log('showNotification.info called with:', message);
        console.log('showNotification.info method exists:', typeof this.info);
        
        try {
            // Update info message
            jQuery('#info-notification-content .info-message').text(message);
            jQuery('.toastify-icon').removeClass('hidden');
            
            // Show notification
            Toastify({
                node: jQuery('#info-notification-content')
                    .clone()
                    .removeClass('hidden')[0],
                duration: 5000,
                newWindow: true,
                close: true,
                stopOnFocus: true,
            }).showToast();
        } catch (e) {
            console.error('Error in showNotification.info:', e);
        }
    }
};

// Verify methods are defined
console.log('showNotification methods check:');
console.log('- error method:', typeof window.showNotification.error);
console.log('- success method:', typeof window.showNotification.success);
console.log('- info method:', typeof window.showNotification.info);
console.log('showNotification object created:', typeof window.showNotification);
</script>
