import axios from 'axios';

const api = axios.create({
  // Use your backend URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true, // IMPORTANT: This allows cookies to be sent/received
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to handle global error logging (optional but helpful)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || 'Something went wrong');
    return Promise.reject(error);
  }
);

export default api;