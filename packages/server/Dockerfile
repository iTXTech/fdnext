FROM node:24-slim AS build
WORKDIR /repo

# Use pnpm via corepack (Node >=16). Pinning pnpm version is handled by packageManager in package.json.
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -C packages/server build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production

# Ensure Node treats dist/*.js as ESM.
COPY --from=build /repo/packages/server/package.json ./package.json

COPY --from=build /repo/packages/server/dist ./dist
COPY --from=build /repo/resources ./resources

EXPOSE 8080
CMD ["node", "./dist/bin.js", "--host", "0.0.0.0", "--port", "8080", "--resources", "./resources"]
