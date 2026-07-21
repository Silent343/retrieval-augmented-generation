/** Runtime configuration (production on Render). */
export const environment = {
  production: true,
  // This matches the API service name in ../render.yaml.
  apiBaseUrl: 'https://document-rag-api.onrender.com',
} as const;
