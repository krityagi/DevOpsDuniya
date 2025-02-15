pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "gcr.io/devopsduniya/devopsduniya:${env.BUILD_NUMBER}"
    }

    stages {
        stage('Check if Image Exists') {
            steps {
                script {
                    def imageExists = sh(returnStatus: true, script: "gcloud container images describe ${DOCKER_IMAGE}") == 0
                    if (imageExists) {
                        currentBuild.result = 'SUCCESS'
                        echo "Image already exists. Skipping build and push."
                        exit 0
                    }
                }
            }
        }
        stage('Build Docker Image') {
            when {
                not {
                    expression {
                        sh(returnStatus: true, script: "gcloud container images describe ${DOCKER_IMAGE}") == 0
                    }
                }
            }
            steps {
                script {
                    sh 'docker build -t ${DOCKER_IMAGE} .'
                }
            }
        }
        stage('Push Docker Image') {
            when {
                not {
                    expression {
                        sh(returnStatus: true, script: "gcloud container images describe ${DOCKER_IMAGE}") == 0
                    }
                }
            }
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
