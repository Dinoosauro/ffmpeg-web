# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install webpack-cli
RUN npm install express
RUN node webHost.js local
CMD ["node", "localServer.js"]
EXPOSE 3000
