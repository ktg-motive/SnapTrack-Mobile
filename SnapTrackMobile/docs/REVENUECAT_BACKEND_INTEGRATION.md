# RevenueCat Backend Integration

## Overview
The mobile app now uses RevenueCat for subscription management instead of direct Apple receipt validation.

## New Endpoint Required
The backend needs to implement: `/api/subscription/revenuecat/purchase`

### Request Format
```json
{
  "app_user_id": "string",
  "active_subscriptions": ["string"],
  "entitlements": {},
  "product_id": "com.snaptrack.monthly",
  "transaction_id": "string",
  "is_sandbox": true/false
}
```

### Backend Implementation Steps

1. **Webhook Setup** (Recommended)
   - Set up RevenueCat webhooks in RevenueCat dashboard
   - Point to your backend endpoint (e.g., `/api/webhooks/revenuecat`)
   - This will receive real-time subscription status updates

2. **User Creation Flow**
   - When receiving the purchase request, create the user if new
   - Store the RevenueCat app_user_id
   - Set subscription status based on active_subscriptions array

3. **Validation** (Optional but recommended)
   - Use RevenueCat REST API to validate subscription status
   - API Key for server-side: `sk_ytIxAUjYiNPqpfEvyFjfHWOaaCiOY`
   - Endpoint: `https://api.revenuecat.com/v1/subscribers/{app_user_id}`

### RevenueCat REST API Example
```bash
curl https://api.revenuecat.com/v1/subscribers/APP_USER_ID \
  -H 'Authorization: Bearer sk_ytIxAUjYiNPqpfEvyFjfHWOaaCiOY' \
  -H 'Content-Type: application/json'
```

### Response Handling
Return the same response format as the current Apple endpoint:
```json
{
  "success": true,
  "user": {
    "receipt_email": "user@example.com",
    "is_proxy_email": false,
    "subdomain": "user-subdomain"
  }
}
```

## Benefits of RevenueCat
1. Handles receipt validation automatically
2. Works across iOS and Android with same API
3. Manages subscription lifecycle (renewals, cancellations)
4. Provides webhooks for real-time updates
5. Better sandbox testing support

## Testing
- RevenueCat works well with sandbox accounts
- No more stuck transactions
- Cleaner error handling
- Better debugging with RevenueCat dashboard