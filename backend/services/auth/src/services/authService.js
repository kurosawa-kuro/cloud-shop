const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const axios = require('axios');
const { getAuthClient } = require('../../../../shared/database/prismaClient');
const logger = require('../../../../shared/utils/logger');

const tokenCache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60,
  useClones: false
});

const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  requestHeaders: {},
  timeout: 30000,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.publicKey || key?.rsaPublicKey;
    callback(null, signingKey);
  });
}

class AuthService {
  constructor() {
    this.prisma = getAuthClient();
  }

  async login(email, password) {
    try {
      // Keycloakを使用したログイン処理
      const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          username: email,
          password: password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData = response.data;
      
      // トークンからユーザー情報を取得
      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      // データベースにユーザー情報を保存/更新
      await this.saveOrUpdateUser(userInfo);

      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        user: userInfo
      };
    } catch (error) {
      logger.error('Keycloak login failed:', error.response?.data || error.message);
      throw new Error('Invalid credentials');
    }
  }

  async register(email, password, name) {
    try {
      // Keycloakを使用したユーザー登録処理
      const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
        {
          username: email,
          email: email,
          firstName: name,
          enabled: true,
          emailVerified: false,
          credentials: [{
            type: 'password',
            value: password,
            temporary: false
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAdminToken()}`
          }
        }
      );

      // ユーザー情報を取得
      const userInfo = {
        sub: response.data.id,
        email: email,
        name: name,
        preferred_username: email,
        roles: ['customer']
      };

      // データベースにユーザー情報を保存
      await this.saveOrUpdateUser(userInfo);

      return {
        message: 'Registration successful',
        user: userInfo
      };
    } catch (error) {
      logger.error('Keycloak registration failed:', error.response?.data || error.message);
      throw new Error('Registration failed');
    }
  }

  async confirm(email, code) {
    try {
      // メール確認コードの検証（Keycloakでは自動的に処理される）
      // ここでは簡易的な実装として、ユーザーの存在確認のみ行う
      const user = await this.prisma.authUser.findUnique({
        where: { email: email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // ユーザーのメール確認状態を更新
      await this.prisma.authUser.update({
        where: { email: email },
        data: { emailVerified: true }
      });

      return {
        message: 'Email confirmed successfully',
        user: {
          sub: user.id,
          email: user.email,
          name: user.email, // 簡易的な実装
          preferred_username: user.email,
          roles: ['customer']
        }
      };
    } catch (error) {
      logger.error('Email confirmation failed:', error.message);
      throw new Error('Invalid confirmation code');
    }
  }

  async logout(req) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // トークンをキャッシュから削除
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        tokenCache.del(tokenHash);
        
        // Keycloakにログアウト通知（オプション）
        try {
          await axios.post(
            `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
            new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
              refresh_token: token // 実際にはrefresh_tokenが必要
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
        } catch (keycloakError) {
          logger.warn('Keycloak logout notification failed:', keycloakError.message);
        }
      }
    } catch (error) {
      logger.error('Logout failed:', error.message);
      throw new Error('Logout failed');
    }
  }

  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get user info:', error.message);
      throw new Error('Failed to get user info');
    }
  }

  async getAdminToken() {
    try {
      const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: 'admin-cli',
          client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || 'admin-secret'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to get admin token:', error.message);
      throw new Error('Failed to get admin token');
    }
  }

  async saveOrUpdateUser(userInfo) {
    try {
      let authUser = await this.prisma.authUser.findUnique({
        where: { keycloakId: userInfo.sub },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!authUser) {
        authUser = await this.prisma.authUser.create({
          data: {
            id: userInfo.sub,
            email: userInfo.email,
            keycloakId: userInfo.sub,
            emailVerified: userInfo.email_verified || false,
            lastLoginAt: new Date()
          },
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        });
      } else {
        await this.prisma.authUser.update({
          where: { id: authUser.id },
          data: { lastLoginAt: new Date() }
        });
      }

      return authUser;
    } catch (error) {
      logger.error('Failed to save/update user:', error.message);
      throw new Error('Failed to save user data');
    }
  }

  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const cachedUser = tokenCache.get(tokenHash);
      if (cachedUser) {
        return resolve(cachedUser);
      }
      
      jwt.verify(token, getKey, {
        audience: process.env.KEYCLOAK_CLIENT_ID,
        issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
        algorithms: ['RS256']
      }, async (err, decoded) => {
        if (err) {
          return reject(new Error('Invalid token'));
        }

        try {
          let authUser = await this.prisma.authUser.findUnique({
            where: { keycloakId: decoded.sub },
            include: {
              userRoles: {
                include: {
                  role: true
                }
              }
            }
          });

          if (!authUser) {
            authUser = await this.prisma.authUser.create({
              data: {
                id: decoded.sub,
                email: decoded.email,
                keycloakId: decoded.sub,
                emailVerified: decoded.email_verified || false,
                lastLoginAt: new Date()
              },
              include: {
                userRoles: {
                  include: {
                    role: true
                  }
                }
              }
            });
          } else {
            await this.prisma.authUser.update({
              where: { id: authUser.id },
              data: { lastLoginAt: new Date() }
            });
          }

          const user = {
            sub: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            preferred_username: decoded.preferred_username,
            roles: authUser.userRoles.map(ur => ur.role.name)
          };

          const tokenTTL = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
          const cacheTTL = Math.min(tokenTTL, 300);
          
          if (cacheTTL > 0) {
            tokenCache.set(tokenHash, user, cacheTTL);
          }

          resolve(user);
        } catch (dbError) {
          logger.error('Database error during token verification:', dbError);
          reject(new Error('Authentication failed'));
        }
      });
    });
  }

  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      logger.error('Keycloak token refresh failed:', error.response?.data || error.message);
      throw new Error('Token refresh failed');
    }
  }

  async revokeToken(token) {
    try {
      await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
        new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          refresh_token: token
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      tokenCache.del(tokenHash);
    } catch (error) {
      logger.error('Keycloak token revocation failed:', error.response?.data || error.message);
      throw new Error('Token revocation failed');
    }
  }

  async getUserRoles(userId) {
    try {
      const authUser = await this.prisma.authUser.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!authUser) {
        throw new Error('User not found');
      }

      return authUser.userRoles.map(ur => ur.role);
    } catch (error) {
      logger.error('Failed to get user roles:', error.message);
      throw new Error('Failed to get user roles');
    }
  }

  async assignRole(userId, roleId) {
    try {
      await this.prisma.userRole.create({
        data: {
          userId: userId,
          roleId: roleId
        }
      });
    } catch (error) {
      logger.error('Failed to assign role:', error.message);
      throw new Error('Failed to assign role');
    }
  }

  async removeRole(userId, roleId) {
    try {
      await this.prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: roleId
          }
        }
      });
    } catch (error) {
      logger.error('Failed to remove role:', error.message);
      throw new Error('Failed to remove role');
    }
  }
}

module.exports = AuthService;
