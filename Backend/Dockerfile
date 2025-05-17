FROM node:23-alpine AS base

WORKDIR /app

COPY . .

RUN npm install

USER node
EXPOSE 3222

CMD [ "node", "src/server.js" ]
