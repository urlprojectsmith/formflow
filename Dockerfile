# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL=http://localhost:4450
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://formflow-api:4450/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
