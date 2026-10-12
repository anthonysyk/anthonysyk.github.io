---
title: REX | Kafka - Replay
date: 2018-12-30
summary: Ingestion de donnée depuis une source tierce instable
tags:
  - scala
  - kafka
  - big data
categories:
  - architecture
  - big data
---

Dans le cadre d'un projet sourcé depuis l'open data, j'ai mis en place un système d'ingestion de donnée permettant de **gérer les éventuels changement de schémas** ou un **breaking change** de la source **tierce** qui est **instable**.

<div class="admonition admonition-question">
<p class="admonition-title">Question</p>

Comment gérer les **breaking changes** des sources de données tierces ?

</div>

## Architecture

![/posts/kafka-source-tierce/architecture.jpeg](/posts/kafka-source-tierce/architecture.jpeg)

## Implémentation

### Stockage brut et structuré

Le topic des events **brut** permet de garder la donnée **chez nous**, elle pourra ainsi être rejouée.

Le topic des events **structurés** pourra être consommé directement par les autres services.

Nous allons enrichir notre event avec des **métadonnées** pour tracer sa provenance, le type d'erreur, le type d'event, la date, et l'offset dans le topic structuré si le schéma est valide.

Voici un exemple de métadonnées pour un event brut :

```scala
object ErrorType extends Enumeration {
  val Network, Schema = Value
}

object Source extends Enumeration {
  val ThirdParty, ReplayNetwork, ReplaySchema, ReplayOverwrite = Value
}

case class RawRecord(
	            source: Source,
	            event_type: EventType,
		    error_type: Option[ErrorType],
		    error_payload: Option[String],
		    event_timestamp: Long,
		    readable_date: String,
	            offset: Option[Long],
                    event_id: String,
	            value: String
                    ) {
  val key = RawRecord(event_timestamp, event_id)
  val value: RawRecord = this

  def toRecord[K](topic: String): ProducerRecord[GenericRecord, GenericRecord] =
    new ProducerRecord[GenericRecord, GenericRecord](topic, RawRecord.format.to(key), RawRecord.format.to(value))
}
```

### Validation
- Le premier cas à gérer est celui ou le **service tiers est indisponible**
- Le second cas à gérer est celui ou le **schéma est invalide**

Il est important d'identifier les différents types d'erreurs possibles en séparant au minimum les erreurs nécessitant une **intervention humaine** (modification du schéma) ou un **retry automatique** :

- Service non disponible (retry)
- Erreur de schéma (nécessite une intervention humaine)


### Service de Replay

Un service de replay nous permettra de rejouer nos events deux 2 façons :

- Service tiers indisponible : nous allons effectuer un appel à la source tierce pour récupérer les events manqués, et les rejouer avec la source : **ReplayNetwork**
- Schema invalide : nous allons adapter le schéma existant rejouer les events avec la source: **ReplaySchema**

Nous allons ainsi pouvoir rejouer les events depuis le **topic raw** pour de la **donnée récente** (en fonction de durée de rétention) ou depuis la **base de donnée** pour de la **donnée plus ancienne**.

<div class="admonition admonition-note">
<p class="admonition-title">Note</p>

Un endpoint pourra être mis en place afin de lancer un **replay** à la demande (après un fix du schéma par exemple).

</div>

## Cas d'usage

![Realtime Bike - Kafka Streams](/posts/realtime-bike/charts-3.webp)

Les données de l'application [Realtime Bike](http://realtime-bike.fr) étant basée sur de l'open data, le schéma change régulièrement sans avertissement.

Il est donc indispensable d'avoir un système limitant la perte de donnée et permettant le replay des events.
