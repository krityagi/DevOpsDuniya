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
                withCredentials([file(credentialsId: 'gcr-service-account', variable: 'GCP_KEYFILE')]) {
                    script {
                        sh '''
                        gcloud auth activate-service-account --key-file=$GCP_KEYFILE
                        gcloud auth configure-docker
                        docker push ${DOCKER_IMAGE}
                        '''
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
