pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "gcr.io/devopsduniya/devopsduniya:${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker build -t ${DOCKER_IMAGE} .'
                }
            }
        }
        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://gcr.io', 'gcr:service-account') {
                        sh 'docker push ${DOCKER_IMAGE}'
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
