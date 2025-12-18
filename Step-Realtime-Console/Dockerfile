FROM oven/bun:1 as base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=base /app/build ./build
COPY --from=base /app/package.json ./
# Install production dependencies
COPY --from=base /app/node_modules ./node_modules

# Expose ports
EXPOSE 8081
EXPOSE 8082

# Environment variables defaults
ENV PORT=8082
ENV WS_PORT=8081

# Start the application
CMD ["bun", "build/index.js"]
