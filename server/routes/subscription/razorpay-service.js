// Razorpay Service
// Wrapper for Razorpay API integration
(function() {
    var Razorpay = require('razorpay');
    
    var razorpayInstance = null;
    
    function RazorpayService() {
        // Initialize Razorpay with keys from environment
        var keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY;
        var keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
        
        if (!keyId || !keySecret) {
            log('Warning: Razorpay keys not configured. Using test keys.');
            keyId = keyId || 'rzp_test_1DP5mmOlF5G5ag'; // Placeholder - should be in env
            keySecret = keySecret || 'test_secret'; // Placeholder - should be in env
        }
        
        try {
            razorpayInstance = new Razorpay({
                key_id: keyId,
                key_secret: keySecret
            });
            log('Razorpay initialized successfully');
        } catch (error) {
            log('Error initializing Razorpay:', error);
            razorpayInstance = null;
        }
    }
    
    // Create payment order
    RazorpayService.prototype.createOrder = async function(orderData) {
        if (!razorpayInstance) {
            throw new Error('Razorpay not initialized');
        }
        
        try {
            var options = {
                amount: orderData.amount * 100, // Convert to paise
                currency: orderData.currency || 'INR',
                receipt: orderData.receipt || 'receipt_' + Date.now(),
                notes: orderData.notes || {}
            };
            
            var order = await razorpayInstance.orders.create(options);
            return {
                success: true,
                order: order,
                order_id: order.id
            };
        } catch (error) {
            log('Error creating Razorpay order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Verify payment signature
    RazorpayService.prototype.verifyPayment = function(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
        if (!razorpayInstance) {
            return { success: false, error: 'Razorpay not initialized' };
        }
        
        try {
            var crypto = require('crypto');
            var keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
            
            var generatedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(razorpay_order_id + '|' + razorpay_payment_id)
                .digest('hex');
            
            var isValid = generatedSignature === razorpay_signature;
            
            return {
                success: isValid,
                verified: isValid,
                error: isValid ? null : 'Invalid signature'
            };
        } catch (error) {
            log('Error verifying Razorpay payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Fetch payment details
    RazorpayService.prototype.getPayment = async function(paymentId) {
        if (!razorpayInstance) {
            throw new Error('Razorpay not initialized');
        }
        
        try {
            var payment = await razorpayInstance.payments.fetch(paymentId);
            return {
                success: true,
                payment: payment
            };
        } catch (error) {
            log('Error fetching Razorpay payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Create subscription (for recurring payments)
    RazorpayService.prototype.createSubscription = async function(subscriptionData) {
        if (!razorpayInstance) {
            throw new Error('Razorpay not initialized');
        }
        
        try {
            var options = {
                plan_id: subscriptionData.plan_id,
                customer_notify: subscriptionData.customer_notify !== false,
                quantity: subscriptionData.quantity || 1,
                total_count: subscriptionData.total_count || 12, // 12 months default
                notes: subscriptionData.notes || {}
            };
            
            var subscription = await razorpayInstance.subscriptions.create(options);
            return {
                success: true,
                subscription: subscription,
                subscription_id: subscription.id
            };
        } catch (error) {
            log('Error creating Razorpay subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Get subscription details
    RazorpayService.prototype.getSubscription = async function(subscriptionId) {
        if (!razorpayInstance) {
            throw new Error('Razorpay not initialized');
        }
        
        try {
            var subscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
            return {
                success: true,
                subscription: subscription
            };
        } catch (error) {
            log('Error fetching Razorpay subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Cancel subscription
    RazorpayService.prototype.cancelSubscription = async function(subscriptionId) {
        if (!razorpayInstance) {
            throw new Error('Razorpay not initialized');
        }
        
        try {
            var subscription = await razorpayInstance.subscriptions.cancel(subscriptionId);
            return {
                success: true,
                subscription: subscription
            };
        } catch (error) {
            log('Error cancelling Razorpay subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Initialize service
    var service = new RazorpayService();
    
    module.exports = service;
})();

