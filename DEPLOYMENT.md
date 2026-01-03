# Deployment Guide for Nexus on AWS

This project is configured for a microservices deployment architecture.

## Architecture

- **Frontend**: React (Vite) served via Nginx Container.
- **Backend**: Node.js (Express) Container.
- **Database**: MongoDB (AWS DocumentDB or MongoDB Atlas).

## Prerequisites

- AWS Account
- Docker installed locally (for testing build)
- AWS CLI configured (if deploying via CLI)

## Deployment Steps

### 1. Database (MongoDB)
Set up a MongoDB instance.
- **Option A (Recommended)**: Use MongoDB Atlas and get the connection string.
- **Option B**: Use AWS DocumentDB.

**Note Connection String**: `mongodb+srv://<username>:<password>@...`

### 2. Backend Deployment (AWS App Runner or ECS)
1.  Build the backend image:
    ```bash
    cd backend
    docker build -t nexus-backend .
    ```
2.  Push to AWS ECR (Elastic Container Registry).
3.  Deploy on **AWS App Runner** or **ECS**.
4.  **Environment Variables** to set in AWS:
    -   `PORT`: `3001`
    -   `MONGODB_URI`: Your MongoDB connection string.
    -   `JWT_SECRET`: A strong secret key.

**Note the Backend URL** (e.g., `https://api.nexus-app.awsapprunner.com`).

### 3. Frontend Deployment
1.  Update `VITE_API_URL` for production build.
    You can pass this as a build argument or create a production `.env` file.
    
    *Dockerfile modification if needed for dynamic build args:*
    ```dockerfile
    ARG VITE_API_URL
    ENV VITE_API_URL=$VITE_API_URL
    RUN npm run build
    ```

2.  Build the frontend image:
    ```bash
    cd frontend
    docker build --build-arg VITE_API_URL=https://your-backend-url.com/api -t nexus-frontend .
    ```
3.  Push to ECR.
4.  Deploy on **AWS App Runner** or **ECS**, or static hosting (S3 + CloudFront) by just copying the `dist` folder.

## Local Testing via Docker Compose
Run the entire stack locally:
```bash
docker-compose up --build
```
Access Frontend: `http://localhost`
Access Backend: `http://localhost:3001`
