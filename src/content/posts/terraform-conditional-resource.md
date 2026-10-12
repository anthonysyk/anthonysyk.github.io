---
title: TIPS | Terraform Conditional Resource 🤷
date: 2021-04-13
summary: Créer dynamiquement des ressources terraform au conditionnel
tags:
  - devops
  - infrastructure
  - gcp
categories:
  - cloud
---

L'organisation de la configuration d'un projet terraform est essentielle pour la maintenabilité du code.

Nous verrons ici comment mutualiser certaines configurations de ressources de manière dynamique et conditionnelle.

**Petit spoil, il n'y a pas de if/else ...**

Nous souhaitons décrire notre configuration dans un module `shared`.

```
root
└── terraform
    ├── modules
    │   └── shared
    │       ├── accounts.tf
    │       ├── bucket.tf  <== we are here
    │       ├── elasticsearch.tf
    │       ├── network.tf
    │       ├── sql.tf
    │       └── variables.tf
    ├── prod
    │   ├── main.tf
    │   ├── providers.tf
    │   └── variables.tf
    └── staging
        ├── main.tf
        ├── providers.tf
        └── variables.tf

```

Prenons l'exemple de la création d'un bucket Google Cloud Storage, il est courant d'avoir recours à un bucket pour les
développeurs ou les tests en local.

Nous hébergerons ce bucket sur l'environnement de staging afin de ne pas créer un environnement uniquement pour cela.

Ainsi, nous souhaitons créer 2 buckets sur l'environnement de **staging**.
- `bucket-dev`
- `bucket-staging`

Et 1 bucket sur l'environnement de **prod**.
- `bucket-prod`

Dans un seul fichier de configuration `/modules/shared/bucket.tf`

```hcl
# Bucket for staging or prod
resource "google_storage_bucket" "bucket_main" {
  name = "bucket-${var.env}"
  force_destroy = true
  location = var.region
  project = var.project
}

# Bucket for developers and tests
resource "google_storage_bucket" "bucket_dev" {
  count = var.env == "staging" ? 1 : 0
  name = "bucket-dev"
  force_destroy = true
  location = var.region
  project = var.project
}
```

Vous l'avez compris, nous allons utiliser le meta-argument `count`.

Grâce à une opération ternaire, nous allons spawn 1 ou 0 `bucket-dev` en fonction de l'environnement `staging` ou `prod`.

Attention, si vous souhaitez utiliser ce `bucket_dev` en référence. Il faudra s'y referrer comme un array :

- Si vous êtes dans le même bloc que le meta-argument : 
  
```hcl
google_storage_bucket.bucket_dev[count.index]
```

- Si vous êtes en dehors du bloc, il faudra spécifier l'index : 

```hcl
google_storage_bucket.bucket_dev[0]
google_storage_bucket.bucket_dev[*]
```

Plus d'information sur le meta-argument `count` ici : 

https://www.terraform.io/docs/language/meta-arguments/count.html
