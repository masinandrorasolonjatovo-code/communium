<<<<<<< HEAD
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
=======
FROM node:20-alpine

WORKDIR /app
ENV HUSKY=0
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

RUN npm install -g npm@11.16.0

COPY package*.json ./

RUN npm ci --audit=false --fund=false --loglevel=error
>>>>>>> 12f16f5bfd58ead24e306b997f29204f1a9543d8

COPY . .

EXPOSE 5000

<<<<<<< HEAD
CMD ["node", "server.js"]
=======
CMD ["node", "server.js"]
>>>>>>> 12f16f5bfd58ead24e306b997f29204f1a9543d8
