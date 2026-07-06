FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE ${PORT:-3001}
CMD ["node", "dist/server/src/index.js"]
