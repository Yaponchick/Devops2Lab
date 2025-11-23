pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'Yaponchick/simpleapp-backend'
        DOCKER_IMAGE_FRONTEND = 'Yaponchick/simpleapp-frontend'
        registryCredential = 'docker-hub-creds'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo "Начинаем сборку SimpleApp. Скачиваем код из Git.!!"
                checkout scm
            }
        }

        // --- 2. Сборка Бэкенда (.NET) ---
        stage('2. Build Backend Image') {
            steps {
                script {
                    echo 'Сборка Docker-образа бэкенда...'
                    dir('SimpleApp.Backend') {
                        sh "docker build -t $DOCKER_IMAGE_BACKEND:latest ."
                    }
                }
            }
        }

        // --- 3. Сборка Фронтенда (React + Nginx) ---
        stage('3. Build Frontend Image') {
            steps {
                script {
                    echo 'Сборка Docker-образа фронтенда...'
                    dir('front') { 
                        sh "docker build -t $DOCKER_IMAGE_FRONTEND:latest ."
                    }
                }
            }
        }

        // --- 4. Публикация в Docker Hub ---
        stage('4. Push to Docker Hub') {
            steps {
                script {
                    echo 'Авторизация и отправка образов...'
                    withCredentials([usernamePassword(credentialsId: registryCredential, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin"
                        
                        sh "docker push $DOCKER_IMAGE_BACKEND:latest"
                        sh "docker push $DOCKER_IMAGE_FRONTEND:latest"
                    }
                }
            }
        }
        
        stage('5. Cleanup') {
            steps {
                echo 'Завершение конвейера.'
                sh "docker logout"
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline завершен.'
        }
        success {
            echo 'Pipeline выполнен успешно!'
        }
        failure {
            echo 'Pipeline завершился с ошибкой.'
        }
    }
}