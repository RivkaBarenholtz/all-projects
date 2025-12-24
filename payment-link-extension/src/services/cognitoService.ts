// src/services/cognitoService.ts

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { cognitoConfig, STORAGE_KEYS } from '../config/cognito';

class CognitoService {
  private userPool: CognitoUserPool;

  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: cognitoConfig.UserPoolId,
      ClientId: cognitoConfig.ClientId,
    });
  }

  /**
   * Sign in user
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ success: boolean; session?: CognitoUserSession; error?: string }> {
    return new Promise((resolve) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async (session) => {
          await this.storeTokens(session);
          resolve({ success: true, session });
        },
        onFailure: (err) => {
          resolve({ success: false, error: err.message });
        },
      });
    });
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const currentUser = this.userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    await this.clearTokens();
  }

  /**
   * Get current session (automatically refreshes if needed)
   */
  async getCurrentSession(): Promise<CognitoUserSession | null> {
    const currentUser = this.userPool.getCurrentUser();
    
    if (!currentUser) {
      return null;
    }

    return new Promise((resolve) => {
      currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }
        
        // Session is valid or was automatically refreshed
        if (session.isValid()) {
          this.storeTokens(session); // Update stored tokens
          resolve(session);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Manually refresh tokens
   */
  async refreshSession(): Promise<{ success: boolean; session?: CognitoUserSession; error?: string }> {
    return new Promise(async (resolve) => {
      const currentUser = this.userPool.getCurrentUser();
      
      if (!currentUser) {
        resolve({ success: false, error: 'No current user' });
        return;
      }

      currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve({ success: false, error: err?.message || 'Session error' });
          return;
        }

        const refreshToken = session.getRefreshToken();
        
        currentUser.refreshSession(refreshToken, async (refreshErr, newSession) => {
          if (refreshErr) {
            resolve({ success: false, error: refreshErr.message });
            return;
          }
          
          await this.storeTokens(newSession);
          resolve({ success: true, session: newSession });
        });
      });
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null && session.isValid();
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.getAccessToken().getJwtToken() || null;
  }

  /**
   * Get ID token
   */
  async getIdToken(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.getIdToken().getJwtToken() || null;
  }

  /**
   * Store tokens securely in Chrome extension storage
   */
  private async storeTokens(session: CognitoUserSession): Promise<void> {
    const tokens = {
      [STORAGE_KEYS.ID_TOKEN]: session.getIdToken().getJwtToken(),
      [STORAGE_KEYS.ACCESS_TOKEN]: session.getAccessToken().getJwtToken(),
      [STORAGE_KEYS.REFRESH_TOKEN]: session.getRefreshToken().getToken(),
      [STORAGE_KEYS.USER_INFO]: JSON.stringify(session.getIdToken().payload),
     
    };

    await chrome.storage.local.set(tokens);
  }

  /**
   * Clear all tokens from storage
   */
  private async clearTokens(): Promise<void> {
    await chrome.storage.local.remove([
      STORAGE_KEYS.ID_TOKEN,
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_INFO,
    ]);
  }
}

// Export singleton instance
export const cognitoService = new CognitoService();