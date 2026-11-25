# ---------- build stage: full install + TypeScript compile ----------
FROM node:20-alpine AS build
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 YARN_ENABLE_TELEMETRY=0
# the project uses Yarn 4 (Berry); the base image only ships Yarn 1
RUN corepack enable && corepack prepare yarn@4.18.0 --activate
COPY package.json yarn.lock* .yarnrc.yml ./
RUN yarn install
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# ---------- runtime stage: production deps + compiled JS only ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    YARN_ENABLE_TELEMETRY=0 \
    YARN_ENABLE_GLOBAL_CACHE=false \
    YARN_CACHE_FOLDER=/tmp/yarn-cache
WORKDIR /app
RUN corepack enable && corepack prepare yarn@4.18.0 --activate
COPY package.json yarn.lock* .yarnrc.yml ./
RUN yarn workspaces focus --production && rm -rf /tmp/yarn-cache
COPY --from=build /app/dist ./dist
COPY migrations ./migrations
USER node
EXPOSE 4002
CMD ["node", "dist/server.js"]
