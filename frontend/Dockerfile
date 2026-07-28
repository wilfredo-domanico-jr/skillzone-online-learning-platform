# --- build ---
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines these into the built JS at build time, not runtime, so they
# have to arrive as build args rather than compose `environment:` vars.
ARG VITE_API_URL=http://localhost:8000
ARG VITE_DEMO_MODE=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- serve ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
