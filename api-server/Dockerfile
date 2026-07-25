FROM node:24-alpine AS dependencies
WORKDIR /app
ENV DATABASE_URL=mysql://build:build@127.0.0.1:3306/build
COPY api-server/package.json api-server/package-lock.json ./
COPY api-server/prisma ./prisma
COPY api-server/prisma.config.ts api-server/tsconfig.json ./
RUN npm ci
COPY api-server/ .
COPY data /data
COPY pages/official/data /pages/official/data
RUN npm run prisma:generate

FROM dependencies AS migration

FROM dependencies AS build
RUN npm run build

FROM build AS production-dependencies
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN mkdir -p /app/storage/tmp/media /app/storage/media
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
