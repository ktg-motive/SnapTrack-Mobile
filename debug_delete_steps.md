# Debug Steps for Web App Delete Issue

## Immediate Checks

### 1. Browser Console (F12)
- Open browser dev tools and go to Console tab
- Look for any JavaScript errors when clicking delete
- Check for network errors or failed requests

### 2. Network Tab
- Open Network tab in dev tools
- Try to delete an expense
- Check if DELETE request appears in network log
- If it appears, check the response status and error message
- If it doesn't appear, the request isn't being sent

### 3. Authentication Check
- In console, type: `localStorage.getItem('firebase-auth-token')`
- Or check Application tab → Local Storage for auth tokens
- If no token, you need to sign in again

## Quick Fixes to Try

### 1. Refresh and Re-login
```bash
# Hard refresh the page
Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# Or clear browser cache and cookies for the site
```

### 2. Check Network Connectivity
```bash
# Test API connectivity
curl -X GET "https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com/health"
```

### 3. Test with a Single Expense
- Try deleting just one expense instead of multiple
- Check if the confirm dialog appears
- Check browser console during the delete attempt

## Code-Level Debugging

If the issue persists, add console logging to the delete function:

### Frontend Debug Logging
Add to `/Users/Kai/Dev/Active/SnapTrack/frontend/src/components/expenses/ExpenseList.tsx`:

```typescript
const handleDeleteExpense = async (expenseId: string) => {
  console.log('🗑️ Delete attempt for expense:', expenseId);
  
  try {
    console.log('🗑️ About to call apiClient.deleteExpense');
    await apiClient.deleteExpense(expenseId);
    console.log('🗑️ Delete successful, reloading...');
    
    // Reload current page to maintain pagination
    const page = getPageFromUrl();
    const limit = getLimitFromUrl();
    loadExpenses({ page, limit });
  } catch (err) {
    console.error('🗑️ Delete failed:', err);
    setError('Failed to delete expense');
    console.error('Error deleting expense:', err);
  }
};
```

### API Client Debug Logging
Add to `/Users/Kai/Dev/Active/SnapTrack/frontend/src/utils/api.ts`:

```typescript
async deleteExpense(id: string): Promise<void> {
  console.log('🗑️ API deleteExpense called for ID:', id);
  
  const headers = await this.getAuthHeaders();
  console.log('🗑️ Auth headers:', headers);
  
  const url = `${this.baseUrl}/api/expenses/${id}`;
  console.log('🗑️ DELETE URL:', url);
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers
  });
  
  console.log('🗑️ DELETE response status:', response.status);
  console.log('🗑️ DELETE response ok:', response.ok);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('🗑️ DELETE error response:', errorText);
    throw new Error('Failed to delete expense');
  }
  
  console.log('🗑️ DELETE successful');
}
```

## Backend Debugging

Check if requests are reaching the backend:

```bash
# Monitor backend logs in real-time
heroku logs --tail -a snaptrack-receipts

# Then try to delete an expense and see if any logs appear
```

## Common Issues and Solutions

### Issue: No confirm dialog appears
- **Cause**: JavaScript error in handleDelete
- **Solution**: Check browser console for errors

### Issue: Confirm dialog appears but nothing happens
- **Cause**: Network request failing silently
- **Solution**: Check Network tab and add debug logging

### Issue: Auth errors (401)
- **Cause**: Expired or missing authentication token
- **Solution**: Sign out and sign back in

### Issue: CORS errors
- **Cause**: Browser blocking cross-origin requests
- **Solution**: Check if backend CORS settings changed

### Issue: Server errors (500)
- **Cause**: Backend issue with delete operation
- **Solution**: Check backend logs and database

## Quick Test

Try this in browser console while on the expenses page:

```javascript
// Test if the delete function exists and works
const firstExpenseCard = document.querySelector('[data-expense-id]');
if (firstExpenseCard) {
  const expenseId = firstExpenseCard.getAttribute('data-expense-id');
  console.log('Found expense ID:', expenseId);
  
  // Try to call the delete function directly
  // (This depends on the exact component structure)
}
```