# --- STAGE 1: build frontend & bundle server ---
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # Install dependencies
    COPY package.json yarn.lock ./
    RUN yarn install --frozen-lockfile
    
    # Copy the rest of the source
    COPY . .
    
    # Build client (Vite) and bundle server (esbuild)
    RUN yarn build
    
    # --- STAGE 2: runtime ---
    FROM node:20-alpine AS runtime
    WORKDIR /app
    
    # Set NODE_ENV for production
    ENV NODE_ENV=production
    ENV PORT=3000
    
    # Copy over only the compiled output and production deps
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/package.json ./package.json
    COPY --from=builder /app/yarn.lock ./yarn.lock
    
    # Install only prod deps (if your server bundle still needs node_modules)
    RUN yarn install --production --frozen-lockfile
    
    EXPOSE 3000
    
    # Start the compiled server
    CMD ["node", "dist/index.js"]