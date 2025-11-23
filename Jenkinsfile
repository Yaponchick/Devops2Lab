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
        stage('Checkout and Setup') {
            steps {
                checkout scm
                script {
                    env.BRANCH_NAME = env.GIT_BRANCH ?: 'main'
                    env.BRANCH_NAME = env.BRANCH_NAME.replace('origin/', '')
                    echo "Building branch: ${env.BRANCH_NAME}"
                    
                    // Проверяем доступность инструментов
                    env.NODE_AVAILABLE = bat(script: 'npm --version >nul 2>&1 && echo true || echo false', returnStdout: true).trim()
                    env.DOTNET_AVAILABLE = bat(script: 'dotnet --version >nul 2>&1 && echo true || echo false', returnStdout: true).trim()
                    env.DOCKER_AVAILABLE = bat(script: 'docker --version >nul 2>&1 && echo true || echo false', returnStdout: true).trim()
                    
                    echo "Tools - Node: ${env.NODE_AVAILABLE}, .NET: ${env.DOTNET_AVAILABLE}, Docker: ${env.DOCKER_AVAILABLE}"
                }
            }
        }
        
        stage('Build Backend') {
            when {
                expression { return env.DOTNET_AVAILABLE == 'true' }
            }
            steps {
                dir(env.BACKEND_DIR) {
                    bat 'dotnet restore --verbosity quiet'
                    bat 'dotnet build --verbosity quiet'
                }
            }
        }
        
        stage('Run Backend Tests') {
            when {
                allOf {
                    expression { return env.DOTNET_AVAILABLE == 'true' }
                    expression { return env.BRANCH_NAME != 'main' }
                }
            }
            steps {
                dir(env.BACKEND_DIR) {
                    bat 'dotnet test --verbosity quiet --logger:"console;verbosity=quiet"'
                }
            }
        }
        
        stage('Build Docker Images') {
            when {
                expression { return env.DOCKER_AVAILABLE == 'true' }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )]) {
                        bat """
                            echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin
                            docker build -t ${env.BACKEND_IMAGE}:${env.BRANCH_NAME} ${env.BACKEND_DIR}
                            docker push ${env.BACKEND_IMAGE}:${env.BRANCH_NAME}
                            docker logout
                        """
                    }
                }
            }
        }
        
        stage('Build Production Images') {
            when {
                allOf {
                    expression { return env.BRANCH_NAME == 'main' }
                    expression { return env.DOCKER_AVAILABLE == 'true' }
                }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )]) {
                        bat """
                            echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin
                            docker build -t ${env.BACKEND_IMAGE}:latest ${env.BACKEND_DIR}
                            docker push ${env.BACKEND_IMAGE}:latest
                            docker logout
                        """
                    }
                    echo "✅ PRODUCTION образ бэкенда собран и отправлен в Docker Hub!"
                }
            }
        }
        
        stage('Skip Frontend - No Node.js') {
            when {
                expression { return env.NODE_AVAILABLE == 'false' }
            }
            steps {
                echo "⚠️  Frontend сборка пропущена - Node.js не установлен в Jenkins"
                echo "Для сборки фронтенда установите Node.js в Jenkins:"
                echo "Manage Jenkins → Global Tool Configuration → NodeJS"
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
            bat 'docker logout 2>nul || echo "Docker cleanup completed"'
        }
    }
}