---
weight: 4
title: "LEARN | Scala - Design Patterns"
date: 2017-11-22T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: ""

tags: ["scala"]
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

Le language Scala est **très riche en design patterns** qui ne sont pas **«built-in»**, ce qui les rend parfois **difficile à repérer** et à écrire de façon «correcte».

<!--more-->

{{< admonition type=note title="Note" details=false >}}
Il est tout à fait possible de développer des applications sans ces techniques. 

Cependant, leur utilisation simplifie grandement la code base.
{{< /admonition >}}

## Typeclass

Les **Type Class** sont un concept puissant et flexible permettant le **polymorphisme ad hoc**.

Plus simplement, nous allons décrire un comportement qui s'adaptera au type passé en paramètre.

```scala
    trait SuperOperator[T] {
      def zero: T
    
      def op(a: T, b: T): T
    }
```

## Implicit Conversion

Les **conversions implicites** sont un ensemble de méthodes que Scala essaie d'appliquer lorsqu'il rencontre un objet du mauvais type utilisé.

Définissions certaines conversions implicites courrantes: `Int, List[T], Option[T]`

```scala
    object SuperOperator {
      object Implicits {
        implicit val intConversion: SuperOperator[Int] = new SuperOperator[Int] {
          override def zero = 0
    
          override def op(a: Int, b: Int): Int = a + b
        }
    
        implicit def listConversion[T](implicit superOp: SuperOperator[T]): SuperOperator[List[T]] = new SuperOperator[List[T]] {
          override def zero = List.empty[T]
    
          override def op(a: List[T], b: List[T]): List[T] = a.zip(b).map { case (aElement, bElement) => superOp.op(aElement, bElement) }
        }
    
        implicit def optConversion[T](implicit superOp: SuperOperator[T]): SuperOperator[Option[T]] = new SuperOperator[Option[T]] {
          override def zero = Option.empty[T]
    
          override def op(a: Option[T], b: Option[T]): Option[T] = (a, b) match {
            case (Some(aValue), Some(bValue)) => Some(superOp.op(aValue, bValue))
            case (Some(aValue), None) => Some(aValue)
            case (None, Some(bValue)) => Some(bValue)
            case (None, None) => None
          }
        }
      }
    }
```

Prenons l'exemple de `List[Option[Int]]`, le compilateur sera capable de retrouver les 3 conversions implicites et de résoudre chaque niveau d'imbrication: 

- `List[T]`, puis `Option[T]` et enfin `Int`

{{< admonition type=note title="Note" details=false >}}
Cette **composition** de **conversions implicites** est extrêmement puissante et permet de développer des **fonctions génériques surpuissantes** (et très utiles pour un DSL).
{{< /admonition >}}

## Generic Function

Nous allons pouvoir créer une **fonction générique** qui pourra **gérer tous les types** possédant une conversion implicite (définies précedemment), même si ces types sont imbriqués.

```scala
    import SuperOperator.Implicits._
    
    def genericAdd[T](a: T, b: T)(implicit superOp: SuperOperator[T]): T = superOp.op(a, b)
    
    val test1 = genericAdd(1, 4)
    // test1: Int = 5
    
    val test2 = genericAdd(List(1, 2, 3, 4), List(4, 3, 2, 1))
    // test2: List[Int] = List(5, 5, 5, 5)
    
    val test3 = genericAdd(
      Option(List(1, 2, 3, 4)),
      Option(List(4, 3, 2, 1))
    )
    // test3: Option[List[Int]] = Some(List(5, 5, 5, 5))
    
    val test4 = genericAdd(
      List(Option(1), Option(2), Option(3), Option(4)),
      List(Option(4), Option(3), Option(2), Option(1))
    )
    // test4: List[Option[Int]] = List(Some(5), Some(5), Some(5), Some(5))
```

Nous avons donc développé une **super fonction générique** qui est capable de résoudre tous les types (polymophisme) du moment que la conversion implicite est définie.

## Monoid

L'ensemble des patterns appliqués precedemment nous ont permis de créer ce que l'on appelle en **programmation fonctionnelle** un **Monoid**.

Un monoid est un type qui possède les caractéristiques suivantes:

- Type A en paramètre
- Implémente une **zero value**
- Implémente une **opération d'association**
- Respecte la **loi d'associativité**: `op(op(x,y), z) == op(x, op(y,z))`
- Respecte la **loi d'identié**: `op(x, zero) == x et op(zero, x) == x`

```scala
    trait Monoid[A] {
      def op(a1: A, a2: A): A	
      def zero: A	
    }
```

## Conclusion

Pour conclure, ces designs patterns permettent de cacher la complexité et d'exposer une **unique fonction générique polymorphique** et **user-friendly** pour les utilisateurs finaux.
