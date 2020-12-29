# portainer-deploy-stack-action

Deploy your services to [Docker Swarm](https://docs.docker.com/engine/swarm/) cluster via [Portainer](https://www.portainer.io). 

## Features
 - create stack if not exists, update if already exists
 - grant access to spicified teams
 - works via [Portainer API](https://documentation.portainer.io/archive/1.23.2/API/)

## Usage

```yaml
name: CI

on:
  push:
    branches:
      - main 

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-20.04
    steps:
      - uses: actions/checkout@v2
      - uses: bots-house/portainer-deploy-stack-action
        with:
          # url of Poratainer instance
          portainer-url: ${{ secrets.PORTAINER_URL }}

          # portainer auth
          portainer-username: ${{ secrets.PORTAINER_USERNAME }}
          portainer-password: ${{ secrets.PORTAINER_PASSWORD }}
          
          # internal portainer cluster id
          portainer-endpoint: 1
          
          # stack name
          stack-name: whoami

          # docker stack file location
          stack-file: .github/stack/staging.yml
          
          # vars to substitute in stack
          stack-vars: |
            DOMAIN: whoami.${{ secrets.DOMAIN }}

          # grant access for specified teams
          teams: Microservices, Bots House Family
```