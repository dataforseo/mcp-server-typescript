FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm ci if lock file exists, else fallback to npm install
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts; else npm install --ignore-scripts; fi

# Copy rest of the project
COPY tsconfig.json ./
COPY src/ ./src/

# Build the project
RUN npm run build

# Expose app port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Set entrypoint and default command
ENTRYPOINT ["node", "build/main/main/cli.js"]
CMD ["http"]
