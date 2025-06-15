---
weight: 4
title: "LEARN | Golang - Concurrence"
date: 2019-03-20T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: "La concurrence signifie que plusieurs calculs se produisent en même temps"

tags: ["golang"]
categories: ["code"]
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

L'un des avantages de Golang est le support natif du language pour la concurrence. Dans la plupart des autres languages, il est nécessaire d'utiliser une librairie externe pour assurer cette fonction.

<!--more-->

## Théorie

### Parallélisme

C'est lorsque deux tâches s'exécutent **en même temps**. 

Il est **obligatoire** pour cela d'avoir du matériel hardware **répliqué :**

- Soit plusieurs machines
- Soit une même machine avec un processeur multi-coeurs

### Concurrence

C'est lorsque deux tâches ont **un début et une fin qui se chevauchent** mais ne s'éxécutent **pas forcément en même temps**.

{{< admonition type=note title="Note" details=false >}}
Deux tâches exécutées **en parallèle** sont **concurentes**.
{{</ admonition >}}

Il est possible d'éxécuter une tâche en concurrence sur **un seul coeur**.

![Concurrency Versus Parallelims](/posts/golang/concurrency.png)

### Concurrent Programming

Le **concurrent programming** consiste à indiquer au programme comment se répartir sur les différents coeurs

- Le programmeur défini quelles tâches **peuvent** être exécutées en parallèle
- C'est ensuite **l'OS et Go runtime scheduler** qui vont **paralléliser ou non** la tâche (hardware mapping)

### Pourquoi utiliser la concurrence ?

La concurrence améliore les performances.

- Réduction de la **hidden latency:** une tâche peut s'exécuter pendant qu'une autre attend (accès mémoire)

{{< admonition type=note title="Note" details=false >}}
La durée d'accès à la mémoire est considérée comme un **performance bottleneck** (von Neumann bottleneck)
{{</ admonition >}}

### Définitions

- **Process:** c'est une instance d'exécution d'une application (par exemple un process qui fait tourner votre navigateur).
- **Thread:** c'est comme un process mais plus léger, il peut faire tout ce qu'un process fait

Un **process** peut contenir **plusieurs threads**.

Le passage d'un process à un autre s'appelle le **context switch** pendant lequel le **state** du process va être **sauvegardé** le temps que l'autre process s'éxécute.

Le thread lui **partage le state de son process**. La concurrence entre threads sera donc plus rapide et plus performante pour des petites tâches.

## Goroutines

Les **goroutines** agissent comme des **threads** dans l'application Go. 

C'est encore une division: un process a plusieurs threads et un thread qui a plusieurs go routines.

Ces goroutines vont être schedulées par le **Go Runtime Scheduler** afin de gérer la concurrence.

{{< admonition type=note title="Note" details=false >}}
La fonction `main()` est une goroutine. 

Lorsque la goroutine `main()` se termine, toutes les goroutines se terminent aussi.
{{</ admonition >}}

### Interleavings

Prenons deux tâches qui ont 3 instructions chacunes :

- 1A, 1B, 1C
- 2A, 2B, 2C

Ces deux tâches exécutées en concurrence pourront donner plusieurs **interleavings:**

- 1A, 1B, 1C, 2A, 2B, 2C
- 1A, 2A, 1B, 2B, 1C, 2C
- ...

L'odre des instructions est donc inconnu et **non déterministe.**

{{< admonition type=note title="Note" details=false >}}
En programmation, il faut éviter d'avoir un résultat qui dépend d'un facteur **non-déterministe.**

Nous souhaitons avoir le **même résultat à chaque fois**.
{{</ admonition >}}

### Race Condition

Lorsqu'un programme dépend de l'ordre des instructions entre deux tâches (interleavings), nous avons un problème de **race condition.**

Cela signifie que **le résultat** de ce programme **dépendra** de **l'ordre** dans lequel s'exécute les instructions.

Il existe des techniques permettant d'éviter ce problème.

## Synchronisation

La synchronisation des goroutines en Go est essentielle pour garantir la cohérence et la sécurité dans les applications concurrentes.

Voyons les principaux mécanismes de synchronisation.

### Mutex

L'accès et l'écriture sur les variables partagée ne peux pas être ***interleaved***, pour cela on utilise la **Mutual Exclusion.**

`sync.Mutex` assure la **mutual exclusion** grâce à un **système de vérrouillage** sur la variable (ou sémaphore binaire).

- `Lock()` va vérouiller la variable, si une goroutine essaie d'accéder à cette variable déjà vérouillée, elle sera bloquée.
- `Unlock()` va dévérouiller la variable, la goroutine qui était bloquée via `Lock()` pourra à son tour accéder à la variable.

```go
    var i int = 0
    var mut sync.Mutex
    
    func inc() {
      mut.Lock()
      i = i + 1
      mut.Unlock()
    }
```

### WaitGroup

`sync.WaitGroup` oblige une goroutine à attendre les autres goroutines.

Il s'agit tout simplement d'un **compteur**:

- `Add()` On **incrémente** le compteur pour chaque goroutine à attendre
- `Done()` On **décrémente** le compteur pour chaque goroutine qui se termine
- `Wait()` La goroutine qui attend est bloquée jusqu'à ce le **compteur est à 0**

```go
    func worker(id int, wg *sync.WaitGroup) {
      defer wg.Done()
    
      fmt.Println("Starting worker")
      time.Sleep(time.Second)
      fmt.Println("Worker completed")
    }
    
    func main() {
      var wg sync.WaitGroup
    
      wg.Add(1)
      go worker(&wg)
    
      // blocks until above goroutine completes 
      wg.Wait()
      fmt.Println("Main Goroutine Completed")
    }
```

### Semaphore

Un sémaphore est un mécanisme de synchronisation qui permet de contrôler l'accès concurrent à des ressources partagées. 

Il agit comme un compteur flexible pour gérer les goroutines en fonction de la capacité définie :

- `Acquire()` permet d'acquérir une unité de capacité du sémaphore. Si le sémaphore est plein, la goroutine attend jusqu'à ce qu'une unité devienne disponible.
- `Release()` permet de libérer une unité de capacité du sémaphore, ce qui permet à une autre goroutine d'acquérir cette unité.

```go
package main

import (
	"fmt"
	"sync"
	"golang.org/x/sync/semaphore"
)

func main() {
	// Créer un sémaphore avec une limite de 5.
	sem := semaphore.NewWeighted(5)
	var wg sync.WaitGroup

	// Lancer deux goroutines qui acquièrent le sémaphore.
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			fmt.Printf("Goroutine %d: En attente d'acquisition du sémaphore\n", id)
			sem.Acquire(context.TODO(), 1)
			defer sem.Release(1)
			fmt.Printf("Goroutine %d: Acquis le sémaphore\n", id)
		}(i)
	}

	// Attendre que toutes les goroutines se terminent.
	wg.Wait()
	fmt.Println("Toutes les goroutines ont terminé.")
}
```

Le sémaphore est utilisé pour contrôler le niveau de parallélisme.

{{< admonition type=note title="Note" details=false >}}
Il est possible d'implémenter son propre sémaphore avec un channel. 
Mais il est préférable d'utiliser la version "golang.org/x/sync/semaphore" qui est standardisée et connue de tous les développeurs.
{{</ admonition >}}

## Channels
La communication entre goroutines se fait par des channels.

Un channel permet de transférer des données entre goroutines :

- Les channels sont typés
- On initialise un channel: `c := make(chan int)`
- Envoi de données: `c <- 3`
- Réception de données: `x := <- c`

### Unbuffered Channels

Les channels sans buffer ne peuvent **pas garder la donnée en transit,** ce qui signifie qu'ils sont **bloquants** jusqu'à ce que la donnée soit consommée ou envoyée.

- L'envoi **bloque** la goroutine tant que la donnée en transit n'est pas consommée
- La réception **bloque** la goroutine tant que la donnée en transit n'est pas envoyée

```go
    func main() {
    	c := make(chan int)
    	
      // task 1 is blocked until task 2 receives the data
    	go func() {
    	  c <- 1
    	}()
    	
      // task 2 blocks task 1 until it received the data
    	go func() {
    	  time.Sleep(time.Hour)
    	  x := <- c
    	}()
    }
```

{{< admonition type=tip title="Astuce" details=false >}}
C'est également une autre façon de synchroniser les goroutines, puisqu'elles doivent s'attendre à travers cet unbuffered channel. 
{{</ admonition >}}

### Buffered Channels

Les channels peuvent garder un nombre d'objets en transit (par défaut 0 = unbuffered), c'est la **capacité**. 

`c := make(chan int, 3)`

- L'envoi bloque la goroutine que si le ***buffer*** est **rempli**
- La réception bloque la goroutine que si le ***buffer*** est **vide**

{{< admonition type=example title="Exemple" details=false >}}
Un serveur verse de l'eau dans un verre, le serveur s'arrête quand le verre est plein, et le client va boire avec une paille mais s'arrête quand le verre est vide.
{{</ admonition >}}

L'intérêt du buffer est de permettre au **producteur** et au **consommateur** de produire et consommer **à leur rythme** (backpressure/throttling).

### Blocking Channels

Il est possible de bloquer la goroutine `main()` de cette façon :

```go
func main() {
    
    waitc := make(chan struct{})

  go func() { 
    fmt.Println("Task 1 started")
    time.Sleep(time.Second)
    fmt.Println("Task 1 ended")
  }()
    
  go func() {
    fmt.Println("Task 2 started")
      time.Sleep(2 * time.Second)
    fmt.Println("Task 2 ended")
        close(waitc)
  }

  <- waitc
}
```
{{< admonition type=warning title="Avertissement" details=false >}}
Il ne faut pas oublier d'appeler `close(waitc)` pour débloquer la goroutine `main()`
{{</ admonition >}}

### Itération sur channel

Un cas fréquent d'itérer sur un channel afin de traiter toutes les données dans une boucle.

```go
    // producer
    go func() {
    	for i := 1; <= 10; i++ {
        c <- i
      }
    	close(c)
    }
    
    // consumer
    go func() {
    	for i:= range c {
    	  fmt.Println(i)
    	}
    }
```

Lorsque le **sender** n'a plus de données à traiter, il peut fermet le channel pour indiquer au **receiver** qu'il peut arrêter d'itérer `close(c)`

#### Select

`select` permet à une goroutine d'attendre parmi plusieurs opérations de channels.
La goroutine sera bloquée jusqu'à ce que l'un des cas puisse s'exécuter, puis il exécute ce cas. 

```go
    select {
      case a = <- c1:
        fmt.Println(a)
      case b = <- c2:
    		fmt.Println(b)
    }
```

{{< admonition type=note title="Note" details=false >}}
Si plusieurs channels sont prêts, le select en choisi un au hasard.
{{</ admonition >}}

Il est également possible de sélectionner une opération `send` ou `receive`.

```go
    select {
      case a = <- inchan:
        fmt.Println("Received a")
    	case outchan <- b:
    		fmt.Println("Sent b")
    }
```

Ces deux cas sont bloquants, et le premier cas qui arrive sera executé.

#### Default Select

Il est possible d'avoir une opération par défaut afin **d'éviter de bloquer.**

#### Abort Channel

Il est possible d'abandonner l'exécution d'une boucle for grâce à un channel `abort` dans un `select`.

```go
    abortc := make(chan struct{})
    
    for {
    	select {
    		case a:= <- c:
    			fmt.Println(a)
    		case <- abortc:
    			return
    	}
    }
```

{{< admonition type=note title="Note" details=false >}}
Ce pattern est très utile dans le cas ou l'on veut recevoir de la donnée jusqu'à ce que le signal `abort` est reçu.
{{</ admonition >}}

## Partage de variable

{{< admonition type=info title="Règle Générale" details=false >}}
Ne jamais laisser 2 goroutines écrire sur une variable partagée en même temps !
{{</ admonition >}}

### Granularité de la concurrence

La concurrence se fait au niveau de la machine. 

Ce qui veut dire qu'une instruction comme `i = i + 1` va être décomposée comme cela :

`read i`

`increment`

`write i`

Il est possible que la valeur récupérée en mémoire par la goroutine ne soit pas la bonne.

{{< admonition type=tip title="Astuce" details=false >}}
Il faut donc faire attention lorsque l'on partage des variables entre goroutines, et de toujours garder cette granularité machine à l'esprit.
{{</ admonition >}}

## Initialisation

Une initialisation doit:

- Être exécutée **une seule fois**
- Être exécutée **en premier**, avant toutes les autres instructions

### Sync Once

`once.Do(f)` garantie que la fonction `f()` ne sera exécutée :

- **qu'une seule fois** même si elle est appelée dans plusieurs goroutines
- **en premier**, avant tout autre instruction (les goroutines vont être bloquées en attendant la fin de `f()`

```go
    var wg sync.WaitGroup
    
    func main() {
      wg.Add(2)
      go doStuff()
      go doStuff()
      wg.Wait()
    }
    
    func setup() {
      fmt.Println("Init")
    }
    
    var on sync.Once
    func doStuff() {
      on.Do(setup)
      fmt.Println("Hello")
      wg.Done()
    }
    
    // Resultat: 
    // Init
    // Hello
    // Hello
```

## Deadlock

### Synchronization Dependencies

La synchronisation rend les goroutines dépendantes entre elles.

- Par les channels: `G1: ch <- 1` et `G2: x := <- ch`
- Par les mutex: `G1: mut.Unlock()` et `G2: mut.Lock()`

Dans les deux cas, la goroutine G2 attend la goroutine G1.

### Circular Dependencies

La dépendance circulaire cause le blockage de toutes les goroutines impliquées :

- Par les channels et les mutex
- G1 attend G2
- G2 attend G1

```go
    // Cette goroutine: lit depuis c1 et écrit dans c2 
    func doStuff(c1 chan int, c2 chan int, wg *sync.WaitGroup) {
      <- c1
      c2 <- 1
      wg.Done()
    }
    
    func main() {
      var wg sync.WaitGroup
      ch1 := make(chan int)
      ch2 := make(chan int)
      wg.Add(2)
      doStuff(ch1, ch2, &wg)
      doStuff(ch2, ch1, &wg)
      wg.Wait()
    }
```

{{< admonition type=warning title="Avertissement" details=false >}}
**Go Runtime** va détecter ce genre de deadlock et retourner une **erreur fatale**. 

Cependant, il ne **détectera pas** de deadlock dans des **sous goroutines**.

C'est donc au programmeur de faire attention à ce genre de dépendances cycliques.
{{</ admonition >}}
