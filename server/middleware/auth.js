"use strict";

const jwt = require('jsonwebtoken');

class AuthMiddleware {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  /**
   * Extract and verify JWT token from request
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Verify JWT token and return decoded payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user from database using token
   */
  async getUserFromToken(req, em) {
    const token = this.extractToken(req);
    if (!token) {
      return null;
    }

    const decoded = this.verifyToken(token);
    if (!decoded) {
      return null;
    }

    try {
      const userRepository = em.getRepository('User');
      const user = await userRepository.findOne({ id: decoded.userId });
      return user;
    } catch (error) {
      console.error('Error fetching user from token:', error);
      return null;
    }
  }

  /**
   * Basic authentication middleware
   */
  requireAuth = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };

  /**
   * Admin access middleware (ADMIN, IT_ADMIN, HR_ADMIN)
   */
  requireAdmin = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      const adminRoles = ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };

  /**
   * Specific admin role middleware
   */
  requireRole = (requiredRole) => {
    return async (req, res, next) => {
      try {
        const user = await this.getUserFromToken(req, req.app.locals.orm.em);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        if (!user.isActive) {
          return res.status(403).json({
            success: false,
            error: 'Account is deactivated'
          });
        }

        if (user.role !== requiredRole) {
          return res.status(403).json({
            success: false,
            error: `${requiredRole} access required`
          });
        }

        req.user = user;
        next();
      } catch (error) {
        console.error('Role auth middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Authentication error'
        });
      }
    };
  };

  /**
   * Moderator access middleware
   */
  requireModerator = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      const moderatorRoles = ['ADMIN', 'IT_ADMIN', 'HR_ADMIN', 'MODERATOR'];
      if (!moderatorRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Moderator access required'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Moderator auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };

  /**
   * HR access middleware
   */
  requireHR = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      const hrRoles = ['ADMIN', 'HR_ADMIN', 'HR_EMPLOYEE'];
      if (!hrRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'HR access required'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('HR auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };

  /**
   * Chat access middleware based on ban levels
   */
  requireChatAccess = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Check ban levels
      if (user.banLevel === 'no_chat') {
        return res.status(403).json({
          success: false,
          error: 'Chat access is restricted due to account restrictions'
        });
      }

      if (user.banLevel === 'chat_limit') {
        // Add chat limit logic here if needed
        // For now, just allow with warning
        req.chatLimited = true;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Chat auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };

  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  optionalAuth = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      if (user && user.isActive) {
        req.user = user;
      }
      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      next();
    }
  };

  /**
   * Session validation middleware
   */
  validateSession = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Session expired or invalid'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Check if user has been banned
      if (user.banLevel === 'permanent') {
        return res.status(403).json({
          success: false,
          error: 'Account has been permanently banned'
        });
      }

      // Check if temporary ban has expired
      if (user.banLevel === 'temporary' && user.banExpiresAt) {
        if (new Date() > new Date(user.banExpiresAt)) {
          // Ban has expired, reset ban level
          user.banLevel = 'none';
          user.banReason = null;
          user.banExpiresAt = null;
          await req.app.locals.orm.em.persistAndFlush(user);
        } else {
          return res.status(403).json({
            success: false,
            error: `Account temporarily banned: ${user.banReason}`,
            banExpiresAt: user.banExpiresAt
          });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Session validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Session validation error'
      });
    }
  };

  /**
   * Unleash-specific admin middleware
   */
  requireUnleashAccess = async (req, res, next) => {
    try {
      const user = await this.getUserFromToken(req, req.app.locals.orm.em);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      const unleashRoles = ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'];
      if (!unleashRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Unleash feature flag access requires admin privileges'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Unleash auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };
}

module.exports = AuthMiddleware; 