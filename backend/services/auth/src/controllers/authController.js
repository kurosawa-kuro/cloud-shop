const AuthService = require('../services/authService');
const { AUTH_CONSTANTS } = require('../../../../shared/utils/constants');
const { createStandardError } = require('../../../../shared/middleware/errorHandler');
const logger = require('../../../../shared/utils/logger');

const authService = new AuthService();

module.exports = {
  login: async (c, req, res) => {
    try {
      const { email, password } = c.request.requestBody;
      
      // Keycloakを使用したログイン処理
      const result = await authService.login(email, password);
      
      return res.standardResponse(result, 200, 'Login successful');
    } catch (error) {
      logger.error('Login failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(401, 'UNAUTHORIZED', 'Invalid credentials', req.url);
      return res.status(401).json(errorResponse);
    }
  },

  register: async (c, req, res) => {
    try {
      const { email, password, name } = c.request.requestBody;
      
      // Keycloakを使用したユーザー登録処理
      const result = await authService.register(email, password, name);
      
      return res.standardResponse(result, 201, 'Registration successful');
    } catch (error) {
      logger.error('Registration failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(400, 'BAD_REQUEST', 'Registration failed', req.url);
      return res.status(400).json(errorResponse);
    }
  },

  confirm: async (c, req, res) => {
    try {
      const { email, code } = c.request.requestBody;
      
      // メール確認コードの検証処理
      const result = await authService.confirm(email, code);
      
      return res.standardResponse(result, 200, 'Confirmation successful');
    } catch (error) {
      logger.error('Confirmation failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(400, 'BAD_REQUEST', 'Invalid confirmation code', req.url);
      return res.status(400).json(errorResponse);
    }
  },

  logout: async (c, req, res) => {
    try {
      // ログアウト処理（トークンの無効化）
      await authService.logout(req);
      
      return res.standardResponse({ message: 'Logout successful' }, 200, 'Logout successful');
    } catch (error) {
      logger.error('Logout failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(401, 'UNAUTHORIZED', 'Logout failed', req.url);
      return res.status(401).json(errorResponse);
    }
  },

  verifyToken: async (c, req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      
      return res.standardResponse({
        valid: true,
        user: user
      }, 200, 'Token verification successful');
    } catch (error) {
      logger.error('Token verification failed:', { error: error.message, correlationId: req.correlationId });
      return res.status(401).json({
        valid: false,
        error: 'Invalid token'
      });
    }
  },

  refreshToken: async (c, req, res) => {
    try {
      const { refreshToken } = c.request.requestBody;
      const tokens = await authService.refreshToken(refreshToken);
      
      return res.standardResponse(tokens, 200, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(401, 'UNAUTHORIZED', 'Token refresh failed', req.url);
      return res.status(401).json(errorResponse);
    }
  },

  revokeToken: async (c, req, res) => {
    try {
      const { token } = c.request.requestBody;
      await authService.revokeToken(token);
      
      return res.standardResponse(null, 200, 'Token revoked successfully');
    } catch (error) {
      logger.error('Token revocation failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(500, 'INTERNAL_SERVER_ERROR', 'Token revocation failed', req.url);
      return res.status(500).json(errorResponse);
    }
  },

  getUserRoles: async (c, req, res) => {
    try {
      const { userId } = c.request.params;
      const roles = await authService.getUserRoles(userId);
      
      return res.standardResponse({ roles }, 200, 'User roles retrieved successfully');
    } catch (error) {
      logger.error('Get user roles failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(500, 'INTERNAL_SERVER_ERROR', 'Failed to get user roles', req.url);
      return res.status(500).json(errorResponse);
    }
  },

  assignRole: async (c, req, res) => {
    try {
      const { userId, roleId } = c.request.requestBody;
      await authService.assignRole(userId, roleId);
      
      return res.standardResponse(null, 200, 'Role assigned successfully');
    } catch (error) {
      logger.error('Role assignment failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(500, 'INTERNAL_SERVER_ERROR', 'Role assignment failed', req.url);
      return res.status(500).json(errorResponse);
    }
  },

  removeRole: async (c, req, res) => {
    try {
      const { userId, roleId } = c.request.requestBody;
      await authService.removeRole(userId, roleId);
      
      return res.standardResponse(null, 200, 'Role removed successfully');
    } catch (error) {
      logger.error('Role removal failed:', { error: error.message, correlationId: req.correlationId });
      const errorResponse = createStandardError(500, 'INTERNAL_SERVER_ERROR', 'Role removal failed', req.url);
      return res.status(500).json(errorResponse);
    }
  }
};
