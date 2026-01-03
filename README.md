# Nexus - Collaborative Chat & AI Platform

A modern, full-stack collaborative platform built with React, Node.js, and MongoDB. Multi-user chat, AI assistance, and seamless collaboration.

## 🚀 Features

- **Real-time Chat**: Direct messages and group channels.
- **AI Integration**: Chat with Nexus AI directly in your workspace.
- **Channel System**: Create and manage channels, add members, and organize discussions.
- **Authentication**: Secure JWT-based login and registration.
- **Media Support**: Share images, videos, and files within chats.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Redux Toolkit, Tailwind CSS, Lucide Icons, Shadcn UI.
- **Backend**: Node.js, Express, MongoDB (Mongoose), TypeScript.
- **API Documentation**: Swagger/OpenAPI.

## 📦 Project Structure

```bash
 Nexus/
  ├── frontend/   # React Vite Application
  └── backend/    # Node.js Express API
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Running locally or on Atlas)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Nexus
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT Secret
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

## 🚢 Deployment

### Backend
- Deploy the `backend/` folder to a service like Render, Railway, or Heroku.
- Ensure `MONGODB_URI` and `JWT_SECRET` are set in the production environment variables.
- The server starts via `npm start` (builds with `npm run build` first).

### Frontend
- Deploy the `frontend/` folder to Vercel, Netlify, or similar.
- Set `VITE_API_URL` to your live backend API URL (e.g., `https://your-api.com/api`).

## 📄 License
MIT
