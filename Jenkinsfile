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

        // 🚀 Деплой: Использован новый, надежный путь без кириллицы/пробелов
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
                    // --- 💥 ИСПРАВЛЕННЫЙ БЛОК КОПИРОВАНИЯ: ИСПОЛЬЗУЕМ POWER SHELL ---
                    
                    def sourceFile = "${env.WORKSPACE}\\docker-compose-deploy.yml"
                    def destDir = env.DEPLOY_PATH // D:\\DevOps-Deploy\\SimpleApp
                    def destFile = "${destDir}\\docker-compose.yml"
                    
                    // PowerShell для создания папки и копирования файла (надежно работает с путями Windows)
                    powershell """
                        # Создаем папку, если ее нет
                        if (-not (Test-Path -Path '${destDir}')) { 
                            Write-Host "Создаю папку деплоя: ${destDir}"
                            New-Item -Path '${destDir}' -ItemType Directory | Out-Null
                        } else {
                            Write-Host "Папка деплоя уже существует: ${destDir}"
                        }
                        
                        # Копируем файл
                        Write-Host "Копирую файл: ${sourceFile} -> ${destFile}"
                        Copy-Item -Path '${sourceFile}' -Destination '${destFile}' -Force
                    """
                    // -------------------------------------------------------------

                    // Деплой
                    dir(env.DEPLOY_PATH) {
                        bat """
                            docker-compose -p devops down --remove-orphans 2>nul || echo "✅ Остановка (если была)"
                            docker-compose -p devops pull
                            docker-compose -p devops up -d --force-recreate
                        """
                    }

                    echo "✅ Деплой завершён:"
                    echo "   🌐 Фронтенд: http://localhost:3000"
                    echo "   🔌 Бэкенд:   http://localhost:5215"
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