FROM node:lts-alpine AS builder

COPY src /src
COPY tsconfig.json /
COPY package.json /
COPY package-lock.json /

# Install build tool chain
RUN apk add --no-cache --virtual python make g++
RUN npm install && \
  npm run-script build && \
  npm ci --production && \
  npm cache clean --force

FROM node:lts-alpine AS app

WORKDIR /app

COPY --from=builder /node_modules node_modules
COPY --from=builder /dist dist
COPY package.json .
COPY package-lock.json .

ENV NODE_ENV production
USER node
CMD ["node","dist/index.js"]