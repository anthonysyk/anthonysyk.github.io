---
weight: 4
title: "REX | gRPC"
date: 2020-03-27T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: "Un framework RPC universel et performant"

tags: ["api"]
categories: ["architecture"]
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

gRPC est un framework **gratuit** et **open-source** permettant aux utilisateurs définir les REQUÊTES et les RÉPONSES pour du RPC (Remote Procedure Calls).

Il a été développé par Google et maintenu par la CNCF (Cloud Native Computation Foundation) au même titre que Docker, et Kubernetes.

gRPC est un framework **moderne**, de **faible latence** conseillé pour ses performances, et son effet catalyseur dans une architecture **micro-service**.

Il utilise le **protocole HTTP/2** pour le transport, est **language-independant**, supporte le **streaming**, et facilite l'intégration de **l'authentification**, le **load balancing**, le **logging**, et le **monitoring**.

<!--more-->

## Protocole RPC

RPC signifie Remote Procedure Calls que l'on pourrait traduire par **appel de fonction à distance**.

En effet, dans le code côté Client, cela revient à appeler une fonction directement sur le Serveur.

```
    // SERVER SIDE (any language)
    def CreateUser(user) {
        ...
    }
        
    // CLIENT SIDE (any language)
    ...
    server.CreateUser(user)
    ...
```

&nbsp;
&nbsp;
Par contre, derrière nous aurons bien un échange sur le réseau entre le Client et le Serveur.

{{< figure src="/posts/grpc/grpc-architecture.png" title="gRPC - Exemple d'architecture" >}}

Dans cet exemple, nous voyons bien l'interaction entre 1 serveur et 2 clients, développés dans des languages différents.

## Génération de code

Pour pouvoir supporter tous les languages, nous allons donc générer un SDK côté client et serveur.

gRPC propose un language et format de sérialisation pour définir le contrat d'API : **Protocol Buffers**.

{{< admonition type=quote title="Protocol Buffers - Google" details=false >}}
Protocol buffers are Google's language-neutral, platform-neutral, extensible mechanism for serializing structured data – think XML, but smaller, faster, and simpler. You define how you want your data to be structured once, then you can use special generated source code to easily write and read your structured data to and from a variety of data streams and using a variety of languages.
{{</ admonition >}}

Un fichier **.proto** fonctionne pour plus de 12 languages de programmation, et permet d'utiliser gRPC et de scaler jusqu'à plusieurs millions de RPC à la seconde.

L'avantage de la génération de code est :

- Support de (presque) tous les languages
- Documentation gratuite
- Design de l'API en amont (modèles de données, fonctionnalités)
- Moins de code à maintenir
- Gain de temps
- Très facile de brancher un nouveau micro-service (quelque soit le language)
- Permet de se concentrer sur le code fonctionnel du micro-service

{{< admonition type=note title="Note" details=false >}}
Il est également possible de générer du code côté client et serveur pour les API REST avec Swagger et du YAML.
{{< /admonition >}}

## Protocol Buffers vs JSON

- Protocol Buffers sérialise les messages sous un format binaire compact
- JSON est sous forme de texte human-readable
- Protocol Buffers est plus léger que JSON, ce qui réduit l'usage de la bande passante
- Protocol Buffers requiert moins de puissance pour être parsée, ce qui le rend plus performant pour les appareils mobiles

{{< admonition type=note title="Note" details=false >}}
Protocol Buffers défini des règles afin d'évoluer une API sans casser les client existants, ce qui est très utile pour des micro-services.
{{< /admonition >}}

## Types d'API dans gRPC

Il y a 4 types d'API dans gRPC :

- **Unary:** C'est le fonctionnement traditionnel avec une requête et une réponse (comme REST)
- **Streaming Server:** Le serveur répond au client en streaming (chunks de données, live feed, notifications)
- **Streaming Client:** Le client requête le serveur en streaming (chunks de données, backpressure)
- **Bi Directional Streaming:** Le client requête le client en streaming et le serveur répond au client en streaming (chat, long running connections, )

```proto
service GreetService {
    // Unary
    rpc Greet(GreetRequest) returns (GreetResponse) {};

    // Streaming Server
    rpc GreetManyTimes(GreetManyTimesRequest) returns (stream GreetManyTimesResponse) {};

    // Streaming Client
    rpc LongGreet(stream LongGreetRequest) returns (LongGreetResponse) {};

    // Bi Directional Streaming
    rpc GreetEveryone(stream GreetEveryoneRequest) return (steam GreetEveryoneResponse) {};
}
```

{{< admonition type=note title="Note" details=false >}}
En pratique, nous commençons d'abord par le type Unary, et nous ajoutons le streaming s'il y a des problèmes de performance.
{{< /admonition >}}

## Scalabilité

- Les serveurs gRPC sont asynchrones par défaut.
- Les clients gRPC peuvent être synchrones (bloquant) ou asynchrones en fonction du besoin.
- Les clients gRPC peuvent effectuer du client-side load balancing (horizontal scaling).
- gRPC permet de scale à plusieurs millions de RPCs par secondes

{{< admonition type=info title="À savoir" details=false >}}
Google gère plus de **10 milliards** de RPC par secondes avec gRPC.
{{< /admonition >}}

## Sécurité

gRPC intègre le protocole SSL/TLS ainsi qu'un système d'authentification (token-based) avec Google (uniquement pour se connecter à des services de Google).

## gRPC vs REST

| gRPC                                                               | REST                                          |
|--------------------------------------------------------------------|-----------------------------------------------|
| Protocol Buffers - binaire, léger, rapide                          | JSON - texte, lourd, lent (debugging facile)  |
| HTTP/2 (faible latence) - depuis 2015                              | HTTP1.1 (grande latence) - depuis 1997        |
| Bi-directionnel et Asynchrone                                      | Uni-directionnel et Synchrone                 |
| Streaming support                                                  | Requête/Réponse uniquement                    |
| API orienté (pas de contrainte, design libre)                      | Ressource orienté  - CRUD                     |
| Génération de code natif avec Protocol Buffers                     | Génération de code avec Swagger / Open API (en add-on)                |
| RPC based - On appelle la fonction sur le serveur à distance       | Verbes HTTP - Il faut coder la couche HTTP et/ou utiliser une librairie tierce                   |


Concernant le Benchmark, gRPC serait 25 fois plus rapide que REST

## Conclusion

L'argument de l'utilisation du protocole HTTP/2 suffit à lui seul à justifier le choix de gRPC.

Durant mes années de développement d'API REST, j'ai perdu énormément de temps en discussions d'équipe sur des sujets sans valeur ajoutée autour du nommage des routes par exemple.

Le framework gRPC permet réellement de réduire la charge de travail dans le développement d'API, et gère toute la partie ***mécanique*** pour nous.

Nous pouvons ainsi nous concentrer sur les vrais questions telles que les modèles de données, les fonctionnalités, le métier.
