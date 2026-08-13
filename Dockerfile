FROM node:18-alpine

WORKDIR /app

# Install production dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source (see .dockerignore)
COPY . .

# Runtime port — override with -e PORT=... or compose environment
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
