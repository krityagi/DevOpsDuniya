pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "gcr.io/devopsduniya/devopsduniya:${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Master Branch') {
            steps {
                script {
                    sh """
                    git checkout master
                    git pull origin master
                    """
                }
            }
        }
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
        stage('Tag and Push') {
            steps {
                withCredentials([string(credentialsId: 'GitHub_Token', variable: 'GITHUB_TOKEN')]) {
                    script {
                        sh """
                        git tag v${env.BUILD_NUMBER}
                        git push https://krityagi:${GITHUB_TOKEN}@github.com/krityagi/DevOpsDuniya.git v${env.BUILD_NUMBER}
                        """
                    }
                }
            }
        }
        stage('Trigger GitHub Actions') {
            steps {
                withCredentials([string(credentialsId: 'GitHub_Token', variable: 'GITHUB_TOKEN')]) {
                    script {
                        sh """
                        curl -X POST -H "Authorization: token ${GITHUB_TOKEN}" \
                             -H "Accept: application/vnd.github.v3+json" \
                             -d '{"event_type":"jenkins_trigger", "client_payload": {"tag": "v${env.BUILD_NUMBER}"}}' \
                             https://api.github.com/repos/krityagi/DevOpsDuniya/dispatches
                        """
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
