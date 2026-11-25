# ---------- build stage: compile the React app ----------
FROM node:20-alpine AS build
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 YARN_ENABLE_TELEMETRY=0
RUN corepack enable && corepack prepare yarn@4.18.0 --activate
COPY package.json yarn.lock* .yarnrc.yml ./
RUN yarn install
COPY . .
RUN yarn build

# ---------- runtime stage: static files only (never a Vite dev server) ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80