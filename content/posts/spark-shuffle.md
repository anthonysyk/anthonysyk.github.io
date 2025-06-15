---
weight: 4
title: "REX | Spark - Shuffle"
date: 2017-08-15T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: "Le shuffle dans Apache Spark est le processus de répartition des données entre les différents noeuds d'un cluster pour permettre le traitement en parallèle lors de l'exécution d'une opération de transformation ou d'action sur un RDD (Resilient Distributed Dataset)"

tags: ["scala", "spark", "big data"]
categories: ["big data"]
hiddenFromHomePage: false

toc: true
autoCollapseToc: true
math: false
lightgallery: false
linkToMarkdown: true
comment: false
---
Certaines opérations dans Spark déclenchent un événement appelé **shuffle**. 

Le shuffle est le mécanisme de Spark pour **redistribuer les données** afin qu'elles soient **regroupées différemment entre les partitions**. 

Cela implique généralement la **copie des données entre les exécuteurs et les machines**, ce qui fait du shuffle une **opération complexe et coûteuse**.

<!--more-->

{{< admonition type=note title="Règle générale" details=false >}}
On dit qu'un RDD qui lors de sa transformation dépend d'un autre de ses éléments ou de l'élément d'un autre RDD, celle-ci provoque du shuffle.

Il faut réduire autant que possible la communication réseau (qui provoque de la latence) et rallonge la durée de traitement d'un job Spark.
{{< /admonition >}}

## Les différents types de transformations

### Narrow Dependencies

Ce type de transformation est rapide, car il ne nécessite **pas de shuffle**.

Chaque partition du RDD parent est utilisé au maximum d'une seule et unique partition du RDD enfant

- map, flatMap, mapValues, flatMapValues
- filter
- join (si le RDD parent est partitionné comme l'enfant)
- mapPartitions, mapPartitionsWithIndex

### Wide Dependencies

Ce type de transformation passe par du **shuffle de donnée sur le réseau**. 

Chaque partition du RDD parent peut être utilisée par une ou plusieurs partitions du RDD enfant

- cogroup, groupWith
- join (si le RDD parent n'est pas partitionné comme l'enfant)
- leftOuterJoin, rightOuterJoin, intersection
- groupByKey, reduceByKey, combineByKey
- distinct
- repartition, coalesce

## Problématiques du distribué

Le paradigme du distribué introduit 2 problématiques par rapport aux systèmes classiques :

- **Échec partiel:** crash d'un sous-ensemble de machines impliquées dans un calcul distribué.
- **Latence:** certaines opérations ont une plus grande latence que d'autres à cause de la communication réseau.

Heureusement pour nous, Spark gère très bien ces deux problèmes.

## En pratique

Il y a un impact dans la manière de programmer un job afin de réduire au maximum la latence.

### Cas d'école: reduceByKey vs groupByKey

L'exemple du reduceByKey vs groupByKey est le plus connu.

Le ***groupByKey*** consiste à :
- effectuer le groupByKey sur le volume de donnée initial (gros shuffle)
- puis à réduire les éléments


Le ***reduceByKey*** consiste à :
- réduire les éléments une première fois dans chaque machine (mapper side first)
- effectuer le groupByKey sur un volume de donnée réduit (petit shuffle)
- réduire une deuxième fois après le shuffle

La communication réseau (latence), étant l'opération la plus longue et la plus coûteuse **```(network > disk > memory)```**, le ***reduceByKey*** est l'opération qui transite le moins de données sur le réseau.

{{< admonition type=note title="Règle générale" details=false >}}
En réduisant d'abord l'ensemble de données, nous pouvons réduire la quantité de données envoyées sur le réseau pendant le shuffle, ce qui rend améliore significativement les performances.
{{< /admonition >}}

```scala
case class Fruit(name: String, price: Double)

val data: RDD[Fruit] = sc.sparkContext.parallelize(
  Seq(Fruit("banana", 1.5), CourseFruit("apple", 1), CourseFruit("pear", 1.5), CourseFruit("banana", 2))
)

data.map(fruit => fruit.name -> fruit.prix)
  .groupByKey()
  .map(prices => prices._2.size -> prices._2.sum)

data.map(fruit => fruit.name -> (1 -> fruit.price))
  .reduceByKey((a, b) => (a._1 + b._1) -> (a._2 + b._2))
```

### Debug

Pour vérifier le type de dépendance d'un RDD (narrow ou wide):
```scala
val wordsRdd = sc.parallelize(largeList)
val pairs = wordsRdd.map(c => (c, 1))
  .groupByKey()
  .dependencies

// pairs: Seq[org.apache.spark.Dependency[_]] =
// List(org.apache.spark.ShuffleDependency@4294a23d)
```

Pour afficher l'héritage du RDD (vérifier si un RDD a été conçu avec du shuffle ou non):
```scala
val wordsRdd = sc.parallelize(largeList)
val pairs = wordsRdd.map(c => (c, 1))
  .groupByKey()
  .toDebugString

//pairs: String =
//(8) ShuffledRDD[219] at groupByKey at <console>:38 []
// +-(8) MapPartitionsRDD[218] at map at <console>:37 []
// | ParallelCollectionRDD[217] at parallelize at <console>:36 []
```


## Conclusion

Le shuffle est un principe important à garder à l'esprit lorsque l'on développe sur un système distribué.
