pipeline {
    agent any
    
    environment {
        FRONTEND_DIR = 'front/my-react-app'
        BACKEND_DIR  = 'SimpleApp.Backend'
        DOCKERHUB_CREDENTIALS = 'docker-hub-creds'
        DOCKERHUB_USER = 'yaponchick'
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/simpleapp-frontend"
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/simpleapp-backend"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Получаем список изменённых файлов
                    def changes = bat(script: 'git diff --name-only HEAD~1 HEAD 2>nul || echo ""', returnStdout: true).trim()
                    echo "Изменённые файлы:\n${changes}"

                    // Инициализируем переменные
                    env.CHANGED_FRONTEND = changes.contains("${env.FRONTEND_DIR}/").toString()
                    env.CHANGED_BACKEND  = changes.contains("${env.BACKEND_DIR}/").toString()

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
            steps {
                script {
                    boolean runFrontend = env.CHANGED_FRONTEND.toBoolean()
                    boolean runBackend  = env.CHANGED_BACKEND.toBoolean()
                    
                    if (runBackend) {
                        dir(env.BACKEND_DIR) {
                            echo 'Запускаем тесты бэкенда...'
                            bat 'dotnet test --verbosity quiet'
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
        
        stage('Build and Push Docker Images') {
            steps {
                script {
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
                }
            }
        }
    }
    
    post {
        success { 
            echo 'Pipeline выполнен успешно!' 
        }
        failure { 
            echo 'Pipeline завершился с ошибкой!' 
        }
        always { 
            cleanWs()
            bat 'docker logout 2>nul || echo "Docker logout completed"'
        }
    }
}