FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json tsconfig.json ./
COPY src ./src

# Install all dependencies (including dev) to build
RUN npm install && npm run build

# Remove dev dependencies after build, but keep typeorm for migrations
RUN npm prune --production && npm install typeorm --save --no-save

EXPOSE 3004

# Create entrypoint script to run migrations before starting
RUN echo '#!/bin/sh' > /usr/src/app/entrypoint.sh && \
    echo 'echo "Running migrations..."' >> /usr/src/app/entrypoint.sh && \
    echo 'node dist/run-migrations.js || echo "Migrations failed or already run"' >> /usr/src/app/entrypoint.sh && \
    echo 'echo "Starting payment service..."' >> /usr/src/app/entrypoint.sh && \
    echo 'exec node dist/main.js' >> /usr/src/app/entrypoint.sh && \
    chmod +x /usr/src/app/entrypoint.sh

CMD ["/usr/src/app/entrypoint.sh"]


