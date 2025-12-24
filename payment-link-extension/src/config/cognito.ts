// src/config/cognito.ts

export const cognitoConfig = {
  UserPoolId: 'us-east-1_guWlEt63Z',
  ClientId: '7nmt8a8ooc0oq1lcaj70n474ff',
  Region: 'us-east-1',
};

// Storage keys for Chrome extension storage
export const STORAGE_KEYS = {
  ID_TOKEN: 'cognito_id_token',
  ACCESS_TOKEN: 'cognito_access_token',
  REFRESH_TOKEN: 'cognito_refresh_token',
  USER_INFO: 'cognito_user_info',
} as const;