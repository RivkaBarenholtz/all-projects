// src/services/apiService.ts

import { STORAGE_KEYS } from '../config/cognito';
import { cognitoService } from './cognitoService';

// Proxy function for dev mode
function fetchProxy(input: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const url = input.toString();
  
  // Only proxy localhost/127.0.0.1 calls
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    return fetch(url, options);
  }
  
  return new Promise((resolve, reject) => {

   

    chrome.runtime.sendMessage({
      action: 'proxyFetch',
      url: url,
      options: {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body
      }
    }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response.success) {
        resolve({
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          statusText: response.statusText,
          json: async () => JSON.parse(response.data),
          text: async () => response.data,
          headers: new Headers(response.headers)
        } as Response);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

export class ApiService {

  private onUnauthorized?: () => void;
  private isDev: boolean;

  constructor(onUnauthorized?: () => void, isDev: boolean = false) {
    this.onUnauthorized = onUnauthorized;
    this.isDev = isDev;
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
      this.onUnauthorized && this.onUnauthorized();
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const fetchFn = this.isDev ? fetchProxy : window.fetch.bind(window);
    const response = await fetchFn(url, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async post<T>(url: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const fetchFn = this.isDev ? fetchProxy : window.fetch.bind(window);
    const response = await fetchFn(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  
  async put<T>(url: string, data: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const fetchFn = this.isDev ? fetchProxy : window.fetch.bind(window);
    const response = await fetchFn(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async delete<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const fetchFn = this.isDev ? fetchProxy : window.fetch.bind(window);
    const response = await fetchFn(url, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(response);
  }
}
