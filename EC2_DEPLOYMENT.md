# One-Click EC2 Deployment Guide (Docker)

This guide explains how to deploy both the **Backend** and **Frontend** to a single AWS EC2 instance using the updated Docker configuration.

## 1. Prepare Docker Compose
The `docker-compose.yml` is now optimized for production:
- It uses `backend/.env` automatically.
- It bakes production URLs into the frontend during the build.

## 2. Launching on EC2
1.  **Launch Instance**: Select **Ubuntu 22.04** on a **t2.micro** (Free Tier).
2.  **Security Group**: Open the following ports:
    *   `22` (SSH)
    *   `80` (HTTP - Frontend)
    *   `3001` (Backend API)
3.  **SSH into EC2** and run these commands to install Docker:
    ```bash
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo usermod -aG docker $USER
    # Log out and log back in for group changes to take effect
    ```

## 3. One-Click Deploy
1.  **Clone the Repo**: `git clone <your-repo-url> && cd Nexus`
2.  **Configure Env**: 
    - Ensure `backend/.env` is present with your MongoDB Atlas URI.
    - Create a root `.env` file (or just export variables) for the build:
      ```bash
      # On EC2, get your Public IP
      PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)
      
      # Run the deployment
      VITE_API_URL=http://$PUBLIC_IP:3001/api VITE_AGORA_APP_ID=your_id docker-compose up -d --build
      ```

## 4. Updates
To update your app after pushing new code:
```bash
git pull
VITE_API_URL=http://<ip>:3001/api docker-compose up -d --build
```
