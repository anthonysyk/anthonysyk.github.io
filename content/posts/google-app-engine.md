---
weight: 4
title: "REX | Google App Engine"
date: 2019-01-16T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: ""

tags: ["devops", "infrastructure", "gcp"]
categories: ["cloud"]
hiddenFromHomePage: false

featuredImage: ""
featuredImagePreview: ""

toc: true
autoCollapseToc: true
math: false
lightgallery: true
linkToMarkdown: true
comment: false
---

Google App Engine (GAE) est une offre de Google Cloud Platform qui permet de déployer des applications sur le cloud en faisant abstraction de l’infrastructure, celle-ci étant gérée par Google.

<!--more-->

Elle permet ainsi aux développeurs de **se concentrer uniquement sur le code**, sans se soucier de la partie infrastructure.

GAE supporte nativement les langages suivants Java, Go, Node.js, Python et PHP, et met à disposition un SDK dans ces mêmes langages.

Les autres langages sont également supportés dans sa version flexible (sous forme d’applications dockerisées).

{{< admonition type=quote title="Google App Engine - Google" details=false >}}
Google App Engine est une plate-forme entièrement gérée et totalement indépendante de l’infrastructure, ce qui vous permet de vous consacrer exclusivement au code.
{{</ admonition >}}

## Contexte

Pour rappel, Google App Engine a été le premier service sur Google Cloud Platform (introduit en 2008). Même si aujourd’hui, il est moins populaire que l’offre Kubernetes Engine, elle reste la solution la plus aboutie de Google en tant que **solution clé en main**.

GAE est disponible dans deux versions, **standard** et **flexible**, qui comme leur nom l’indique permet d’avoir plus ou moins de liberté dans le développement et les interactions de nos applications.

Cependant quelque soit la version utilisée, GAE se charge du **déploiement**, du **service** et du **scaling** de l’infrastructure.

## Version standard

La version standard ne supporte que certains langages : Java, Go, Node.js, Python et PHP.

Vos applications seront exécutées grâce à l’un des environnements d’exécution (runtime environment) natif de GAE uniquement dans les langages cités ci-dessus.

L’application tourne dans une sandbox qui limite notre application :

- Impossible d’écrire sur disque
- Limitation des librairies utilisables (white-list)
- Utilisation du CPU et de la mémoire

Certains services de App Engine ne sont disponibles que dans la version standard :
- Service d’image GAE
- Service de mail GAE
- Service de search GAE

## Version flexible

La version flexible met à disposition des VMs sur lesquelles nous pouvons déployer nos applications dockerisées donc dans le langage de notre choix.

Ceci permet de faire du debugging directement sur les VMs en SSH.

La plupart des limitations de la version standard sont ainsi levées, cependant nous perdons certains services de GAE (image, mail et search).

Disponible uniquement en version flexible :

- Toutes les limitations de la version standard qui sont levées
- Google Cloud Endpoint
- Perte de certains services de App Engine

## Comment choisir la bonne version ?

La version standard est propice aux applications web **légères**, **stateless**, et qui répondent rapidement aux requêtes HTTP en raison des différentes limitations de l’environnement standard (limitation CPU, mémoire, écriture disque, librairies, third party services).

Pour des applications plus lourdes, avec beaucoup de trafic, et qui nécessite l’**utilisation de services tiers**, la version flexible est la plus appropriée.

Voici les points à considérer dans le choix de la version :

### Tarification
La version standard est conçue pour être très peu coûteuse voire gratuite, de plus lorsqu’il n’y a aucun trafic sur l’application, aucune instance n’est allouée (gratuit).

En revanche, il faut au minimum 1 instance dans la version flexible.

### Portabilité
Une application qui tourne sur la version flexible peut facilement être déployée dans un autre environnement (Compute Engine ou Kubernetes Engine) à l’inverse de la version standard.

### Accès au fonctionnalités Google App Engine
Les services d’image, de mail et de recherche de GAE ne sont disponibles que dans la version standard.

### Protection de l’API
Le service Cloud Endpoint, qui permet notamment de protéger des API, n’est compatible qu’avec la version flexible pour le moment.

|                 | Version Standard      |  Version Flexible    |
|-----------------|-----------------------|----------------------|
| Languages       |  Java, Go, Node.js, Python et PHP | Tous  |
| Tarification    | Gratuite  | Payante  |
| Portabilité     |  Limitée à App Engine |  Facilement portable sur un autre environnement | 
| Fonctionnalités App Engine | Accès total  | Accès limité  |
| Protection de l’API  | Aucune  | Cloud Endpoint  |

## Bilan
Après avoir déployé notre application GAE, voici les points qui ont attiré notre attention :

### Inconvénients
Application exposée uniquement via une URL publique
Certains services de Google ne sont disponibles que dans la version standard ou flexible (ce qui rend le choix entre les deux environnements très compliqués, et nécessite des compromis)
Ne supporte pas les websockets pour le moment

### Avantages
Aucune infrastructure à gérer
Allocation dynamique d’instances en fonction du trafic
Gestion du protocole HTTPS
On se concentre uniquement sur le code
Le déploiement est simple (une seule commande)

## Quelque pièges
- Les services d’image, search, mail ne sont disponibles qu’en version standard
- Le Cloud Endpoint n’est disponible que dans la version flexible
- Il ne peut y avoir qu’un seul App Engine par projet, mais il est possible de créer plusieurs micro-services grâce à la fonctionnalité services
- Attention à la région, une fois la région sélectionnée pour un projet, il n’est plus possible de la modifier.

**Globalement App Engine est une très bonne offre, le déploiement est très simple, et on peut effectivement se concentrer sur le code sans la partie infra.**
