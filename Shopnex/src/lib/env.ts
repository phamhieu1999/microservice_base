export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
  authServiceUrl: (import.meta.env.VITE_AUTH_SERVICE_URL as string | undefined) ?? 'http://localhost:3001',
};


