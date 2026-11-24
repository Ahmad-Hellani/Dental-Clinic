# ---------- build stage: full install + TypeScript compile ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* ./
# Once yarn.lock is committed you can add --frozen-lockfile for reproducible builds
RUN yarn install --network-timeout 100000
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# ---------- runtime stage: production deps + compiled JS only ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --production --network-timeout 100000 && yarn cache clean
COPY --from=build /app/dist ./dist
COPY migrations ./migrations
USER node
EXPOSE 4001
CMD ["node", "dist/server.js"]
