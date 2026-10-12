---
title: REX | Terraform + GCP = ❤️
date: 2020-04-20
summary: Terraform et GCP, infrastructure as code.
tags:
  - devops
  - infrastructure
  - gcp
categories:
  - cloud
---

Terraform est le premier outil d'infrastructure **immuable multi-cloud** qui a été présenté au monde par **HashiCorp**, publié il y a trois ans et **écrit en Go**.

C'est un outil pour développer, modifier et gérer des versions d'infrastructure de manière sûre et efficace. 

De plus, Terraform est devenu populaire car il a une syntaxe simple qui permet une modularité facile et fonctionne contre le multi-cloud. 

<div class="admonition admonition-quote">
<p class="admonition-title">Multi-Cloud</p>

Le multi-cloud est une approche du cloud qui s'appuie sur plusieurs services cloud et sur plusieurs fournisseurs de cloud, public ou privé.

</div>

L'objectif du DevOps est d'effectuer la **livraison de logiciels plus efficacement**, c'est là que des outils comme Terraform aident les entreprises avec de l'infrastructure-as-code et de l'automatisation.

<div class="admonition admonition-note">
<p class="admonition-title">Note</p>

Vous avez peut-être utilisé des technologies comme Ansible, Chef ou Puppet pour automatiser et provisionner des logiciels, Terraform part de la même loi, de l'infrastructure-as-code, mais se concentre sur l'automatisation de l'infrastructure elle-même.

</div>

L'ensemble de votre infrastructure Cloud (instances, volumes, réseau, IP) peut être facilement définie dans terraform.

## Hierarchie

Voici comment s'organise un dossier terraform :

![Hiérarchie d'un dossier terraform](/posts/terraform/tree-1.png)

- Le dossier `credentials` contient la clé du service-account utilisé `/credentials/secrets.json`
- Le dossier `first_instance` contient les configurations de l'instance à automatiser. Ils ont tous la même structure :
    - Le fichier `main.tf` qui contient les resources que nous allons déployer sur GCP
    - Le fichier `variables.tf`q ui contient toutes les variables que nous utiliserons dans ce dossier
    - Les fichiers `terraform.tfstate` et `terraform.tfstate.backup` qui nous permet de garder une image locale du state de terraform.
    - Le fichier `output.tf` pour afficher des informations 
    - Le fichier `provider.tf` qui contient les configurations pour se connecter au projet GCP
- Le dossier caché `.terraform` qui contient les dépendances qui ont été mis en cache local

<div class="admonition admonition-note">
<p class="admonition-title">Note</p>

En général, il est bien de **séparer** les fichiers .tf par **type de ressources** quand il y en a beaucoup fin de rendre **plus lisible le code**.

</div>

Voici un exemple de provider pour GCP :

```hcl
variable "path" { default = "/home/formation/terraform/credentials"}

provider "google" {
    project = "eloquent-victor-245321"
    region = "europe-west1-b"
    credentials = "${file("${var.path}/secrets.json")}"
}
```

## Compute Engine

La resource permettant de lancer une instance GCE est : `google_compute_instance`.

Nous devons spécifier certains paramètres comme: le type de la machine, la zone, le nom de l'instance, l'image, le réseau, et le scope.

```hcl
    variable "image" { default = "ubuntu-os-cloud/ubuntu-1604-lts" }
    variable "name_count" { default = ["server1", "server2", "server3"] }
    variable "zone" { default = "europe-west1-b" }
    variable "machine_type" {
      type = "map"
      default = {
       "staging"  = "n1-standard-1"
       "production" = "n1-standard-2"
      }
    }
    
    resource "google_compute_instance" "default" {
      count        = length(var.name_count)
      name         = "list-${count.index + 1}"
      machine_type = lookup(var.machine_type, var.env)
      zone         = var.zone
    
      boot_disk {
        initialize_params {
          image = "${var.image}"
        }
      }
    
      network_interface {
        network = "default"
      }
    
      service_account {
        scopes = ["userinfo-email", "compute-ro", "storage-ro"]
      }
    }
    
    output "machine_type" { value = "${google_compute_instance.default.*.machine_type}" }
    output "zone" { value = "${google_compute_instance.default.*.zone}" }
    output "name" { value = "${google_compute_instance.default.*.name}" }
```

### Création de plusieurs instances

Dans cet exemple, nous lançons 3 instances de type `n1-standard-1` grâce au meta-argument `count` que nous allons nommer `list-1` `list-2` et `list-3`.

Nous allons lancer les commandes `terraform plan` et `terraform apply`

![Plusieurs instances - terraform apply ](/posts/terraform/terraform-3.webp)

Pour obtenir les instances suivantes.

![Hiérarchie d'un dossier terraform](/posts/terraform/terraform-2.png)

### Ordre de lancement

Il est également possible d'ordonnancer le lancement des instances grâce au meta-argument `depends_on` :

```hcl
resource "google_compute_instance" "first" {
  ...
  depends_on = ["google_compute_instance.second"]
}

resource "google_compute_instance" "second" {
  ...
}
```

![Ordre de lancement](/posts/terraform/terraform-4.png)

### Firewall

Pour créer un firewall, il faut uiliser la ressource : `google_compute_firewall`

```hcl
resource "google_compute_firewall" "allow-http" {
  name    = "allow-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  target_tags = ["allow-http"]
}

resource "google_compute_firewall" "allow-https" {
  name    = "allow-https"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  target_tags = ["allow-https"]
}
```

Les firewalls seront appliqués à nos instances GCE  par l'argument `target_tags` :

```hcl
    tags = ["allow-http", "allow-https"] # FIREWALL
```

Nous aurons ainsi 2 nouvelles règles de firewall pour http et https :

![Règles de parefeu dans la console](/posts/terraform/firewall-2.png)

Qui sont appliqués dans les tags réseau de l'instance GCE

![Règles de parefeu appliquée sur l'instance](/posts/terraform/firewall-1.png)

### Volume disque supplémentaire

Nous allons créer un volume supplémentaire grâce à la ressource `google_compute_disk` :

```hcl
resource "google_compute_disk" "default" {
  name = "test-disk"
  type = "pd-ssd"
  zone = var.zone
  size = 10
}
```

Il faut ensuite attacher le volume à notre instance avec la ressource `google_compute_attached_disk` :

```hcl
resource "google_compute_attached_disk" "default" {
  disk = "${google_compute_disk.default.self_link}"
  instance = "${google_compute_instance.default.self_link}"
}
```

Le volume est visible dans la console GCP :

![Volume Console](/posts/terraform/volume-1.png)

## Buckets

Nous allons créer un bucket grâce à la ressource `google_storage_bucket` :

```hcl
variable "name" { default = "formation-terraform-gcp-bucket" }
variable "location" { default = "europe-west1" }
variable "storage_class" { default = "REGIONAL" }

resource "google_storage_bucket" "default" {
  count         = 1
  name          = var.name
  location      = var.location
  storage_class = var.storage_class

  labels = {
    name     = var.name
    location = var.location
  }

  versioning {
    enabled = "true"
  }
}
```
Le bucket est maintenant disponible dans la console GCP :

![Bucket](/posts/terraform/bucket-1.png)

## Databases

Nous allons créer une instance Cloud SQL avec la ressource `google_sql_database_instance` :

```hcl
variable "tier" { default = "db-f1-micro" }
variable "name" { default = "gcp-database" }
variable "db_region" { default = "europe-west1" }
variable "disk_size" { default = "20" }
variable "database_version" { default = "POSTGRES_11" }
variable "replication_type" { default = "SYNCHRONOUS" }
variable "activation_policy" { default = "always" }

resource "google_sql_database_instance" "gcp_database" {
  name             = var.name
  database_version = var.database_version
  region           = var.db_region

  settings {
    tier = var.tier
    disk_size = var.disk_size
    replication_type = var.replication_type
    activation_policy = var.activation_policy
  }
}
```

Nous allons également créer l'utilisateur admin grâce à la ressource `google_sql_user` :

```hcl
variable "user_host" { default = "%" }
variable "user_name" { default = "admin" }
variable "user_password" { default = "123456" }

resource "google_sql_user" "admin" {
  count = 1
  name = var.user_name
  host = var.user_host
  password = var.user_password
  instance = google_sql_database_instance.gcp_database.name 
}
```

L'instance Cloud SQL est disponible dans la console GCP : 

![Database](/posts/terraform/database-1.png)

<div class="admonition admonition-warning">
<p class="admonition-title">Avertissement</p>

Attention, il m'est déjà arrivé d'avoir **une erreur avec Cloud SQL** qui **n'accepte pas toujours de recréer une instance** avec un nom d'instance **déjà utilisé**.

Ce n'est cependant pas la faute de terraform, mais le fonctionenment normal de GCP.

</div>

![Database Error](/posts/terraform/db-error.png)

## Modules

Nous allons maintenant **composer une infrastructure complète** grâce à toutes les ressources que nous avons configuré précedemment.

Les modules de terraform sont **très puissants** et permettent de **pousser l'automatisation à son maximum**.

Grâce aux modules, nous allons importer les resources configurées précedemment, il ne nous restera plus qu'à **assigner les variables** ou **laisser celles par défaut**.

```hcl

module "firewall" {
  source = "../firewall"
}

module "bucket" {
  source = "../bucket"
  bucket_name = "data-project-bucket"
  storage_class = "COLDLINE"
}

module "data-science-instance" {
  source = "../virtual_machine"
  vm_name = "data-science-instance"
  zone = "europe-west1-b"
  env = "staging"
  image = "ubuntu-os-cloud/ubuntu-1604-lts"
  description = "This VM is a sandbox for data scientist to run algorithms"
}

module "data-processing-instance" {
  source = "../virtual_machine"
  vm_name = "data-processing-instance"
  zone = "europe-west1-b"
  env = "staging"
  image = "ubuntu-os-cloud/ubuntu-1604-lts"
  description = "This VM is used to make heavy processing on data"
}
```


## Kubernetes

### Cluster
Pour créer un cluster Kubernetes avec GKE, nous allons utiliser un module de terraform et GCP.

Vous pouvez le trouvez ici: https://registry.terraform.io/modules/terraform-google-modules/kubernetes-engine/google/8.1.0

```hcl
module "gke" {
  source                     = "terraform-google-modules/kubernetes-engine/google"
  project_id                 = "eloquent-victor-245321"
  name                       = "gke-cluster"
  region                     = "europe-west1"
  zones                      = ["europe-west1-b", "europe-west1-c", "europe-west1-d"]
  network                    = "default"
  subnetwork                 = "default"
  ip_range_pods              = ""
  ip_range_services          = ""
  http_load_balancing        = false
  horizontal_pod_autoscaling = true
  network_policy             = false

  node_pools = [
    {
      name               = "default-node-pool"
      machine_type       = "n1-standard-2"
      min_count          = 1
      max_count          = 2  # quota errors if the number is too high
      disk_size_gb       = 10
      disk_type          = "pd-standard"
      
      image_type         = "COS"
      auto_repair        = true
      auto_upgrade       = true
      preemptible        = false
      initial_node_count = 1
    },
  ]
}
```

![Cluster Kubernetes](/posts/terraform/gke-cluster.png)

### Namespace
```hcl
resource "kubernetes_namespace" "example" {
  metadata {
    annotations {
      name = "example"
    }
    name = "example"
  }
}
```

![Namespace Kubernetes](/posts/terraform/namespace.png)

### Secrets
```hcl
resource "kubernetes_secret" "nginx-secret" {
  metadata {
    name      = "tuto-secret"
    namespace = "${kubernetes_namespace.example.metadata.0.name}"
  }
  data {
    "user" = "admin"
    "password" = "123456"
  }
  type = "Opaque"
}
```

![Secret Kubernetes](/posts/terraform/secret.webp)


### Service
```hcl
resource "kubernetes_service" "nginx-service" {
  metadata {
    name      = "nginx-service"
    namespace = "${kubernetes_namespace.example.metadata.0.name}"
  }
  spec {
    selector = {
      app = "${kubernetes_deployment.nginx-example.metadata.0.labels.app}"
    }
    port {
      port        = 80
      target_port = 80
    }

    type = "LoadBalancer"
  }
}
```
![Service Kubernetes](/posts/terraform/service.png)

### Deployment
```hcl
resource "kubernetes_deployment" "nginx-example" {
  metadata {
    name      = "nginx-example"
    namespace = "${kubernetes_namespace.example.metadata.0.name}"
    labels = {
      app = "nginx-example"
    }
  }

  spec {
    replicas = "3"
    selector {
      match_labels = {
        app = "nginx-example"
      }
    }
    template {
      metadata {
        labels = {
          app = "nginx-example"
        }
      }
      spec {
        container {
          image = "nginx:1.7.9"
          name  = "nginx-example"

          env {
            name = "USER"
            value_from {
              secret_key_ref {
                key  = "user"
                name = "${kubernetes_secret.nginx-secret.metadata.0.name}"
              }
            }
          }

          env {
            name = "PASSWORD"
            value_from {
              secret_key_ref {
                key  = "password"
                name = "${kubernetes_secret.nginx-secret.metadata.0.name}"
              }
            }
          }
          
          port {
            name           = "http"
            container_port = 3000
            protocol       = "TCP"
          }

          resources {
            limits {
              cpu    = "200m"
              memory = "256M"
            }
          }

          liveness_probe {
            http_get {
              path = "/nginx_status"
              port = 80

              http_header {
                name  = "X-Custom-Header"
                value = "Awesome"
              }
            }
          }

          readiness_probe {
            tcp_socket {
              port = 80
            }

            failure_threshold     = 1
            initial_delay_seconds = 10
            period_seconds        = 10
            success_threshold     = 1
            timeout_seconds       = 2
          }
        }
      }
    }
  }
}
```

![Pods Kubernetes](/posts/terraform/pods.png)


## Conclusion

Terraform rend la configuration de l'infrastructure cloud **automatisée, documentée, modulable, flexible et versionnée**. 

Après avoir passé beaucoup de temps à configurer à la main mon infrastructure cloud, c'est une **véritable évolution technologique** de pouvoir le faire de cette façon.
