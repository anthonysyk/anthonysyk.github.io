---
weight: 4
title: "RealTime Bike"
date: 2018-10-01T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: ""
comment: false
featuredImage: "/projects/realtimebike/preview.jpg"
---

Application permettant aux utilisateurs de consulter en temps réel la disponibilité des stations de vélos en France, afin de trouver facilement des vélos disponibles ou des places libres pour les déposer.

<!--more-->

## Projet

Projet permettant aux utilisateurs de consulter les données d'utilisation des vélos en France.
L'ingestion et le traitement en temps réel se fait avec Kafka Streams.

- Collecte de données en temps réel à partir de données issues de l'open data avec Kafka et Scala/Akka
- Stockage des données dans Cassandra et S3 avec **Kafka Connect**
- Agrégation, calcul de KPI temps réel et **fenêtrage** avec **Kafka Streams**
- Interrogation du state de Kafka Streams avec **Interactive Queries**

**Stack: Kafka, Kafka Stream, Interactive Queries, Scala, Docker, Cassandra**

## Architecture

![realtimebike-architecture-pretty.jpeg](/projects/realtimebike/realtimebike-architecture-pretty.jpeg)

## Produits

![realtimebike-carte.jpg](/projects/realtimebike/realtimebike-carte.jpg)
![realtimebike-charts-1.png](/projects/realtimebike/realtimebike-charts-1.png)
![realtimebike-charts-2.png](/projects/realtimebike/realtimebike-charts-2.png)
![realtimebike-city-charts.png](/projects/realtimebike/realtimebike-city-charts.png)
![realtimebike-realtimebike-tables.png](/projects/realtimebike/realtimebike-tables.png)
