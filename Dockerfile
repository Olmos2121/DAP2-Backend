# --- Etapa 1 de Dockerfile: "Builder" ---
# En esta etapa instalamos TODO, incluyendo las devDependencies
FROM node:20-slim AS builder

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package.json package-lock.json ./

# Instalamos TODAS las dependencias (de desarrollo y producción)
RUN npm install

# Copiamos el resto del código
COPY . .

# Ejecutamos el script que necesita las devDependencies
RUN node swagger.cjs

# --- Etapa 2 de Dockerfile: "Production" ---
# Empezamos desde una imagen limpia para la versión final
FROM node:20-slim AS production

WORKDIR /app

# Copiamos las dependencias de producción desde la etapa 'builder'
COPY --from=builder /app/node_modules ./node_modules

# Copiamos el package.json
COPY --from=builder /app/package.json ./

# Copiamos el código fuente de la aplicación
COPY --from=builder /app .

# Exponemos el puerto de la aplicación
EXPOSE 8080

# El comando para iniciar la aplicación
CMD ["npm", "start"]
