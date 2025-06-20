const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const QRCode = require('qrcode');
const crypto = require('crypto');
const { wrap } = require("@mikro-orm/core");
const { WaterLimitService } = require("./waterLimitService");

class OAuth2Service {
  constructor(DI) {
    this.DI = DI;
    this.waterLimitService = new WaterLimitService(DI);
    
    this.oauthProviders = {
      coinbase: {
        clientID: process.env.COINBASE_CLIENT_ID,
        clientSecret: process.env.COINBASE_CLIENT_SECRET,
        callbackURL: process.env.COINBASE_CALLBACK_URL,
        authorizationURL: 'https://www.coinbase.com/oauth/authorize',
        tokenURL: 'https://api.coinbase.com/oauth/token',
        scope: 'wallet:accounts:read wallet:transactions:read'
      },
      binance: {
        clientID: process.env.BINANCE_CLIENT_ID,
        clientSecret: process.env.BINANCE_CLIENT_SECRET,
        callbackURL: process.env.BINANCE_CALLBACK_URL,
        authorizationURL: 'https://accounts.binance.com/oauth/authorize',
        tokenURL: 'https://accounts.binance.com/oauth/token',
        scope: 'read'
      }
    };

    this.setupPassportStrategies();
  }

  // Setup Passport strategies for different OAuth providers
  setupPassportStrategies() {
    // Coinbase OAuth2 Strategy
    passport.use('coinbase', new OAuth2Strategy(
      this.oauthProviders.coinbase,
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Store OAuth credentials
          const oauthCredential = new this.DI.oauthCredentialRepository.entity(
            profile.id,
            'coinbase',
            accessToken,
            refreshToken,
            profile,
            'active'
          );

          await this.DI.oauthCredentialRepository.persistAndFlush(oauthCredential);
          
          // Add OAuth verification fee to water limit
          const verificationFee = 0.001; // 0.1% verification fee
          await this.waterLimitService.addToWaterLimit(
            profile.id,
            verificationFee,
            'oauth_verification',
            oauthCredential.id
          );

          return done(null, { 
            id: profile.id, 
            provider: 'coinbase',
            oauthCredentialId: oauthCredential.id 
          });
        } catch (error) {
          return done(error);
        }
      }
    ));

    // Binance OAuth2 Strategy
    passport.use('binance', new OAuth2Strategy(
      this.oauthProviders.binance,
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Store OAuth credentials
          const oauthCredential = new this.DI.oauthCredentialRepository.entity(
            profile.id,
            'binance',
            accessToken,
            refreshToken,
            profile,
            'active'
          );

          await this.DI.oauthCredentialRepository.persistAndFlush(oauthCredential);
          
          // Add OAuth verification fee to water limit
          const verificationFee = 0.001; // 0.1% verification fee
          await this.waterLimitService.addToWaterLimit(
            profile.id,
            verificationFee,
            'oauth_verification',
            oauthCredential.id
          );

          return done(null, { 
            id: profile.id, 
            provider: 'binance',
            oauthCredentialId: oauthCredential.id 
          });
        } catch (error) {
          return done(error);
        }
      }
    ));
  }

  // Generate OAuth2 authorization URL with QR code
  async generateOAuthURL(provider, userId, state = null) {
    if (!this.oauthProviders[provider]) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const config = this.oauthProviders[provider];
    const authState = state || crypto.randomBytes(32).toString('hex');
    
    // Store OAuth state for verification
    const oauthState = new this.DI.oauthStateRepository.entity(
      userId,
      provider,
      authState,
      new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    );

    await this.DI.oauthStateRepository.persistAndFlush(oauthState);

    const authUrl = `${config.authorizationURL}?` +
      `client_id=${config.clientID}&` +
      `redirect_uri=${encodeURIComponent(config.callbackURL)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(config.scope)}&` +
      `state=${authState}`;

    // Generate QR code for the authorization URL
    const qrCode = await this.generateQRCode(authUrl);

    return {
      authUrl,
      qrCode,
      state: authState,
      provider,
      expiresAt: oauthState.expiresAt
    };
  }

  // Generate QR code for OAuth URL
  async generateQRCode(url) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating OAuth QR code:', error);
      return null;
    }
  }

  // Verify OAuth state
  async verifyOAuthState(state, provider) {
    const oauthState = await this.DI.oauthStateRepository.findOne({
      state,
      provider,
      expiresAt: { $gt: new Date() }
    });

    if (!oauthState) {
      throw new Error('Invalid or expired OAuth state');
    }

    // Mark state as used
    wrap(oauthState).assign({
      used: true,
      usedAt: new Date()
    });

    await this.DI.oauthStateRepository.flush();

    return oauthState;
  }

  // Handle OAuth callback
  async handleOAuthCallback(provider, code, state) {
    try {
      // Verify state
      const oauthState = await this.verifyOAuthState(state, provider);
      
      // Exchange code for access token
      const tokens = await this.exchangeCodeForTokens(provider, code);
      
      // Get user profile from provider
      const profile = await this.getUserProfile(provider, tokens.access_token);
      
      // Store or update OAuth credentials
      const oauthCredential = await this.storeOAuthCredentials(
        oauthState.userId,
        provider,
        tokens,
        profile
      );

      // Add OAuth verification fee to water limit
      const verificationFee = 0.001; // 0.1% verification fee
      await this.waterLimitService.addToWaterLimit(
        oauthState.userId,
        verificationFee,
        'oauth_verification',
        oauthCredential.id
      );

      return {
        success: true,
        userId: oauthState.userId,
        provider,
        oauthCredentialId: oauthCredential.id,
        profile
      };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  // Exchange authorization code for access token
  async exchangeCodeForTokens(provider, code) {
    const config = this.oauthProviders[provider];
    
    const response = await fetch(config.tokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientID}:${config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.callbackURL
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get user profile from OAuth provider
  async getUserProfile(provider, accessToken) {
    const profileUrls = {
      coinbase: 'https://api.coinbase.com/v2/user',
      binance: 'https://api.binance.com/api/v3/account'
    };

    const response = await fetch(profileUrls[provider], {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    return await response.json();
  }

  // Store OAuth credentials
  async storeOAuthCredentials(userId, provider, tokens, profile) {
    // Check if credentials already exist
    let oauthCredential = await this.DI.oauthCredentialRepository.findOne({
      userId,
      provider
    });

    if (oauthCredential) {
      // Update existing credentials
      wrap(oauthCredential).assign({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        profile: profile,
        updatedAt: new Date()
      });
    } else {
      // Create new credentials
      oauthCredential = new this.DI.oauthCredentialRepository.entity(
        userId,
        provider,
        tokens.access_token,
        tokens.refresh_token,
        profile,
        'active'
      );

      await this.DI.oauthCredentialRepository.persistAndFlush(oauthCredential);
    }

    await this.DI.oauthCredentialRepository.flush();
    return oauthCredential;
  }

  // Get user's OAuth credentials
  async getUserOAuthCredentials(userId) {
    const credentials = await this.DI.oauthCredentialRepository.find({ userId });
    
    return credentials.map(cred => ({
      id: cred.id,
      provider: cred.provider,
      status: cred.status,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt
    }));
  }

  // Revoke OAuth credentials
  async revokeOAuthCredentials(credentialId) {
    const credential = await this.DI.oauthCredentialRepository.findOneOrFail({ id: credentialId });
    
    wrap(credential).assign({
      status: 'revoked',
      revokedAt: new Date()
    });

    await this.DI.oauthCredentialRepository.flush();

    return { success: true, credentialId };
  }

  // Refresh OAuth access token
  async refreshAccessToken(credentialId) {
    const credential = await this.DI.oauthCredentialRepository.findOneOrFail({ id: credentialId });
    
    if (credential.status !== 'active') {
      throw new Error('OAuth credential is not active');
    }

    const config = this.oauthProviders[credential.provider];
    
    const response = await fetch(config.tokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientID}:${config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credential.refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh access token: ${response.statusText}`);
    }

    const tokens = await response.json();

    // Update credentials with new tokens
    wrap(credential).assign({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || credential.refreshToken,
      updatedAt: new Date()
    });

    await this.DI.oauthCredentialRepository.flush();

    return { success: true, credentialId };
  }

  // Get OAuth analytics
  async getOAuthAnalytics(startDate, endDate) {
    const credentials = await this.DI.oauthCredentialRepository.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const analytics = {
      totalCredentials: credentials.length,
      byProvider: {},
      byStatus: {},
      verificationFees: 0
    };

    credentials.forEach(cred => {
      // By provider
      if (!analytics.byProvider[cred.provider]) {
        analytics.byProvider[cred.provider] = 0;
      }
      analytics.byProvider[cred.provider]++;

      // By status
      if (!analytics.byStatus[cred.status]) {
        analytics.byStatus[cred.status] = 0;
      }
      analytics.byStatus[cred.status]++;
    });

    // Get verification fees from water limit
    const waterLimitAnalytics = await this.waterLimitService.getWaterLimitAnalytics();
    analytics.verificationFees = waterLimitAnalytics.byType.oauth_verification?.total || 0;

    return analytics;
  }
}

module.exports = { OAuth2Service }; 