FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json tsconfig.json ./
COPY src ./src

RUN npm install --only=production && npm run build

EXPOSE 3010

CMD ["node", "dist/main.js"]


