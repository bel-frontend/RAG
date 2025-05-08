# Dockerfile

FROM oven/bun:1

WORKDIR /app

COPY package.json  ./
RUN bun install 

COPY . .

ENV NODE_ENV=production

EXPOSE 3000 11434

CMD ["bun", "index.ts"]