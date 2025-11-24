pipeline {
    agent any

    environment {
        // ✅ Явные пути — без интерполяции
        FRONTEND_ROOT = 'front'
        FRONTEND_APP  = 'front/my-react-app'
        BACKEND_DIR   = 'SimpleApp.Backend'

        // Docker
        DOCKERHUB_CREDENTIALS = 'docker-hub-creds'
        DOCKERHUB_USER = 'yaponchick1337'
        FRONTEND_IMAGE = 'yaponchick1337/simpleapp-frontend'
        BACKEND_IMAGE  = 'yaponchick1337/simpleapp-backend'

        // 🚀 Деплой: Новый, надежный путь без кириллицы/пробелов
        DEPLOY_PATH = 'D:\\DevOps-Deploy\\SimpleApp'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Получаем список изменённых файлов
                    def changesRaw = bat(
                        script: 'git diff --name-only HEAD~1 HEAD 2>nul || echo ""',
                        returnStdout: true
                    ).trim()

                    echo "Изменённые файлы:\n${changesRaw ?: '<none>'}"

                    // Разбиваем на строки и фильтруем
                    def changedFiles = changesRaw ? changesRaw.split(/\r?\n/).collect { it.trim() }.findAll { it } : []

                    // 🔍 Проверяем: начинается ли путь с нужной директории?
                    env.CHANGED_FRONTEND = changedFiles.any { it.startsWith("${env.FRONTEND_APP}/") }.toString()
                    env.CHANGED_BACKEND  = changedFiles.any { it.startsWith("${env.BACKEND_DIR}/") }.toString()

                    echo "Frontend изменён: ${env.CHANGED_FRONTEND}"
                    echo "Backend изменён:  ${env.CHANGED_BACKEND}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (env.CHANGED_FRONTEND.toBoolean()) {
                        dir(env.FRONTEND_APP) {
                            echo '📦 Установка зависимостей фронтенда...'
                            try {
                                unstash 'frontend-modules'
                                echo '✅ Кэш node_modules восстановлен.'
                            } catch (e) {
                                echo '⚡ Кэш отсутствует — выполняем npm install...'
                                bat 'npm install --no-audit --no-fund --prefer-offline --no-optional --silent'
                                stash name: 'frontend-modules', includes: 'node_modules/**'
                            }
                        }
                    }

                    if (env.CHANGED_BACKEND.toBoolean()) {
                        dir(env.BACKEND_DIR) {
                            echo '🔧 Восстановление зависимостей бэкенда...'
                            bat 'dotnet restore --verbosity quiet'
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    boolean runFrontend = env.CHANGED_FRONTEND.toBoolean()
                    boolean runBackend  = env.CHANGED_BACKEND.toBoolean()

                    if (runBackend) {
                        dir(env.BACKEND_DIR) {
                            echo '🧪 Запуск тестов бэкенда...'
                            bat 'dotnet test --no-build --verbosity normal'
                        }
                    }

                    if (runFrontend) {
                        dir(env.FRONTEND_APP) {
                            echo '🧪 Запуск тестов фронтенда...'
                            bat 'npm test -- --watchAll=false --passWithNoTests --silent'
                        }
                    }

                    if (!runFrontend && !runBackend) {
                        echo '⏭️ Нет изменений — этапы пропущены.'
                    }
                }
            }
        }

        stage('Build and Push Docker Images') {
            steps {
                script {
                    boolean buildFrontend = env.CHANGED_FRONTEND.toBoolean()
                    boolean buildBackend  = env.CHANGED_BACKEND.toBoolean()

                    if (!buildFrontend && !buildBackend) {
                        echo '⏭️ Нет изменений — сборка образов пропущена.'
                        return
                    }

                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )]) {
                        // Login
                        bat 'echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin'

                        // Frontend
                        if (buildFrontend) {
                            echo "🐳 Сборка: ${env.FRONTEND_IMAGE}:latest"
                            bat "docker build -t ${env.FRONTEND_IMAGE}:latest ${env.FRONTEND_APP}"
                            bat "docker push ${env.FRONTEND_IMAGE}:latest"
                        }

                        // Backend
                        if (buildBackend) {
                            echo "🐳 Сборка: ${env.BACKEND_IMAGE}:latest"
                            bat "docker build -t ${env.BACKEND_IMAGE}:latest ${env.BACKEND_DIR}"
                            bat "docker push ${env.BACKEND_IMAGE}:latest"
                        }

                        // Logout
                        bat 'docker logout'
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression {
                    env.GIT_BRANCH == 'origin/main' &&
            (env.CHANGED_FRONTEND.toBoolean() || env.CHANGED_BACKEND.toBoolean())
                }
            }
            steps {
                script {
                    def SOURCE_CONFIG_NAME = 'docker-compose.yml'
                    def sourceFile = "${env.WORKSPACE}\\${SOURCE_CONFIG_NAME}"
                    def destDir = env.DEPLOY_PATH
                    def destConfigFile = "${destDir}\\docker-compose.yml"

                    powershell """
                # --- 1. Проверка исходного файла ---
                \$src = '${sourceFile}'
                \$dst = '${destConfigFile}'
                \$destDir = '${destDir}'

                Write-Host "📁 Исходный файл: \$src"
                if (-not (Test-Path -LiteralPath \$src)) {
                    Write-Error "🛑 КРИТИЧЕСКАЯ ОШИБКА: файл \$src не найден!"
                    Get-ChildItem -Path '${env.WORKSPACE}' | Out-String | Write-Host
                    exit 1
                }

                # --- 2. Создание целевой директории ---
                if (-not (Test-Path -LiteralPath \$destDir)) {
                    Write-Host "📦 Создаю директорию деплоя: \$destDir"
                    New-Item -Path \$destDir -ItemType Directory -Force | Out-Null
                }

                # --- 3. Копирование с бинарной точностью ---
                Write-Host "📄 Копирую: \$src → \$dst"
                Copy-Item -LiteralPath \$src -Destination \$dst -Force

                # --- 4. Валидация результата ---
                if (-not (Test-Path -LiteralPath \$dst)) {
                    Write-Error "❌ Копирование не удалось: \$dst отсутствует"
                    exit 1
                }

                \$size = (Get-Item -LiteralPath \$dst).Length
                if (\$size -eq 0) {
                    Write-Error "❌ Целевой файл пуст (0 байт)!"
                    exit 1
                }

                Write-Host "✅ Успешно скопировано. Размер: \$size байт"
                Write-Host "🔍 Первые 8 строк:"
                Get-Content -LiteralPath \$dst -First 8 | ForEach-Object { Write-Host "  > \$_" }
            """

                    // Запуск compose
                    bat """
                cd /d "${destDir}"
                docker compose --version
                docker compose -f "docker-compose.yml" -p devops config || (echo "❌ YAML invalid!" && exit 1)
                docker compose -f "docker-compose.yml" -p devops down --remove-orphans 2>nul || echo "✅ Остановка (если была)"
                docker compose -f "docker-compose.yml" -p devops pull
                docker compose -f "docker-compose.yml" -p devops up -d --force-recreate
            """

                    echo '✅ Деплой завершён:'
                    echo '   🌐 Фронтенд: http://localhost:3000'
                    echo '   🔌 Бэкенд:   http://localhost:5215'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline успешно завершён!'
        }
        failure {
            echo '❌ Pipeline завершился с ошибкой!'
        }
        always {
            cleanWs()
            bat 'docker logout 2>nul || echo "Docker logout attempted"'
        }
    }
}
