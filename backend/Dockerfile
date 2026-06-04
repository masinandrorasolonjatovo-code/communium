FROM node:20-alpine

WORKDIR /app
ENV HUSKY=0
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

RUN npm install -g npm@11.16.0

COPY package*.json ./

RUN npm ci --audit=false --fund=false --loglevel=error

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
