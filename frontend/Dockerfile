# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Define build arguments
ARG VITE_API_URL
ARG VITE_AGORA_APP_ID

# Set as environment variables for the build process
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AGORA_APP_ID=$VITE_AGORA_APP_ID

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
