pipeline {
    agent any

    environment {
        // Структура проекта
        FRONTEND_ROOT   = 'front'
        FRONTEND_APP    = '${FRONTEND_ROOT}/my-react-app'
        BACKEND_DIR     = 'SimpleApp.Backend'

        // Docker
        DOCKERHUB_CREDENTIALS = 'docker-hub-creds'
        DOCKERHUB_USER = 'yaponchick'
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/simpleapp-frontend"
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/simpleapp-backend"

        // Деплой (локальный)
        DEPLOY_PATH = 'D:/ПОЛИТЕХ/4 курс/DevOps'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    def changes = bat(
                        script: 'git diff --name-only HEAD~1 HEAD 2>nul || echo ""',
                        returnStdout: true
                    ).trim()
                    echo "Изменённые файлы:\n${changes ?: '<none>'}"

                    // Проверяем изменения именно в приложении, а не только в 'front/'
                    env.CHANGED_FRONTEND = (changes && changes.contains("${env.FRONTEND_APP}/")).toString()
                    env.CHANGED_BACKEND  = (changes && changes.contains("${env.BACKEND_DIR}/")).toString()

                    echo "Frontend (my-react-app) изменён: ${env.CHANGED_FRONTEND}"
                    echo "Backend (SimpleApp.Backend) изменён: ${env.CHANGED_BACKEND}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (env.CHANGED_FRONTEND.toBoolean()) {
                        dir(env.FRONTEND_APP) {
                            echo 'Установка/восстановление зависимостей фронтенда...'

                            // Пытаемся восстановить кэш node_modules
                            try {
                                unstash 'frontend-node-modules'
                                echo '✅ Кэш node_modules восстановлен.'
                            } catch (e) {
                                echo '📦 Кэш не найден — выполняем npm install...'
                                // --prefer-offline: использует кэш npm (~/.npm), если есть
                                // --no-optional: пропускает необязательные (часто проблемные на Windows) пакеты, например fsevents
                                bat 'npm install --no-audit --no-fund --prefer-offline --no-optional --silent'
                                // Сохраняем кэш для будущих сборок
                                stash name: 'frontend-node-modules', includes: 'node_modules/**'
                            }
                        }
                    }
                    if (env.CHANGED_BACKEND.toBoolean()) {
                        dir(env.BACKEND_DIR) {
                            echo 'Восстановление зависимостей бэкенда...'
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
                            echo 'Запуск тестов бэкенда...'
                            bat 'dotnet test --verbosity normal --no-build'
                        }
                    }
                    if (runFrontend) {
                        dir(env.FRONTEND_APP) {
                            echo 'Запуск тестов фронтенда...'
                            bat 'npm test -- --watchAll=false --passWithNoTests --silent'
                        }
                    }
                    if (!runFrontend && !runBackend) {
                        echo 'Нет изменений — тесты пропущены.'
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
                        echo 'Нет изменений — сборка и публикация образов пропущены.'
                        return
                    }

                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )]) {
                        bat 'echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin'

                        if (buildFrontend) {
                            echo "🏗️ Сборка фронтенда: ${env.FRONTEND_IMAGE}:latest"
                            bat "docker build -t ${env.FRONTEND_IMAGE}:latest ${env.FRONTEND_APP}"
                            bat "docker push ${env.FRONTEND_IMAGE}:latest"
                        }

                        if (buildBackend) {
                            echo "🏗️ Сборка бэкенда: ${env.BACKEND_IMAGE}:latest"
                            bat "docker build -t ${env.BACKEND_IMAGE}:latest ${env.BACKEND_DIR}"
                            bat "docker push ${env.BACKEND_IMAGE}:latest"
                        }

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
                    bat """
                        if not exist "${env.DEPLOY_PATH}" mkdir "${env.DEPLOY_PATH}"
                        copy /Y "${env.WORKSPACE}\\docker-compose-deploy.yml" "${env.DEPLOY_PATH}\\docker-compose.yml"
                    """

                    dir(env.DEPLOY_PATH) {
                        bat """
                            docker-compose -p devops down --remove-orphans 2>nul || echo "✅ Остановлены предыдущие сервисы (если были)"
                            docker-compose -p devops pull
                            docker-compose -p devops up -d --force-recreate
                        """
                    }

                    echo "✅ Приложение развернуто локально:"
                    echo "   🌐 Фронтенд: http://localhost:3000"
                    echo "   🔌 Бэкенд:   http://localhost:5215"
                }
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline завершён успешно!'
        }
        failure {
            echo '💥 Pipeline завершился с ошибкой!'
        }
        always {
            // cleanWs() ОСТАВЛЕН, но кэш node_modules сохраняется через stash (не в workspace)
            cleanWs()
            bat 'docker logout 2>nul || echo "Docker logout attempted"'
        }
    }
}