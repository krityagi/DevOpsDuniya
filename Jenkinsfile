pipeline {
    agent {
        docker {
            image 'node:14'
        }
    }

    environment {
        DOCKER_IMAGE = "gcr.io/devopsduniya/devopsduniya:${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build Docker Image') {
            steps {
                script {
                    docker.build(DOCKER_IMAGE)
                }
            }
        }
        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://gcr.io', 'gcr:service-account') {
                        docker.image(DOCKER_IMAGE).push()
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
