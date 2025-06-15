---
weight: 4
title: "REX | Polymorphisme en Go"
date: 2023-09-08T12:19:06+02:00
author: "Anthony SSI YAN KAI"
description: "Le polymorphisme est un pilier essentiel de la programmation, c'est la capacité d'une entité à prendre plusieurs formes."
tags: ["go", "code", "polymorphism", "generics", "duck typing", "composition"]
categories: ["code"]
hiddenFromHomePage: false
toc: true
autoCollapseToc: true
---

Le **polymorphisme** est un pilier essentiel de la programmation. 

C'est la capacité d'une entité à prendre plusieurs formes. 

<!--more-->

```
                Polymorphisme
               /                \
       Universel               Ad Hoc
      /        \             /         \
 Inclusion  Paramétrique  Surcharge  Coercition
```

Bien que Golang ne soit pas strictement un langage orienté objet, il offre un mécanisme unique de polymorphisme grâce au **structural type**, la **composition** et les **generics**. 

Cet article vise à expliquer comment ces concepts fonctionnent en synergie avec les principes SOLID.

### Structural Type (Duck Typing)

Contrairement à d'autres langages qui utilisent le polymorphisme basé sur l'héritage, Go adopte une approche différente avec le structural typing, souvent appelé **duck typing** :

>  "If it looks like a duck and quacks like a duck, then it's probably a duck."

Autrement dit, au lieu de vérifier le type d'une variable par son nom ou par héritage, Go vérifie simplement si la structure d'un type correspond à ce qui est attendu.

**Exemple :**

Dans cet exemple, définissons une interface **Arme** qui a une méthode **Attaquer()**. N'importe quel objet qui implémente cette méthode sera considéré comme une arme dans notre jeu.


```go
type Arme interface {
    Attaquer() string
}

type Epee struct{}
func (e Epee) Attaquer() string {
    return "Coup d'épée!"
}

func UtiliserArme(a Arme) {
    fmt.Println(a.Attaquer())
}

func main() {
    monEpee := Epee{}
    UtiliserArme(monEpee)  // Outputs "Coup d'épée!"
}
```

Bien que Epee ne soit pas explicitement déclaré comme implémentant **Arme**, Go reconnaît qu'il satisfait à l'interface car il dispose d'une méthode **Attaquer**.

{{< admonition type=tip title="Astuce" details=false >}}
Les **interfaces** favorisent la séparation des responsabilités en permettant la création d'adaptateurs modulaires, comme différents gestionnaires de cache (in-memory, Redis, etc.), sans imposer une structure rigide de dépendance."
{{</ admonition >}}

### Composition

Plutôt que d'utiliser l'héritage, Go privilégie la composition. 

C'est la capacité de construire de nouveaux types en assemblant des morceaux d'autres types. 

Cela se fait généralement avec du **Struct Embedding**.

**Exemple :** 

Dans cet exemple, un Personnage aura une propriété **Arme** qu'il pourra utiliser pour attaquer. Cela illustre comment les différents types d'armes peuvent être composés dans un personnage pour lui donner différentes capacités d'attaque.

```go
type Arme interface {
    Attaquer() string
}

type Epee struct{}
func (e Epee) Attaquer() string {
    return "Coup d'épée!"
}

type Arc struct{}
func (a Arc) Attaquer() string {
    return "Tir à l'arc!"
}

type Personnage struct {
    Arme
}

func main() {
    guerrier := Personnage{Epee{}}
    archer := Personnage{Arc{}}

    fmt.Println(guerrier.Attaquer())  // Outputs "Coup d'épée!"
    fmt.Println(archer.Attaquer())    // Outputs "Tir à l'arc!"
}
```

Dans cet exemple, **Personnage** est capable d'utiliser n'importe quel objet qui implémente l'interface **Arme** grâce à la composition.

{{< admonition type=tip title="Astuce" details=false >}}
Le **Struct Embedding** en Go est une alternative élégante à l'héritage, vous permettant de combiner des structures et des fonctionnalités de manière modulaire.
{{</ admonition >}}

### Generics

Les génériques en Go offrent une forme de polymorphisme paramétrique. 
En permettant à une fonction ou à une structure de s'adapter dynamiquement à n'importe quel type, les génériques augmentent la capacité de Go à offrir des solutions polymorphiques solides tout en maintenant la robustesse et la simplicité pour laquelle le langage est réputé.

**Exemple :**

Imaginons que nous voulons créer une **Sacoche** pour chaque personnage, où ils peuvent stocker n'importe quel type d'objet (comme des armes, des potions, des artefacts, etc.). Avec les génériques, nous pouvons créer une **Sacoche** typée de manière générique.

```go
package main

import (
	"fmt"
)

// Définissons une interface générique pour un item
type Item interface {
	Name() string
}

type Epee struct{}

func (e Epee) Name() string {
	return "Epee"
}

type Potion struct{}

func (p Potion) Name() string {
	return "Potion de soin"
}

// Sacoche est une structure générique qui peut stocker n'importe quel type d'Item
type Sacoche[T Item] struct {
	items []T
}

func (s *Sacoche[T]) Add(item T) {
	s.items = append(s.items, item)
}

func (s *Sacoche[T]) ListItems() {
	for _, item := range s.items {
		fmt.Println(item.Name())
	}
}

func main() {
	// Créons une Sacoche qui va contenir tous nos items
	sacoche := &Sacoche[Item]{}
	sacoche.Add(Epee{})
	sacoche.Add(Potion{})
	sacoche.ListItems() // Affiche : Epee, Potion de soin
}
```

Dans cet exemple, nous avons utilisé les génériques pour définir une **Sacoche** qui peut contenir des items de type générique. 

{{< admonition type=tip title="Astuce" details=false >}}
Grâce aux contraintes génériques, la **Sacoche** ne peut contenir que des objets qui implémentent l'interface **Item**.
{{</ admonition >}}

### SOLID et Go

Les principes SOLID sont cinq principes fondamentaux pour la conception d'un logiciel évolutif et maintenable. L'approche de Go en matière de polymorphisme et de composition se prête particulièrement bien à ces principes :

- **Single Responsibility Principle (SRP) :** Grâce à des interfaces minces et ciblées, Go encourage la séparation des responsabilités.
- **Open/Closed Principle (OCP) :** Les structures et interfaces de Go peuvent être facilement étendues sans modification de code existant, principalement grâce à la composition.
- **Liskov Substitution Principle (LSP) :** Le duck typing de Go garantit que si une structure satisfait une interface, elle peut être substituée n'importe où cette interface est attendue.
- **Interface Segregation Principle (ISP) :** Go encourage la création d'interfaces petites et spécifiques, ce qui signifie que les structures ne sont pas forcées d'implémenter des méthodes qu'elles n'utilisent pas.
- **Dependency Inversion Principle (DIP) :** En utilisant des interfaces pour dépendre d'abstractions plutôt que de détails concrets, Go facilite l'inversion des dépendances.

### Valoriser le comportement plutôt que l'héritage

Go est un langage qui se veut être : 
- **Simple :** La simplicité est privilégiée plutôt que la complexité. Si une solution paraît simple ou évidente, c'est le fruit d'un effort conséquent du développeur pour arriver à ce résultat.
- **Lisible :** Go évite les sucres syntaxiques ou les one-liners simplement parce qu'ils sont "cools". La lisibilité est toujours mise en avant.
- **Idiomatique :** Écrire du Go selon le consensus établi par la communauté. Cela garantit une uniformité qui permet aux développeurs de s'intégrer rapidement à de nouveaux projets.
- **Maintenable :** Les responsabilités sont clairement séparées à travers différents packages. Chaque package a la responsabilité de gérer son domaine.
- **Évolutif :** Il est possible de construire au-dessus du code existant, sans avoir à modifier ce code (parfois legacy).

La maintenabilité et l'évolutivité est sans doute la ou Go est intéressant, car c'est en effet sur ce point qu'il se démarque des languages orientés objets traditionnels.

{{< admonition type=note title="Important" details=false >}}
Là où la plupart des langages orientés objet imposent une relation directe comme **MyClass extends ParentClass**, introduisant une dépendance rigide, Go évite cette liaison.

Au lieu de cela, le système de typage de Go valorise les comportements (les méthodes qu'un type expose) plutôt que son identité ou ses hiérarchies strictes.

En d'autres termes, en Go, ce qu'un objet "peut faire" (ses méthodes) est plus important que ce qu'il "est" (son héritage).
{{< /admonition >}}

{{< admonition type=tip title="Avis" details=false >}}
À mon avis, si l'on adhère aux principes SOLID et au zen de Go, l'architecture hexagonale, populaire dans les langages orientés objets, devient superflue.

Un projet Go bien structuré n'a pas nécessairement besoin de s'appuyer sur le modèle des ports et adaptateurs (architecture hexagonale).
{{< /admonition >}}

### Conclusion

Go offre une approche rafraîchissante et puissante du polymorphisme grâce au structural type et à la composition. Ces concepts, lorsqu'ils sont utilisés judicieusement, favorisent une conception de logiciel robuste qui est bien alignée avec les principes SOLID.

### Resources
- https://www.geeksforgeeks.org/ad-hoc-inclusion-parametric-coercion-polymorphisms/
- https://the-zen-of-go.netlify.app/
