# Backend Subscription Update Guide

## Overview
We're migrating from direct Apple receipt validation to RevenueCat for subscription management. This provides better reliability, cross-platform support, and easier subscription management.

## New Endpoint Required
**Endpoint:** `/api/subscription/process-mobile-purchase` (generic name for future flexibility)

### Why the Change?
- expo-in-app-purchases has bugs with sandbox testing
- RevenueCat handles receipt validation server-side
- Same API will work for Android when we launch
- Better subscription lifecycle management

## Implementation Guide

### 1. New Endpoint Structure

```python
@app.route('/api/subscription/process-mobile-purchase', methods=['POST'])
def process_mobile_purchase():
    """
    Process a mobile subscription purchase from RevenueCat
    """
    data = request.json
    
    # Extract data sent from mobile app
    app_user_id = data.get('app_user_id')  # RevenueCat's anonymous user ID
    active_subscriptions = data.get('active_subscriptions', [])
    entitlements = data.get('entitlements', {})
    product_id = data.get('product_id')  # 'com.snaptrack.monthly'
    transaction_id = data.get('transaction_id')
    is_sandbox = data.get('is_sandbox', False)
    
    # Your existing user/auth context should be available here
    # from the authenticated request
```

### 2. Validate with RevenueCat API (Recommended)

```python
import requests

def validate_purchase_with_revenuecat(app_user_id):
    """
    Validate the subscription status with RevenueCat's REST API
    """
    headers = {
        'Authorization': 'Bearer sk_ytIxAUjYiNPqpfEvyFjfHWOaaCiOY',
        'Content-Type': 'application/json'
    }
    
    url = f'https://api.revenuecat.com/v1/subscribers/{app_user_id}'
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            subscriber = data.get('subscriber', {})
            
            # Check if user has active subscription
            subscriptions = subscriber.get('subscriptions', {})
            has_active = any(
                sub.get('expires_date') and 
                datetime.fromisoformat(sub.get('expires_date').replace('Z', '+00:00')) > datetime.now(timezone.utc)
                for sub in subscriptions.values()
            )
            
            return {
                'valid': has_active,
                'subscriber_data': subscriber
            }
    except Exception as e:
        logger.error(f"RevenueCat validation error: {e}")
        
    return {'valid': False}
```

### 3. Process the Purchase

```python
def process_mobile_purchase():
    # ... (previous code)
    
    # Validate with RevenueCat
    validation = validate_purchase_with_revenuecat(app_user_id)
    
    if not validation['valid']:
        return jsonify({
            'success': False,
            'error': 'Invalid subscription'
        }), 400
    
    # Get or create user (same logic as your current Apple flow)
    user = get_or_create_user_from_firebase_auth()  # Your existing logic
    
    # Update user's subscription status
    user.subscription_status = 'active'
    user.subscription_provider = 'revenuecat'
    user.revenuecat_app_user_id = app_user_id
    user.subscription_product_id = product_id
    user.subscription_expires_at = calculate_expiry_from_revenuecat(validation['subscriber_data'])
    
    # If new user, set up their account
    if user.is_new:
        # Your existing logic for email, subdomain, etc.
        user.receipt_email = user.email
        user.subdomain = generate_subdomain(user.email)
    
    db.session.commit()
    
    # Return same format as current endpoint
    return jsonify({
        'success': True,
        'user': {
            'receipt_email': user.receipt_email,
            'is_proxy_email': user.is_proxy_email,
            'subdomain': user.subdomain
        }
    })
```

### 4. Set Up Webhooks (Highly Recommended)

RevenueCat will send real-time updates for subscription events.

**Webhook Endpoint:** `/api/webhooks/subscription-updates`

```python
@app.route('/api/webhooks/subscription-updates', methods=['POST'])
def handle_subscription_webhook():
    """
    Handle RevenueCat webhook events
    """
    # Verify webhook authenticity (RevenueCat provides a shared secret)
    if not verify_webhook_signature(request):
        return '', 401
    
    event = request.json
    event_type = event.get('event', {}).get('type')
    app_user_id = event.get('event', {}).get('app_user_id')
    
    # Find user by RevenueCat ID
    user = User.query.filter_by(revenuecat_app_user_id=app_user_id).first()
    if not user:
        logger.error(f"User not found for RevenueCat ID: {app_user_id}")
        return '', 404
    
    # Handle different event types
    if event_type == 'INITIAL_PURCHASE':
        user.subscription_status = 'active'
    elif event_type == 'RENEWAL':
        user.subscription_status = 'active'
        user.subscription_expires_at = parse_expiry_date(event)
    elif event_type == 'CANCELLATION':
        user.subscription_status = 'cancelled'
    elif event_type == 'EXPIRATION':
        user.subscription_status = 'expired'
    
    db.session.commit()
    return '', 200
```

### 5. Database Updates Needed

```sql
-- Add RevenueCat fields to users table
ALTER TABLE users 
ADD COLUMN revenuecat_app_user_id VARCHAR(255),
ADD COLUMN subscription_provider VARCHAR(50) DEFAULT 'apple',
ADD INDEX idx_revenuecat_id (revenuecat_app_user_id);
```

### 6. Configure RevenueCat Webhooks

In RevenueCat Dashboard:
1. Go to Project Settings > Integrations > Webhooks
2. Add webhook URL: `https://your-backend.com/api/webhooks/subscription-updates`
3. Select events to receive (recommend all subscription events)
4. Copy the webhook signing secret for verification

## Migration Strategy

### For New Users:
- They'll automatically use the new RevenueCat flow
- No Apple receipt validation needed

### For Existing Users:
- Continue to support the current `/api/subscription/apple/purchase` endpoint
- Existing users will continue working with Apple receipts
- Consider migrating them to RevenueCat in the future

## Testing

1. **Sandbox Testing:**
   - RevenueCat works seamlessly with sandbox accounts
   - No more stuck transactions
   - Better error messages

2. **Test the Validation:**
   ```bash
   # Test RevenueCat API directly
   curl https://api.revenuecat.com/v1/subscribers/test_app_user_id \
     -H 'Authorization: Bearer sk_ytIxAUjYiNPqpfEvyFjfHWOaaCiOY'
   ```

3. **Monitor in RevenueCat Dashboard:**
   - See real-time purchase events
   - Debug customer issues
   - View subscription analytics

## Security Notes

1. **API Key Security:**
   - Store the RevenueCat secret key in environment variables
   - Never expose it in client code
   - Use it only for server-side validation

2. **Webhook Security:**
   - Always verify webhook signatures
   - Use HTTPS only
   - Implement idempotency for webhook processing

## Benefits of This Approach

1. **Reliability:** RevenueCat handles all the complex receipt validation
2. **Cross-Platform:** Same code will work for Android
3. **Real-Time Updates:** Webhooks ensure subscription status is always current
4. **Better Analytics:** RevenueCat dashboard provides detailed insights
5. **Easier Testing:** No more sandbox transaction issues

## Questions?
- RevenueCat Docs: https://docs.revenuecat.com
- API Reference: https://docs.revenuecat.com/reference/basic
- Webhook Events: https://docs.revenuecat.com/docs/webhooks