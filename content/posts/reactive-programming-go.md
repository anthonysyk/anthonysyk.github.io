---
weight: 4
title: "REX | Reactive Programming en Go"
date: 2022-12-25T13:19:06+02:00
author: "Anthony SSI YAN KAI"
description: "Programmation réactive en Go grâce à la librairie RxGo"
tags: ["go", "reactive programming", "RxGo"]
categories: ["code"]
hiddenFromHomePage: false
toc: true
autoCollapseToc: true
---

La programmation réactive vise à créer des applications qui sont performantes, robustes et faciles à maintenir en utilisant des principes tels que la réactivité, la concurrence, l'asynchronisme, le backpressure. 

<!--more-->

Elle peut être utilisée dans de nombreux domaines, tels que les applications Web, les applications mobiles, les systèmes de bases de données et les pipelines data.

Elle se base sur l'utilisation de séquences (stream) de données qui évoluent au fil du temps, appelées "observables", qui permettent de représenter les flux de données en temps réel.

Des opérations vont être appliquées sur ce stream de données : transformation, filtrage, combinaison, agrégation avec une gestion du débit grâce des stratégie de backpressure (buffer, rate limit)

Elle facilite la **lisibilité**, la **maintenabilité** et la **testabilité** du code en fournissant une API fonctionnelle (map, flatMap, etc ...) pour abstraire certaines mécaniques telles que la concurrence, l'asynchronisme, le backpressure qui peut vite complexifier le code.

## Avantages de la programmation réactive :

### Amélioration de la performance: 
La programmation réactive permet de traiter les événements de manière asynchrone, ce qui peut réduire les temps de latence et améliorer les performances de l'application.

### Gestion efficace des erreurs: 
La programmation réactive permet de gérer les erreurs de manière centralisée et de réagir de manière appropriée lorsqu'elles se produisent.

### Gestion du débit (backpressure) :
Le backpressure en programmation réactive permet de contrôler le débit des données entre les producteurs et les consommateurs, évitant ainsi les problèmes de surcharge et de goulot d'étranglement en ajustant dynamiquement le rythme de traitement des données.

{{< admonition type=tip title="Astuce" details=false >}}
Par exemple, le backpressure est très important lors de l'indexation de données dans ElasticSearch, car ce dernier peut perdre de la donnée si le volume ingéré est trop lourd.
{{< /admonition >}}

### Code plus facile à comprendre:
La programmation réactive peut rendre le code plus facile à comprendre en découpant les tâches en flux de données distincts qui sont traitées de manière indépendante.

{{< admonition type=note title="Note" details=false >}}
Cela permet au développeur de se concentrer sur le code fonctionnel et moins sur le code technique (gestion de l'asynchrone, concurrence, etc ...)
{{< /admonition >}}

### Meilleure utilisation des ressources: 
La programmation réactive peut aider à optimiser l'utilisation des ressources en ne traitant que les données nécessaires et en évitant les calculs inutiles.

{{< admonition type=note title="Note" details=false >}}
Il est alors possible de calibrer son infrastructure pour traiter une taille de stream bien définie.
{{< /admonition >}}

## Implémentation en Golang : RxGo

Pour utiliser la programmation réactive, vous avez besoin d'un framework ou d'une bibliothèque qui prend en charge la création et la manipulation d'observables.

Il existe de nombreuses options disponibles, telles que Akka Streams pour Scala, RxJava pour Java, RxJS pour JavaScript et RxGo pour Go.

Nous allons nous intéresser dans cet article à son implémentaton en Go.

RxGo est une librairie open source développée en Go qui permet de travailler avec les observables. 

Les observables sont une façon de représenter des séquences de valeurs au fil du temps. 

Ils sont souvent utilisés dans les applications de programmation réactive, qui sont conçues pour réagir de manière efficace et performante aux événements en temps réel.

### Exemple

Voici un exemple de code Go qui utilise la librairie RxGo pour créer un observable qui émet des entiers de 1 à 4, puis utilise l'opérateur Map pour transformer chaque valeur en son carré, et l'opérateur Filter pour ne retenir que les valeurs paires:

![rx.png](/posts/golang/rx.png)

```go
import (
	"fmt"
	"time"
	"github.com/reactivex/rxgo/v2"
)

func main() {
    // Créer une source observable à partir d'une slice de nombres
    numbers := []int{1, 2, 3, 4}
    observable := rxgo.Just(numbers)()
    
    // Appliquer l'opérateur Map pour transformer chaque valeur en son carré.
    mappedObservable := observable.Map(func(ctx context.Context, i interface{}) (interface{}, error) {
        return i.(int) * i.(int), nil
    })
    
    // Appliquer l'opérateur Filter pour ne retenir que les valeurs paires.
    filteredObservable := mappedObservable.Filter(func(i interface{}) bool {
        return i.(int)%2 == 0
    })
    
    // Parcourir l'observable filtré pour recevoir les valeurs.
    for item := range filteredObservable.Observe() {
        fmt.Println(item.V)
    }
}
```

Cela imprimera les valeurs 4 et 16, qui sont les carrés des nombres pairs de 1 à 5.

Vous pouvez également utiliser d'autres opérateurs pour contrôler la façon dont les valeurs sont émises, tels que `Buffer`, `Debounce` et `Throttle`. 

Vous pouvez également utiliser des opérateurs pour transformer et filtrer les valeurs émises par l'observable, tels que `Map`, `Filter` et `Reduce`.

La librairie RxGo offre un large éventail d'opérateurs et de fonctionnalités pour vous aider à travailler avec les observables de manière efficace. 

Voici quelques exemples d'opérateurs et de fonctionnalités que vous pouvez utiliser avec RxGo:

### Opérateurs de transformation

Ces opérateurs permettent de transformer les valeurs émises par l'observable en une autre forme. 

Par exemple, vous pouvez utiliser l'opérateur `Map` pour transformer chaque valeur en son carré, ou l'opérateur `FlatMap` pour transformer chaque valeur en un nouvel observable.

### Opérateurs de filtrage

Ces opérateurs permettent de filtrer les valeurs émises par l'observable en fonction de critères spécifiques. 

Par exemple, vous pouvez utiliser l'opérateur `Filter` pour ne retenir que les valeurs paires, ou l'opérateur `Take` pour ne retenir que les N premières valeurs.

### Opérateurs de combinaison

Ces opérateurs permettent de combiner plusieurs observables en un seul. 

Par exemple, vous pouvez utiliser l'opérateur `Merge` pour combiner deux observables en un seul, ou l'opérateur `Zip` pour combiner les valeurs de deux observables en fonction de leur indice.

### Opérateurs d'agrégation

Ces opérateurs permettent de réduire les valeurs émises par l'observable à une seule valeur finale. 

Par exemple, vous pouvez utiliser l'opérateur `Reduce` pour calculer la somme de toutes les valeurs émises, ou l'opérateur `Count` pour compter le nombre de valeurs émises.

## Conclusion 

En utilisant ces opérateurs et fonctionnalités, vous pouvez créer des observables personnalisés qui répondent à vos besoins spécifiques et qui sont faciles à maintenir et à mettre à jour.

La gestion du débit (backpressure) ajoute un vrai avantage, surtout lorsque l'on contrôle le producteur de données.

{{< admonition type=tip title="Astuce" details=false >}}
Lorsque l'on ne contrôle pas le producteur de données, il est préférable de passer par un système message queue comme PubSub puis de consommer la donnée à son rythme on souscrivant au topic PubSub.
{{</ admonition >}}

Vous pouvez en apprendre davantage sur ces opérateurs et fonctionnalités en explorant la documentation de RxGo ou en explorant les exemples de code disponibles sur le site Web de la librairie.

## Sources

- https://github.com/ReactiveX/

- https://go.dev/blog/pipelines

- https://stackoverflow.com/questions/69697796/what-is-the-difference-between-rate-limiting-and-back-pressure

- https://medium.com/@jayphelps/backpressure-explained-the-flow-of-data-through-software-2350b3e77ce7

