FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
