FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm install

# Copiar el código fuente
COPY . .

# Argumento para que Next.js incruste la URL del backend durante el build
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Compilar para producción
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

# Arrancar en modo producción
CMD ["npm", "start"]
