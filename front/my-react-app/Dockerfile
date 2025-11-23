# Этап 1: Сборка Node.js
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Этап 2: Nginx для раздачи статики
FROM nginx:alpine
# Копируем собранные файлы из этапа build в папку Nginx
COPY --from=build /app/build /usr/share/nginx/html

# (Опционально) Копируем кастомный конфиг nginx, если нужен React Router
# COPY nginx.conf /etc/nginx/conf.d/default.conf12312341241

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]