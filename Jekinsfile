pipeline {
    agent any
    environment {
        GCP_PROJECT = 'devopsduniya'
        IMAGE_NAME = "gcr.io/${GCP_PROJECT}/DevOpsDuniya"
        KUBE_CONFIG = credentials('kube-config')
        DOCKER_CREDENTIALS = 'gcr:credentialsId' // Add your Docker credentials ID here
    }
    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/your-username/your-repo.git', branch: 'main'
            }
        }
        stage('Build') {
            steps {
                script {
                    docker.build(IMAGE_NAME)
                }
            }
        }
        stage('Push') {
            steps {
                script {
                    docker.withRegistry('https://gcr.io', DOCKER_CREDENTIALS) {
                        docker.image(IMAGE_NAME).push('latest')
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                script {
                    withKubeConfig([credentialsId: KUBE_CONFIG]) {
                        sh 'kubectl apply -f k8s/deployment.yaml'
                        sh 'kubectl apply -f k8s/service.yaml'
                    }
                }
            }
        }
    }
}
