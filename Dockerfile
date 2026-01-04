# Stage 1: Build the React client
FROM node:18-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Node.js server
FROM node:18-alpine AS server-build

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./

# Stage 3: Final image with client and server
FROM node:18-alpine

WORKDIR /app

# Copy server files from the server-build stage
COPY --from=server-build /app/server ./

# Copy client build from the client-build stage
COPY --from=client-build /app/client/build ./public

EXPOSE 3001

CMD ["node", "src/server.js"]
