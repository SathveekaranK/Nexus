/// <reference types="vite/client" />
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api', // Explicitly use URL or Env
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for data extraction
api.interceptors.response.use(
    (response) => {
        // Automatically unwrap successful wrapped responses
        if (response.data && response.data.success && response.data.data !== undefined) {
            return response.data.data;
        }
        return response.data;
    },
    (error) => {
        const message = error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject({ message, status: error.response?.status });
    }
);

export default api;
