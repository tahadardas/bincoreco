FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN npm install
COPY . .
RUN npm run build -w packages/types && \
    npm run build -w packages/validators && \
    npm run build -w packages/config && \
    npm run build -w apps/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
EXPOSE 4000
CMD ["node", "dist/main"]
