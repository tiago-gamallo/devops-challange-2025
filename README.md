# Desafio DevOps 2025

Este repositório contém a solução para o Desafio DevOps, apresentando uma infraestrutura conteinerizada, com proxy reverso gerenciando o cache em diferentes camadas, e uma stack completa de observabilidade.

## Como executar

Atendendo estritamente ao requisito de "iniciar e rodar com o menor número de comandos possível", a infraestrutura local foi orquestrada via Docker Compose.

1. Clone o repositório:
   ```bash
   git clone <seu-repositorio>
   cd <pasta-do-repositorio>
    ```
2. Suba a infraestrutura:
 ```bash
   docker compose up -d
 ```
(Nota: O Nginx possui um mecanismo de depends_on atrelado aos healthchecks das aplicações. Ele aguardará as APIs estarem 100% prontas antes de iniciar, garantindo zero downtime no boot da stack).


## Testando a Camada de Cache
Para verificar o cache atuando, você pode usar o curl observando o header customizado X-Cache-Status implementado no Nginx:

1. App 1 (Python) - Cache de 10s:
 ```bash
   curl -I http://localhost/app1/time
 ```
(Execute duas vezes rapidamente. Na segunda, você verá X-Cache-Status: HIT. Após 10s, verá um MISS ou EXPIRED e um novo horário será gerado).

2. App 2 (Node.js) - Cache de 60s:
 ```bash
   curl -I http://localhost/app2/time
 ```

## Desenho da Arquitetura
A arquitetura foi desenhada para que as aplicações sejam stateless. O Nginx centraliza a responsabilidade do cache (Layer 7), permitindo escalabilidade horizontal das linguagens no backend de forma transparente.

```mermaid
graph TD
    Client([Usuário / Internet]) -->|HTTP:80| Nginx[Nginx Proxy Reverso + Cache]

    subgraph "Camada de Aplicação"
        App1[App1 - Python Gunicorn]
        App2[App2 - Node.js Express]
    end

    Nginx -->|/app1| App1
    Nginx -->|/app2| App2

    subgraph "Observabilidade"
        Prometheus[Prometheus]
        Grafana[Grafana]
    end

    Grafana -->|Query| Prometheus
    Prometheus -.->|Scrape /metrics| App1
    Prometheus -.->|Scrape /metrics| App2

    %% Estilo ajustado para legibilidade (borda neon tracejada)
    classDef proxy stroke:#00d2ff,stroke-width:3px,stroke-dasharray: 5 5,fill:transparent;
    class Nginx proxy;
```

## Fluxo de Atualização (CI/CD)
No cenário proposto de produção, as atualizações de infraestrutura e código seguem uma abordagem GitOps utilizando GitHub Actions configurado com runners adequados para CI e CD. O fluxo abaixo detalha a jornada do código até o deploy seguro:

```mermaid
sequenceDiagram
    actor Dev as Desenvolvedor
    participant Git as GitHub (Main)
    participant Actions as GitHub Actions
    participant ECR as Container Registry (AWS ECR)
    participant Infra as Servidor / Cluster Kubernetes

    Dev->>Git: Push de nova feature ou ajuste de Infra
    Git->>Actions: Dispara pipeline de CI

    Note over Actions: Linters, Testes e Verificação de Segurança

    Actions->>ECR: Build das Imagens Docker & Push (Tag única SHA)
    Actions->>Infra: Trigger de Deploy (Atualiza tag no Deployment)

    Note over Infra: Rolling Update sem indisponibilidade (Liveness/Readiness probes)
    Infra->>Dev: Aplicação Atualizada com Sucesso
```
    
## Identificação e Sugestões de Melhoria
Para cumprir o requisito de iniciar com o menor número de comandos possível para a avaliação, a infraestrutura principal foi orquestrada via Docker Compose. No entanto, pensando em um ambiente de produção corporativo, resiliente e escalável, criei a pasta k8s/ contendo os manifestos Kubernetes estruturados (Deployments, Services e ConfigMaps).

Minhas sugestões de melhoria e próximos passos para evolução dessa arquitetura em nuvem incluem:

a. Deploy em Cluster Gerenciado (Ex: AWS EKS / ECS):

   *Utilizar os manifestos da pasta k8s/ para provisionar a aplicação em um cluster escalável. O repositório de imagens passaria a ser um serviço gerenciado, como o Amazon ECR, integrado diretamente na esteira do GitHub Actions.

b. Escalonamento Automático (HPA):

   *Os manifestos já incluem requests e limits de CPU/Memória. O próximo passo é configurar um Horizontal Pod Autoscaler baseado no consumo de recursos ou na métrica de requisições por segundo exportada pelo Prometheus.

c. Segurança de Acessos e Redes (VPC & IAM): 

   *Isolar os worker nodes do cluster em sub-redes privadas e endpoints (VPC Endpoints) para serviços internos, expondo apenas o proxy reverso através de um Ingress Controller público. 
   
   *Em vez de credenciais estáticas, adotar IAM Roles no Kubernetes (IRSA) ou Task Roles no ECS, garantindo privilégios mínimos (Least Privilege) para cada pod.
   
d. Gestão do Nginx Proxy e Observabilidade: 

   *Centralizar os logs de acesso e erros do Nginx enviando-os para um agregador de logs, complementando as métricas do Prometheus/Grafana já implementadas para uma observabilidade 360º.

