pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'yaponchick/simpleapp-backend'
        DOCKER_IMAGE_FRONTEND = 'yaponchick/simpleapp-frontend'
        registryCredential = 'docker-hub-creds'
    }

    stages {
        stage('0. Diagnostics') {
            steps {
                echo "=== START DIAGNOSTICS ==="
                script {
                    bat 'echo Current user: %USERNAME%'
                    bat 'cd'
                    bat 'docker --version'
                    bat 'docker images'
                    bat 'dir'
                }
                echo "=== END DIAGNOSTICS ==="
            }
        }

        stage('1. Checkout Code') {
            steps {
                echo "Checking out code from Git..."
                checkout scm
                bat 'dir'  // проверяем что скачалось
            }
        }

        stage('2. Check Project Structure') {
            steps {
                echo "Checking project structure..."
                script {
                    def backendExists = fileExists 'SimpleApp.Backend'
                    def frontendExists = fileExists 'front'
                    
                    echo "SimpleApp.Backend exists: ${backendExists}"
                    echo "front exists: ${frontendExists}"
                    
                    if (backendExists) {
                        bat 'dir SimpleApp.Backend\\'
                    }
                    if (frontendExists) {
                        bat 'dir front\\'
                    }
                }
            }
        }

        stage('3. Build Backend Image') {
            when {
                expression { fileExists('SimpleApp.Backend/Dockerfile') }
            }
            steps {
                script {
                    echo 'Building Backend Docker image...'
                    dir('SimpleApp.Backend') {
                        bat "docker build -t $DOCKER_IMAGE_BACKEND:latest ."
                    }
                }
            }
        }

        stage('4. Build Frontend Image') {
            when {
                expression { fileExists('front/Dockerfile') }
            }
            steps {
                script {
                    echo 'Building Frontend Docker image...'
                    dir('front') { 
                        bat "docker build -t $DOCKER_IMAGE_FRONTEND:latest ."
                    }
                }
            }
        }

        stage('5. Push to Docker Hub') {
            when {
                anyOf {
                    expression { fileExists('SimpleApp.Backend/Dockerfile') }
                    expression { fileExists('front/Dockerfile') }
                }
            }
            steps {
                script {
                    echo 'Pushing images to Docker Hub...'
                    withCredentials([usernamePassword(credentialsId: registryCredential, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        bat "echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin"
                        bat "docker push $DOCKER_IMAGE_BACKEND:latest || echo Backend push failed"
                        bat "docker push $DOCKER_IMAGE_FRONTEND:latest || echo Frontend push failed"
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished.'
            bat 'docker logout'
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}