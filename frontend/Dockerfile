FROM node:22-alpine

WORKDIR /app
ARG BACKEND_INTERNAL_URL=http://backend:5000
ARG BACKEND_URL=http://backend:5000
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
ENV BACKEND_URL=$BACKEND_URL
ENV HUSKY=0
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g npm@11.16.0

COPY package*.json ./

RUN npm ci --audit=false --fund=false --loglevel=error

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
