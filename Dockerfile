# Usa una imagen base oficial de Node.js.
# https://hub.docker.com/_/node
FROM node:20-slim AS base

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package.json package-lock.json ./

# Instala solo las dependencias de producción
RUN npm install --production

# Copia el resto de los archivos de la aplicación
COPY . .

# Genera el archivo swagger.cjs necesario para el arranque
RUN node swagger.cjs

# Expone el puerto en el que la aplicación se ejecuta
# AWS App Runner espera el puerto 8080 por defecto
EXPOSE 8080

# El comando para iniciar la aplicación en producción
CMD ["npm", "start"]
