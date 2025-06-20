const { CoinbaseCommerceService } = require("../services/coinbaseCommerceService");
const { OAuth2Service } = require("../services/oauth2Service");

class CryptoController {
  constructor(DI) {
    this.DI = DI;
    this.coinbaseService = new CoinbaseCommerceService(DI);
    this.oauth2Service = new OAuth2Service(DI);
  }

  // Create a cryptocurrency payment
  async createCryptoPayment(req, res) {
    try {
      const { amount, currency = 'USD', preferredCrypto } = req.body;
      const userId = req.user.id;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const payment = await this.coinbaseService.createCryptoPayment(
        userId,
        amount,
        currency,
        preferredCrypto
      );

      res.json({
        success: true,
        payment,
        note: `Service fee of $${payment.serviceFee} (1%) applied to cryptocurrency payment. Payment will be processed through Coinbase Commerce.`
      });
    } catch (error) {
      console.error('Error creating crypto payment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get cryptocurrency payment status
  async getPaymentStatus(req, res) {
    try {
      const { chargeId } = req.params;
      const userId = req.user.id;

      const status = await this.coinbaseService.getPaymentStatus(chargeId);
      
      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get user's cryptocurrency payment history
  async getUserCryptoPayments(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50 } = req.query;

      const payments = await this.coinbaseService.getUserCryptoPayments(userId, parseInt(limit));
      
      res.json({
        success: true,
        payments,
        note: "Cryptocurrency payments include a 1% service fee to cover transaction processing and platform costs."
      });
    } catch (error) {
      console.error('Error getting crypto payments:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get supported cryptocurrencies
  async getSupportedCryptocurrencies(req, res) {
    try {
      const cryptocurrencies = this.coinbaseService.getSupportedCryptocurrencies();
      
      res.json({
        success: true,
        cryptocurrencies,
        note: "Supported cryptocurrencies for payments and investments. Service fees may vary by cryptocurrency."
      });
    } catch (error) {
      console.error('Error getting supported cryptocurrencies:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Handle Coinbase Commerce webhook
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-cc-webhook-signature'];
      const payload = req.body;

      if (!signature) {
        return res.status(400).json({ error: 'Missing webhook signature' });
      }

      const result = await this.coinbaseService.handleWebhook(payload, signature);
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Generate OAuth2 authorization URL with QR code
  async generateOAuthURL(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.user.id;
      const { state } = req.query;

      const oauthData = await this.oauth2Service.generateOAuthURL(provider, userId, state);
      
      res.json({
        success: true,
        oauthData,
        note: `OAuth2 authentication for ${provider}. Scan the QR code or visit the URL to authenticate. A 0.1% verification fee will be applied.`
      });
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Handle OAuth2 callback
  async handleOAuthCallback(req, res) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
      }

      const result = await this.oauth2Service.handleOAuthCallback(provider, code, state);
      
      res.json({
        success: true,
        result,
        note: "OAuth2 authentication completed successfully. Verification fee has been added to water limit."
      });
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get user's OAuth credentials
  async getUserOAuthCredentials(req, res) {
    try {
      const userId = req.user.id;

      const credentials = await this.oauth2Service.getUserOAuthCredentials(userId);
      
      res.json({
        success: true,
        credentials,
        note: "OAuth credentials for cryptocurrency services. These enable secure API access for trading and account management."
      });
    } catch (error) {
      console.error('Error getting OAuth credentials:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Revoke OAuth credentials
  async revokeOAuthCredentials(req, res) {
    try {
      const { credentialId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const credential = await this.DI.oauthCredentialRepository.findOne({
        id: credentialId,
        userId
      });

      if (!credential) {
        return res.status(404).json({ error: 'OAuth credential not found' });
      }

      const result = await this.oauth2Service.revokeOAuthCredentials(credentialId);
      
      res.json({
        success: true,
        result,
        note: "OAuth credentials revoked successfully. You can re-authenticate anytime."
      });
    } catch (error) {
      console.error('Error revoking OAuth credentials:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Refresh OAuth access token
  async refreshAccessToken(req, res) {
    try {
      const { credentialId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const credential = await this.DI.oauthCredentialRepository.findOne({
        id: credentialId,
        userId
      });

      if (!credential) {
        return res.status(404).json({ error: 'OAuth credential not found' });
      }

      const result = await this.oauth2Service.refreshAccessToken(credentialId);
      
      res.json({
        success: true,
        result,
        note: "Access token refreshed successfully."
      });
    } catch (error) {
      console.error('Error refreshing access token:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get cryptocurrency analytics
  async getCryptoAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const analytics = await this.coinbaseService.getCryptoAnalytics(
        new Date(startDate),
        new Date(endDate)
      );
      
      res.json({
        success: true,
        analytics,
        note: "Cryptocurrency payment analytics including service fees and transaction volumes."
      });
    } catch (error) {
      console.error('Error getting crypto analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get OAuth analytics
  async getOAuthAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const analytics = await this.oauth2Service.getOAuthAnalytics(
        new Date(startDate),
        new Date(endDate)
      );
      
      res.json({
        success: true,
        analytics,
        note: "OAuth2 authentication analytics including verification fees and provider usage."
      });
    } catch (error) {
      console.error('Error getting OAuth analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = { CryptoController }; 