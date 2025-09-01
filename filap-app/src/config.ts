// API Configuration
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Log for debugging
console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_BASE_URL env var:', process.env.VITE_API_BASE_URL);