FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json tsconfig.json ./
COPY src ./src

# Install all dependencies (including dev) to build
RUN npm install && npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

EXPOSE 3007

CMD ["node", "dist/main.js"]


