---
weight: 4
title: "REX | Google Cloud Run"
date: 2021-10-10T13:19:06+02:00
draft: false
author: "Anthony SSI YAN KAI"
description: "Retour d'expérience sur Google Cloud Run et la migration d'une app K8s vers Cloud Run"

tags: ["devops", "infrastructure", "gcp"]
categories: ["cloud"]
hiddenFromHomePage: false

toc: true
autoCollapseToc: true
math: false
lightgallery: true
linkToMarkdown: true
comment: false
---

Cloud Run est un service de Google Cloud Platform disponible depuis Novembre 2019 et qui vous permet d'exécuter des conteneurs invocables via des requêtes ou des événements.

<!--more-->

Cloud Run est serverless : il fait abstraction de toute la gestion de l'infrastructure, afin que vous puissiez vous concentrer sur ce qui compte le plus : créer des applications de qualité.

## Pourquoi utiliser Cloud Run ?

Cloud Run est l'évolution d'App Engine (web server) et se positionne dans les services managés serverless au même titre que les Cloud functions.

![Tour](/posts/google/tour.png)

### Cloud Run vs Cloud Functions
Cloud functions est totalement managée (déploiement d'un bout de code) et Cloud Run est plus flexible (déploiement d'un serveur http)

![Cloud Functions vs Cloud Run](/posts/google/runvsfunctions.png)

#### Cloud Functions
Cloud Functions simplifie le déploiement et la maintenabilité : vous êtes uniquement responsable du code. 
Toute personne de votre équipe ayant des connaissances dans un langage peut créer une solution sans avoir de connaissance en devops. 
Les scientifiques des données, par exemple, peuvent exécuter un script Python dans le cloud avec une connaissance limitée de l'infrastructure.

- Transformer des données et les charger dans BigQuery
- Création d'un webhook appelé par un tiers (par exemple, GitHub)
- Utiliser les API ML pour analyser les données ajoutées à une base de données ou à un bucket de stockage

#### Cloud Run
Cloud Run simplifie le scaling et la maintenance des services en utilisant des conteneurs conformes aux normes de l'industrie. 
Vous pouvez ainsi déléguer la gestion de l'infrastructure et des workloads.

- Serveur Web
- API REST ou gRPC
- Applications internes de back-office personnalisées

## Comment configurer ?

Cloud Run va utiliser une image pour lancer un serveur avec le langage de votre choix (Go, JavaScript, Java, Python, …)

Votre image contiendra un serveur web, qui écoutera un port et sera servi par Cloud Run.

A chaque fois qu’une requête HTTP sera reçue, un container sera lancé, et répondra à la requête, puis se terminera.

### Terraform

La configuration de Cloud Run via terraform est très simple, et il est possible de faire exactement la même chose que via la console ou les lignes de commandes gcloud.

### Gestion Cloud SQL

Cloud Run s’intègre simplement avec les autres services de GCP notamment Cloud SQL pour lequel il suffit de configurer une connexion à l’initialisation.

```jsx
resource "google_cloud_run_service" "default" {
  name     = "cloudrun-srv"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "us-docker.pkg.dev/cloudrun/container/hello"
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "1000"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.instance.connection_name
        "run.googleapis.com/client-name"        = "terraform"
      }
    }
  }
  autogenerate_revision_name = true
}

resource "google_sql_database_instance" "instance" {
  name             = "cloudrun-sql"
  region           = "us-east1"
  database_version = "MYSQL_5_7"
  settings {
    tier = "db-f1-micro"
  }

  deletion_protection  = "true"
}
```

### Gestion des secrets

Cloud Run gère les variables d’environnements et les secrets. Pour ces derniers, il faudra utiliser Secret Manager, un autre service de GCP permettant de stocker des secrets qui seront versionnés.

```jsx
resource "google_secret_manager_secret" "secret" {
  secret_id = "secret"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "secret-version-data" {
  secret = google_secret_manager_secret.secret.name
  secret_data = "secret-data"
}

resource "google_cloud_run_service" "default" {
  name     = "cloudrun-srv"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/cloudrun/hello"
        env {
          name = "SECRET_ENV_VAR"
      value_from {
            secret_key_ref {
              name = google_secret_manager_secret.secret.secret_id
              key = "1"
            }
          }
        }
      }
    }
  }
}
```

Si vous migrez de Kubernetes, vers Cloud Run, il faudra donc régénérer vos secrets et les stocker dans Secret Manager.

## Conclusion

### Limitations

- Chaque requête devra être traitée dans une durée maximum de 1 heure (à configurer)
- Il faut maintenir la connexion HTTP ouverte durant la totalité du calcul sans quoi, Cloud Run va passer en mode « idle »
- Il faut éviter de lancer des jobs en background (goroutines) car si la requête se termine avant le process, le container se terminera quand même sans que le process se termine
- Chaque appel doit être omnipotent et devra agir de la même façon à chaque requête
- Veillez à bien fermer les connexions ouvertes durant la requête puisque Cloud Run va lancer et supprimer des containers à chaque requête en fonction du trafic

### Avantages

Le principal avantage du service Cloud Run est la gestion automatisée des ressources et son caractère serverless. 
Il vous permettra de faire des économies en infrastructure, à condition que votre cas d’utilisation entre dans les limitations citées précédemment.

- Serverless
- Gestion managée et adaptée au trafic
- Tous les langages (du moment qu’il y a une image docker)
- La variété des triggers (http, grpc, cloud scheduler, pubsub, …)
- La simplicité de la configuration (DNS, Cloud SQL, etc …)
- Permet de réduire la complexité par rapport à Kubernetes

### Autres solutions

Dans certains cas, Cloud Run ne répondra pas à vos besoins, dans ce cas vous devriez explorer les services suivants :

- Cloud Function
- Kubernetes Engine
- Compute Engine

Sources:
https://cloud.google.com/blog/topics/developers-practitioners/where-should-i-run-my-stuff-choosing-google-cloud-compute-option?hl=en
https://cloud.google.com/blog/products/serverless/cloud-run-vs-cloud-functions-for-serverless?hl=en