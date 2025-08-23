FROM oven/bun:1

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json ./
RUN bun install

# Copy the rest of the app
COPY . .

# Set default environment variables
ENV NODE_ENV=production
ENV API_BASE_URL_DEV=https://your.api

EXPOSE 3002

CMD ["bun", "index.ts"]
