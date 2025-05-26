# ─── Stage 1: Build with devDeps ────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install ALL deps (including typescript)
COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci

# Bring in your source & compile it
COPY src ./src
RUN npm run build

# ─── Stage 2: Slim release image ──────────────────────────────────
FROM node:20-alpine AS release
WORKDIR /app

# Copy only prod deps, but skip lifecycle scripts (so no prepare/build)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Pull in your compiled output from the build stage
COPY --from=build /app/build ./build

EXPOSE 3000
CMD ["node", "build/index.js"]
