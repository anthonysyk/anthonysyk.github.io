---
weight: 4
title: "REX | Feature Flipping en Scala"
date: 2018-11-22T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: ""

tags: ["scala"]
categories: ["code"]
hiddenFromHomePage: false

toc: true
autoCollapseToc: true
math: false
lightgallery: true
linkToMarkdown: true
comment: false
---

Le pattern **« feature flipping »** permet d’activer et désactiver des fonctionnalités directement en production, sans re-livraison de code.

<!--more-->

## Contexte
Dans le cadre de la **migration** d’un projets de MongoDB vers un PostgreSQL sur Google Cloud Platform avec une deadline courte, j’ai implémenté une fonction permettant d’abstraire le concept de Feature Flipping.

Le site web est massivement fréquenté, il est donc préférable d'effectuer le passage vers le système cible de manière progressive (en écrivant dans les deux bases de données).

En effet, il est nécessaire de pouvoir **switcher rapidement** vers l’ancien système en cas de problème sur la plateforme.

{{< admonition type=question title="Question" details=false >}}
Comment faire cohabiter deux systèmes pour migrer progressivement en limitant au maximum les cas non gérés en un temps record ?
{{< /admonition >}}

## Implémentation

###  Type Générique
Pour cela, j’ai d’abord utilisé un **type générique** qui représente une fonction prenant une unique entrée :

```scala
type FeatureFlippedFunction[I, O] = I => Future[O]
```

Ce type va nous permettre de définir d’une manière abstraite nos deux fonctions A et B.

Nous aurons ainsi une fonction ***« newFeatureFunction »*** et une fonction ***« oldFeatureFunction »*** ayant les même paramètres et la même sortie.

```scala
  def newFeatureFunction(input: String): Future[String] = Future(input.concat("_new"))

  def oldFeatureFunction(input: String): Future[String] = Future(input.concat("_old"))
```


### Fonction Générique

Finalement, il nous reste à appliquer l’algorithme que nous souhaitons utiliser, notamment dans le cas où la nouvelle fonction échoue.

Dans notre cas, nous souhaitons que si la nouvelle feature échoue, l’ancienne feature prenne le relais afin d’éviter toute interruption de service pour les utilisateurs.

```scala
  def handleFeatureFlipping[I, O](isFeatureActivated: Boolean, input: I)
                                 (newFeatureFonction: FeatureFlippedFunction[I, O])
                                 (oldFeatureFonction: FeatureFlippedFunction[I, O]): Future[O] = {
    if (isFeatureActivated)
      newFeatureFonction(input).recoverWith {
        case e =>
          logger.error(s"Error while applying new feature $name - switching to old feature - error: $e")
          oldFeatureFonction(input)
      }
    else oldFeatureFonction(input)
  }
```

Ici, la fonction ***« handleFeatureFlipping »*** prend en paramètre :

- un booléen indiquant s’il faut appliquer la nouvelle feature
- un **unique** input du type de notre choix
- la fonction de la nouvelle feature
- la fonction de l’ancienne feature

Cette fonction nous permet également de **centraliser** dans le code notre algorithme, ce qui améliore la **maintenabilité** de notre code.

### Résultat

Finalement, nous allons encapsuler tout cela dans une classe afin d’obtenir tous les éléments nécessaires.

```scala
class FeatureFlippingHelper(name: String) extends LazyLogging {

  type FeatureFlippedFunction[I, O] = I => Future[O]

  def handleFeatureFlipping[I, O](isFeatureActivated: Boolean, input: I)
                                 (newFeatureFonction: FeatureFlippedFunction[I, O])
                                 (oldFeatureFonction: FeatureFlippedFunction[I, O]): Future[O] = {
    if (isFeatureActivated)
      newFeatureFonction(input).recoverWith {
        case e =>
          logger.error(s"Error while applying new feature $name - switching to old feature - error: $e")
          oldFeatureFonction(input)
      }
    else oldFeatureFonction(input)
  }

}
```

### Exemple

Voici un exemple d’implémentation :

```scala
object FeatureFlippingTest extends App {
  def newFeatureFunction(input: String): Future[String] = Future(input.concat("_new"))
  def oldFeatureFunction(input: String): Future[String] = Future(input.concat("_old"))
  def newFeatureFunctionFailed(input: String): Future[String] = Future.failed(new NullPointerException)

  val featureHelper = new FeatureFlippingHelper("Migration Database")

  import scala.concurrent.duration._

  val test = featureHelper.handleFeatureFlipping(true, "toto")(newFeatureFunction)(oldFeatureFunction)

  println(Await.result(test, 1.minute))
}
```

## Conclusion
Cet utilitaire qui permet le **passage progressif** d’un système ancien vers un système plus récent (cloud par exemple) s’est révélé très utile.

Nous sommes maintenant capables de **tester** et **repérer** les bugs liés à la migration sur nos différents environnements en faisant cohabiter les systèmes :

|           | staging                       | production                           | 
|-----------|-------------------------------|--------------------------------------|
|  Ecriture | Cloud ET MongoDB              | Cloud ET MongoDB                     |
| Lecture   |  Cloud                        | MongoDB OU Cloud                             |
|  UX       | Résolution de bugs et tests   | Aucun changement pour l’utilisateur  |


{{< admonition type=tip title="Astuce" details=false >}}
A noter que cet utilitaire peut également être utilisé pour de l’A/B testing en passant en paramètre le résultat de votre règle d’A/B testing.
{{< /admonition >}}
```scala
object ABTesting extends App {
  def functionA(input: String): Future[String] = Future(input.concat("_testA"))
  def functionB(input: String): Future[String] = Future(input.concat("_testB"))

  val featureHelper = new FeatureFlippingHelper("A/B Testing concatenation on string")

  import scala.concurrent.duration._

  val test = featureHelper.handleFeatureFlipping(Random.nextBoolean(), "toto")(functionA)(functionB)

  println(Await.result(test, 1.minute))
}
```

Vous pouvez retrouver le code [ici](https://github.com/anthonysyk/versatile-library/blob/master/src/main/scala/versatile/featureflipping/FeatureFlippingHelper.scala).
