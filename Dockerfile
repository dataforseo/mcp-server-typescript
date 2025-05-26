# 1. Use Node 20 (per your engines requirement)
FROM node:20-alpine AS base
WORKDIR /app

# 2. Install only production deps for building
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Build the TS
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 4. Final image: copy build artifiacts and deps
FROM node:20-alpine AS release
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production
COPY --from=base /app/build ./build

EXPOSE 3000
# default to the HTTP entrypoint; change to "sse" or "cli" as needed
CMD ["node", "build/index.js"]
