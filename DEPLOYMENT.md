# Deployment Guide for Nexus

This project consists of a separate Backend (Node.js/Express) and Frontend (Vite/React). For a successful deployment on AWS Amplify, follow these steps.

## 1. Organizing for Git
You can push both folders to a single GitHub repository. Your structure should be:
```
/
  backend/
  frontend/
```

## 2. Deploying the Backend (Free Option: Render.com)
If you want a **free** way to deploy your persistent Express/Socket.io backend, [Render](https://render.com) is the easiest alternative.

1.  **Create a Render Account**: Connect it to your GitHub.
2.  **New Web Service**:
    *   Select your repository.
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node` (or `Docker` if you prefer).
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
3.  **Plan**: Select **Free**.
4.  **Environment Variables**: Add everything from your `backend/.env`.
    *   `PORT`: `10000` (Render's default) or leave it; Render handles it.
    *   `MONGODB_URI`: Your MongoDB Atlas string.
    *   `JWT_SECRET`: Your production secret.
    *   `FRONTEND_URL`: Your deployed Amplify URL.
5.  **CORS**: Ensure your backend `allowedOrigins` includes your Render URL once it's assigned.

*Note: Free instances on Render "spin down" after 15 minutes of inactivity. The first request after a break will take ~30 seconds to wake up.*

---

## 3. Alternative: AWS Free Tier (EC2)
If you are still in your **AWS Free Tier (First 12 months)**:
1.  Launch a **t2.micro** (or **t3.micro**) EC2 instance with Ubuntu.
2.  Install Node.js and Docker.
3.  Run your backend using Docker: `docker-compose up -d`.
4.  This is 100% free for the first year and stays "always on" (unlike Render).

---

## 4. Deploying the Frontend (AWS Amplify)
1. **Create a New App**: Select the same GitHub repository.
2. **Build Settings**: Configure Amplify with the following YAML:
   ```yaml
   version: 1
   frontend:
       phases:
           build:
               commands:
                   - 'cd frontend && npm install && npm run build'
       artifacts:
           baseDirectory: frontend/dist
           files:
               - '**/*'
       cache:
           paths:
               - frontend/node_modules/**/*
   ```
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
