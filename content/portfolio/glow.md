---
weight: 4
title: "Figaro Classifieds - Data Warehouse Job Offers"
date: 2022-11-22T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: ""
comment: false
featuredImage: "/projects/glow/preview.png"
---

Ingestion des offres d'emplois de plus de 100 sources différentes. Les offres sont ensuite mises au format générique, puis nettoyées, enrichies et enfin distribuées aux différents job boards.
Soit plus de 1,5 million d'offres, avec une base de données traitant 12 millions de lignes par jour et générant 11 millions d'offres uniques par an.

<!--more-->

Figaro Classifieds, filiale du Groupe Figaro, est le leader français des annonces en ligne, avec 60 M€ de chiffre d'affaires et plus de 9 millions de visiteurs uniques. Grâce à la puissance et à la notoriété du Groupe Figaro, elle touche chaque mois 3 internautes sur 4 en France.

## Mission : Data Warehouse Job Offers

Dans le but de centraliser les offres d'emploi du catalogue de Figaro Classifieds, nous avons mis en place plusieurs pipelines d'ingestion d'offres d'emploi provenant de plus de 100 sources différentes, avec des méthodes de configuration variées (FTP, HTTPS, pagination, stockage de type blob, API). Les étapes clés de notre processus sont les suivantes :

- **Enrichissement des offres :** Les offres sont enrichies pour les rendre éligibles sur nos différents job boards d'entreprise tels que Figaro Emploi, Cadremploi, Choose Your Boss, Keljob et GoldenBees. Chaque job board peut configurer ses propres règles d'éligibilité pour les offres d'emploi.
- **Distribution des offres :** Une fois enrichies, les offres sont distribuées aux différents job boards à l'aide de PubSub.
- **Dashboard de monitoring :** Nous disposons d'un tableau de bord qui permet d'explorer et d'identifier les offres nécessitant une intervention humaine. Les actions entreprises sont les suivantes :
  - Demande au recruteur de fournir les informations manquantes
  - Ajout des nomenclatures manquantes
  - Explication aux clients concernant l'absence de leurs offres sur le job board
  - Tracking de l'offre depuis l'ingestion jusqu'à sa publication sur le job board
- **Relance à la demande :** Les opérationnels ont la possibilité de relancer une ingestion à la demande via notre backoffice.
- **Contrôle de la qualité des données :** Nous assurons la qualité des données grâce à des annotations intégrées à nos systèmes, qui permettent de tracer comment chaque offre a été enrichie.

En suivant cette approche, nous sommes en mesure de centraliser les offres d'emploi, de les rendre éligibles sur nos différents job boards, d'identifier les offres nécessitant une intervention humaine et de garantir la qualité des données.

## Architecture

![glow-architercture](/projects/glow/0-glow-architecture.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;

## Reporting journalier

![figaroemploi](/projects/glow/1-daily-report.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;
![figaroemploi](/projects/glow/2-error-report.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;

## Monitoring des ingestions

![figaroemploi](/projects/glow/3-ingestion-a-la-demande.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;

## Explorateur d'offres

![figaroemploi](/projects/glow/4-explorateur-offres.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;

## Comparaison de l'offre à différentes étapes de l'enrichissement

![figaroemploi](/projects/glow/5-comparaison-source-offre-generique.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;

## Orchestration avec Airflow

![figaroemploi](/projects/glow/6-glow-airflow-dags.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;

![figaroemploi](/projects/glow/7-glow-airflow-full-details.png)
&nbsp;
&nbsp;
&nbsp;
&nbsp;


