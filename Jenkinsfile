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
        stage('Update deployment.yaml') {
            steps {
                script {
                    sh '''
                    sed -i 's|image: gcr.io/devopsduniya/devopsduniya:.*|image: gcr.io/devopsduniya/devopsduniya:${env.BUILD_NUMBER}|g' k8s/deployment.yaml
                    git config --global user.email "ktyagi0602@gmail.com"
                    git config --global user.name "krityagi"
                    git add k8s/deployment.yaml
                    git commit -m "Update image tag to ${env.BUILD_NUMBER}"
                    git push origin main
                    '''
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
                             https://api.github.com/repos/your-username/your-repo/dispatches \
                             -d '{"event_type":"jenkins_trigger"}'
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
