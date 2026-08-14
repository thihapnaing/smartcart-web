# Stage 1: Build the Angular app
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve the built app with Nginx
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist/temp-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]