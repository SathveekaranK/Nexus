# Deployment Guide for Nexus

This project consists of a separate Backend (Node.js/Express) and Frontend (Vite/React). For a successful deployment on AWS Amplify, follow these steps.

## 1. Organizing for Git
You can push both folders to a single GitHub repository. Your structure should be:
```
/
  backend/
  frontend/
```

## 2. Deploying the Backend (AWS Amplify)
1. **Create a New App**: Select GitHub as your source.
2. **Select the Backend Branch**: Choose the repository and backend folder.
3. **Build Settings**: Configure Amplify to build the backend.
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `node backend/dist/index.js`
4. **Environment Variables**: Add the following in the Amplify console:
   - `MONGODB_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A strong secret key.
   - `FRONTEND_URL`: The URL of your deployed frontend (e.g., `https://main.d1234.amplifyapp.com`).
   - `PORT`: `3001` (or whatever you prefer).

## 3. Deploying the Frontend (AWS Amplify)
1. **Create a New App**: Select the same GitHub repository.
2. **Build Settings**:
   - **Base Directory**: `frontend/dist`
   - **Build Command**: `cd frontend && npm install && npm run build`
3. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://backend.d5678.amplifyapp.com/api`).
   - Note: Vite requires variables to be prefixed with `VITE_`.

## 4. Socket.io and Websockets
AWS Amplify Hosting for static sites might not support persistent WebSocket connections directly if you use it for the backend. It is recommended to deploy the **Backend** using **AWS App Runner** or **AWS Elastic Beanstalk** if you need stable WebSockets, as Amplify Hosting is optimized for SSR/Static sites.

However, if you use Amplify for the Backend, ensure you are using a Compute-based deployment (like Amplify Gen 2 or App Runner integration).

---
## Connection Summary
- **Frontend** calls **Backend** at `VITE_API_URL`.
- **Backend** allows **Frontend** via `FRONTEND_URL` in CORS.
