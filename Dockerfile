FROM node:24-alpine AS build
WORKDIR /repo

# Use pnpm via corepack (Node >=16). Pinning pnpm version is handled by packageManager in package.json.
RUN corepack enable

# Workspace manifests (required: build context must be repo root)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY build.config.ts ./
COPY packages/core ./packages/core
COPY packages/server ./packages/server

RUN pnpm install --frozen-lockfile

RUN pnpm -C packages/server build

RUN mkdir -p /out && cp -R /repo/packages/server/dist /out/dist && cp /repo/packages/server/package.json /out/package.json

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

# Ensure Node treats dist/*.js as ESM.
COPY --from=build /out/package.json ./package.json
COPY --from=build /out/dist ./dist

EXPOSE 8080
CMD ["node", "./dist/bin.js", "--host", "0.0.0.0", "--port", "8080"]
