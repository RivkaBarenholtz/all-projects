// src/services/apiService.ts

import { STORAGE_KEYS } from '../config/cognito';
import { cognitoService } from './cognitoService';
  

export class ApiService {

     private onUnauthorized?: () => void;

    constructor(onUnauthorized?: () => void) {
    this.onUnauthorized = onUnauthorized;
  }






 private getAuthHeaders(): Promise<HeadersInit> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEYS.ID_TOKEN, STORAGE_KEYS.USER_INFO],
      (result) => {
      
      const token = result[STORAGE_KEYS.ID_TOKEN] || null;
      let email: string | null = null;

      if (result[STORAGE_KEYS.USER_INFO]) {
        try {
          const payload = JSON.parse(result[STORAGE_KEYS.USER_INFO]);
          email = payload.email || null;
        } catch (err) {
          console.error("Failed to parse userInfo:", err);
        }
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (email) {
        headers["user"] = email;
      }

      resolve(headers);
    });
  });
}

  private async handleResponse(response: Response) {
    // Check for 401 Unauthorized
    if (response.status === 401) {
      console.log('Received 401 - logging out');
      await cognitoService.signOut();
      this.onUnauthorized&& this.onUnauthorized();
     
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async post<T>(url: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async put<T>(url: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async delete<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const apiService = new ApiService();