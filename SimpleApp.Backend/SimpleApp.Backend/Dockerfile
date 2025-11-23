# 1. Используем образ с SDK для сборки (Build)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Копируем файл проекта и восстанавливаем зависимости
# Важно: COPY <имя_файла.csproj> ./
COPY SimpleApp.Backend.csproj ./
RUN dotnet restore

# Копируем всё остальное и собираем приложение
COPY . ./
RUN dotnet publish -c Release -o out

# 2. Используем легкий образ для запуска (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Указываем порт, который будет слушать контейнер (для .NET 8 это обычно 8080)
EXPOSE 8080

# Запускаем приложение
# ВАЖНО: Имя dll должно совпадать с именем вашего проекта
ENTRYPOINT ["dotnet", "SimpleApp.Backend.dll"]