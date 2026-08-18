FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY public ./public/
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

# NEXT_PUBLIC_* vars are inlined at build time — pass via --build-arg.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
