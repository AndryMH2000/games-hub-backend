FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Cambiar a usuario root temporalmente
USER root

# Set working directory
WORKDIR /app

# Dar permisos al directorio
RUN chown -R pptruser:pptruser /app

# Volver al usuario pptruser
USER pptruser

# Copy package files
COPY --chown=pptruser:pptruser package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY --chown=pptruser:pptruser . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
