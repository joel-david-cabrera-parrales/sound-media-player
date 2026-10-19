FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 4205

CMD ["npm", "run", "electron-dev"]