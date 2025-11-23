pipeline {
    agent any
    
    environment {
        FRONTEND_DIR = 'front'
        BACKEND_DIR  = 'SimpleApp.Backend'
        DOCKERHUB_CREDENTIALS = 'docker-hub-creds'
    }
    
    stages {
        stage('Checkout and Setup') {
            steps {
                checkout scm
                script {
                    env.BRANCH_NAME = env.GIT_BRANCH ?: 'main'
                    env.BRANCH_NAME = env.BRANCH_NAME.replace('origin/', '')
                    echo "Building branch: ${env.BRANCH_NAME}"
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir(env.FRONTEND_DIR) {
                    bat 'npm install --no-audit --no-fund --silent || echo "NPM install failed"'
                }
            }
        }
        
        stage('Build Backend') {
            steps {
                dir(env.BACKEND_DIR) {
                    bat 'dotnet restore --verbosity quiet || echo "Dotnet restore failed"'
                }
            }
        }
        
        stage('Run Tests for Non-Main') {
            when {
                expression { return env.BRANCH_NAME != 'main' }
            }
            steps {
                echo "Running tests for branch: ${env.BRANCH_NAME}"
                // добавьте тесты здесь
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKERHUB_CREDENTIALS,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )]) {
                        bat """
                            echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin
                            docker build -t yaponchick/simpleapp-frontend:${env.BRANCH_NAME} front
                            docker build -t yaponchick/simpleapp-backend:${env.BRANCH_NAME} SimpleApp.Backend
                            docker logout
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline finished for branch: ${env.BRANCH_NAME}"
        }
    }
}