FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY public ./public/
COPY next.config.js .
COPY tailwind.config.js .
COPY postcss.config.js .
COPY tsconfig.json .

RUN npm ci

COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]
