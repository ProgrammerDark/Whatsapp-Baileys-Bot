FROM node:22-ubuntu

WORKDIR /app

COPY package*.json ./

RUN yarn ci --only=production

COPY . .

CMD ["yarn", "start"]