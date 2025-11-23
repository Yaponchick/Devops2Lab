pipeline {
    agent any
    
    environment {
        FRONTEND_DIR = 'front'
        BACKEND_DIR  = 'SimpleApp.Backend'
        DOCKERHUB_CREDENTIALS = 'docker-hub-creds'
        DOCKERHUB_USER = 'yaponchick'
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/simpleapp-frontend"
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/simpleapp-backend"
    }
    
    stages {
        stage('Checkout') {
            steps {
<<<<<<< HEAD
=======
                echo "Начинаем сборку SimpleApp. Скачиваем код из Git.!!"
>>>>>>> dev
                checkout scm
                script {
                    // Получаем список изменённых файлов
                    def changes = bat(script: 'git diff --name-only HEAD~1 HEAD 2>nul || echo ""', returnStdout: true).trim()
                    echo "Изменённые файлы:\n${changes}"

                    // Определяем изменения в компонентах
                    env.CHANGED_FRONTEND = changes.contains("${env.FRONTEND_DIR}/").toString()
                    env.CHANGED_BACKEND  = changes.contains("${env.BACKEND_DIR}/").toString()
                    
                    // Определяем ветку
                    env.BRANCH_NAME = env.GIT_BRANCH ?: bat(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    env.BRANCH_NAME = env.BRANCH_NAME.replace('origin/', '')
                    
                    echo "Текущая ветка: ${env.BRANCH_NAME}"
                    echo "Frontend изменён: ${env.CHANGED_FRONTEND}"
                    echo "Backend изменён:  ${env.CHANGED_BACKEND}"
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    if (env.CHANGED_FRONTEND == 'true') {
                        dir(env.FRONTEND_DIR) {
                            bat 'npm install --no-audit --no-fund --silent'
                        }
                    }
                    if (env.CHANGED_BACKEND == 'true') {
                        dir(env.BACKEND_DIR) {
                            bat 'dotnet restore --verbosity quiet'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            when {
                anyOf {
                    expression { return env.BRANCH_NAME.contains('fix') }
                    expression { return env.BRANCH_NAME.contains('dev') }
                    expression { return env.BRANCH_NAME != 'main' }
                }
            }
            steps {
                script {
                    boolean runFrontend = env.CHANGED_FRONTEND.toBoolean()
                    boolean runBackend  = env.CHANGED_BACKEND.toBoolean()
                    
                    if (runBackend) {
                        dir(env.BACKEND_DIR) {
                            echo 'Запускаем тесты бэкенда...'
                            bat 'dotnet test --verbosity quiet --logger:"console;verbosity=quiet"'
                        }
                    }
                    if (runFrontend) {
                        dir(env.FRONTEND_DIR) {
                            echo 'Запускаем тесты фронтенда...'
                            bat 'npm test -- --watchAll=false --passWithNoTests --silent'
                        }
                    }
                    if (!runFrontend && !runBackend) {
                        echo 'Нет изменений — тесты пропущены.'
                    }
                }
            }
        }
        
        stage('Build Docker Images for Branches') {
            when {
                anyOf {
                    expression { return env.BRANCH_NAME.contains('fix') }
                    expression { return env.BRANCH_NAME.contains('dev') }
                    expression { return env.BRANCH_NAME != 'main' }
                }
            }
            steps {
                script {
                    echo "Сборка Docker образов для ветки: ${env.BRANCH_NAME}"
                    
                    if (env.CHANGED_FRONTEND == 'true' || env.CHANGED_BACKEND == 'true') {
                        withCredentials([usernamePassword(
                            credentialsId: env.DOCKERHUB_CREDENTIALS,
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_TOKEN'
                        )]) {
                            bat """
                                echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin
                            """
                            
                            if (env.CHANGED_FRONTEND == 'true') {
                                bat """
                                    docker build -t ${env.FRONTEND_IMAGE}:${env.BRANCH_NAME} ${env.FRONTEND_DIR}
                                    docker push ${env.FRONTEND_IMAGE}:${env.BRANCH_NAME}
                                """
                            }
                            
                            if (env.CHANGED_BACKEND == 'true') {
                                bat """
                                    docker build -t ${env.BACKEND_IMAGE}:${env.BRANCH_NAME} ${env.BACKEND_DIR}
                                    docker push ${env.BACKEND_IMAGE}:${env.BRANCH_NAME}
                                """
                            }
                            
                            bat "docker logout"
                        }
                    } else {
                        echo 'Нет изменений — сборка образов пропущена.'
                    }
                }
            }
        }
        
        stage('Build Production Images') {
            when {
                expression { return env.BRANCH_NAME == 'main' }
            }
            steps {
                script {
                    echo 'Сборка PRODUCTION образов...'
                    
                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )]) {
                        bat """
                            echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin
                            docker build -t ${env.FRONTEND_IMAGE}:latest ${env.FRONTEND_DIR}
                            docker push ${env.FRONTEND_IMAGE}:latest
                            docker build -t ${env.BACKEND_IMAGE}:latest ${env.BACKEND_DIR}
                            docker push ${env.BACKEND_IMAGE}:latest
                            docker logout
                        """
                    }
                    
                    echo "✅ PRODUCTION образы собраны и отправлены в Docker Hub!"
                    echo "   Фронтенд: ${env.FRONTEND_IMAGE}:latest"
                    echo "   Бэкенд: ${env.BACKEND_IMAGE}:latest"
                }
            }
        }
    }
    
    post {
        success { 
            echo "✅ Pipeline для ветки ${env.BRANCH_NAME} выполнен успешно!" 
        }
        failure { 
            echo "❌ Pipeline для ветки ${env.BRANCH_NAME} завершился с ошибкой!" 
        }
        always { 
            cleanWs()
            bat 'docker logout 2>nul || echo "Docker logout completed"'
        }
    }
}