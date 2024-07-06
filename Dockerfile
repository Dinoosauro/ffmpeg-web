# Use a Node.js base image to compile the website
FROM node:latest as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN node BuildDist.cjs --local
# Use nginx to serve the compiled website
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy over the custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
# If you want to host ffmpeg-web with SSL, uncomment the following three lines. Make sure to replace the path at the left (e.g. "certs/cert.crt") with the location of your certificate.
# COPY certs/cert.crt /etc/ssl/certs/cert.pem
# COPY certs/cert.key /etc/ssl/private/cert.key
# RUN update-ca-certificates
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]