pipeline {
    agent any

    environment {
        FRONTEND_DIR = 'front'
        BACKEND_DIR = 'SimpleApp.Backend'
        DOCKER_IMAGE_BACKEND = 'yaponchick/simpleapp-backend'
        DOCKER_IMAGE_FRONTEND = 'yaponchick/simpleapp-frontend'
        registryCredential = 'docker-hub-creds'
    }

    stages {
        stage('Checkout and Detect Changes') {
            steps {
                checkout scm
                script {
                    // Определяем изменения
                    String changes = bat(
                        script: 'git diff --name-only HEAD~1 HEAD 2>nul || echo ""',
                        returnStdout: true
                    ).trim()

                    boolean changedFrontend = changes.contains("${env.FRONTEND_DIR}/")
                    boolean changedBackend = changes.contains("${env.BACKEND_DIR}/")
                    
                    env.CHANGED_FRONTEND = changedFrontend.toString()
                    env.CHANGED_BACKEND = changedBackend.toString()
                    env.BRANCH_NAME = env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    
                    echo "Branch: ${env.BRANCH_NAME}"
                    echo "Frontend changed: ${env.CHANGED_FRONTEND}"
                    echo "Backend changed: ${env.CHANGED_BACKEND}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (env.CHANGED_FRONTEND == 'true') {
                        dir(env.FRONTEND_DIR) {
                            bat 'npm ci --silent'
                        }
                    }
                    if (env.CHANGED_BACKEND == 'true') {
                        dir(env.BACKEND_DIR) {
                            bat 'dotnet restore'
                        }
                    }
                }
            }
        }

        stage('Run Frontend Tests') {
            when {
                anyOf {
                    expression { return env.BRANCH_NAME != 'main' && env.BRANCH_NAME != 'origin/main' }
                    expression { return env.BRANCH_NAME.contains('fix') }
                    expression { return env.BRANCH_NAME.contains('dev') }
                }
            }
            steps {
                script {
                    if (env.CHANGED_FRONTEND == 'true') {
                        dir(env.FRONTEND_DIR) {
                            bat 'npm run test:ci'
                        }
                    } else {
                        echo 'Фронтенд не изменён — тесты пропущены.'
                    }
                }
            }
        }

        stage('Build Docker Images') {
            when {
                anyOf {
                    expression { return env.BRANCH_NAME != 'main' && env.BRANCH_NAME != 'origin/main' }
                    expression { return env.BRANCH_NAME.contains('fix') }
                    expression { return env.BRANCH_NAME.contains('dev') }
                }
            }
            steps {
                script {
                    if (env.CHANGED_BACKEND == 'true') {
                        dir(env.BACKEND_DIR) {
                            bat "docker build -t ${env.DOCKER_IMAGE_BACKEND}:${env.BRANCH_NAME} ."
                        }
                    }
                    if (env.CHANGED_FRONTEND == 'true') {
                        dir(env.FRONTEND_DIR) {
                            bat "docker build -t ${env.DOCKER_IMAGE_FRONTEND}:${env.BRANCH_NAME} ."
                        }
                    }
                }
            }
        }

        stage('Deploy to Production') {
            when {
                expression { return env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'origin/main' }
            }
            steps {
                script {
                    echo 'Starting production deployment...'
                    
                    // Сборка фронта
                    dir(env.FRONTEND_DIR) {
                        bat 'npm ci --silent'
                        bat 'npm run build'
                        bat "docker build -t ${env.DOCKER_IMAGE_FRONTEND}:latest ."
                    }

                    // Сборка бэкенда
                    dir(env.BACKEND_DIR) {
                        bat 'dotnet publish -c Release -o ./publish'
                        bat "docker build -t ${env.DOCKER_IMAGE_BACKEND}:latest ."
                    }

                    // Пуш образов в Docker Hub
                    withCredentials([usernamePassword(credentialsId: env.registryCredential, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        bat "echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin"
                        bat "docker push ${env.DOCKER_IMAGE_FRONTEND}:latest"
                        bat "docker push ${env.DOCKER_IMAGE_BACKEND}:latest"
                    }

                    echo 'Production deployment completed successfully!'
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline completed for branch: ${env.BRANCH_NAME}"
            bat 'docker logout || echo "Docker logout not required"'
        }
        success {
            echo '✅ Pipeline executed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}