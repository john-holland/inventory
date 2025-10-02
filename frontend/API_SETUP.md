# Drop Shipping API Bridge Setup

This document explains how to set up the API credentials and environment variables for the drop shipping API bridge.

## Required Environment Variables

The API bridge requires the following environment variables to be set in your browser's `window.ENV` object:

### Amazon Product Advertising API
```javascript
window.ENV = {
  AMAZON_API_KEY: 'your-amazon-api-key',
  AMAZON_PARTNER_TAG: 'your-partner-tag',
  AMAZON_SECRET_KEY: 'your-secret-key',
  AMAZON_MARKETPLACE: 'US' // or other marketplace code
};
```

**API URLs:**
- Product Lookup: `https://webservices.amazon.com/paapi5/getitems`
- Documentation: https://webservices.amazon.com/paapi5/documentation/

### eBay Finding API
```javascript
window.ENV = {
  EBAY_APP_ID: 'your-ebay-app-id',
  EBAY_AUTH_TOKEN: 'your-auth-token',
  EBAY_CERT_ID: 'your-cert-id',
  EBAY_DEV_ID: 'your-dev-id'
};
```

**API URLs:**
- Item Search: `https://api.ebay.com/buy/browse/v1/item_summary/search`
- Item Details: `https://api.ebay.com/buy/browse/v1/item/{itemId}`
- Documentation: https://developer.ebay.com/api-docs/buy/browse/overview.html

### Walmart API
```javascript
window.ENV = {
  WALMART_CLIENT_ID: 'your-client-id',
  WALMART_PARTNER_ID: 'your-partner-id',
  WALMART_CLIENT_SECRET: 'your-client-secret'
};
```

**API URLs:**
- Item Search: `https://api.walmart.com/v3/items/search`
- Item Details: `https://api.walmart.com/v3/items/{itemId}`
- Documentation: https://developer.walmart.com/

## Setting Up Environment Variables

### For Development
Add this to your `public/index.html` or main HTML file:

```html
<script>
  window.ENV = {
    // Amazon
    AMAZON_API_KEY: 'your-amazon-api-key',
    AMAZON_PARTNER_TAG: 'your-partner-tag',
    AMAZON_SECRET_KEY: 'your-secret-key',
    AMAZON_MARKETPLACE: 'US',
    
    // eBay
    EBAY_APP_ID: 'your-ebay-app-id',
    EBAY_AUTH_TOKEN: 'your-auth-token',
    EBAY_CERT_ID: 'your-cert-id',
    EBAY_DEV_ID: 'your-dev-id',
    
    // Walmart
    WALMART_CLIENT_ID: 'your-client-id',
    WALMART_PARTNER_ID: 'your-partner-id',
    WALMART_CLIENT_SECRET: 'your-client-secret'
  };
</script>
```

### For Production
Set these as environment variables in your deployment platform and inject them into the HTML template.

## API Testing

The system includes comprehensive API testing that:

1. **Validates Credentials**: Tests API keys and authentication tokens
2. **Checks Connectivity**: Verifies endpoints are reachable
3. **Measures Response Times**: Tracks API performance
4. **Validates Read-Only Operations**: Ensures no interference with existing listings

## Charity Program Integration

When charity features are enabled, the system uses official platform charity programs:

- **Amazon Smile**: Uses Amazon's official charity donation system
- **eBay for Charity**: Uses eBay's Giving Works program
- **Walmart Foundation**: Uses Walmart's community giving programs

## Safety Features

- **Read-Only by Default**: All operations are read-only except charity orders
- **Official Channels Only**: Charity orders use only official platform programs
- **Rate Limiting**: Respects platform-specific API rate limits
- **Terms of Service Compliance**: Stubbed checks for ToS compliance
- **No Interference**: Designed to not interfere with existing drop shipping operations

## Unleash Feature Toggle

The charity features can be toggled on/off using the Unleash feature flag system:

```typescript
// Enable charity features
apiBridge.setCharityFeaturesEnabled(true);

// Disable charity features
apiBridge.setCharityFeaturesEnabled(false);

// Check current status
const isEnabled = apiBridge.isCharityFeaturesEnabled();
```

When disabled:
- All charity-related functionality is turned off
- API connections are not established
- No charity orders can be placed
- Regular inventory sharing continues to work

## Testing the Setup

1. Set up your environment variables
2. Enable charity features using the toggle
3. Run API tests to verify connectivity
4. Check the compliance report for status
5. Test item lookup functionality

## Troubleshooting

### Common Issues

1. **"API Bridge not connected"**: Check that charity features are enabled and API credentials are valid
2. **"Invalid credentials"**: Verify your API keys and tokens are correct
3. **"Rate limit exceeded"**: Wait and retry, or check your API usage limits
4. **"Terms of service violation"**: Review the platform's ToS and ensure compliance

### Debug Mode

Enable debug logging by checking the browser console. The API bridge provides detailed logging for:
- Connection attempts
- API responses
- Error details
- Compliance checks

## Security Notes

- Never commit API credentials to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor API usage for unusual activity
- Follow platform-specific security guidelines 