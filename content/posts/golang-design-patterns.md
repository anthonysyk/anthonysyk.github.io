---
weight: 4
title: "LEARN | Golang Design Patterns"
date: 2019-12-23T09:34:59+01:00
draft: false
author: "Anthony SSI YAN KAI"

tags: ["golang"]
categories: ["code"]
hiddenFromHomePage: false

toc: true
autoCollapseToc: true
math: false
lightgallery: true
linkToMarkdown: true
comment: false
---

Les **Design Patterns** sont des solutions réutilisables aux problèmes de programmation courants.

<!--more-->

Voyons dans cet articles quelques design patterns de Golang :

## Functional Options

Les `Functional Options` sont une technique courante utilisée en Go pour fournir des **options configurables** aux fonctions. Plutôt que de spécifier plusieurs paramètres à une fonction, ce qui peut vite devenir difficile à gérer et créer du **boilerplate inutile**, nous pouvons passer des options en paramètres de ces fonctions. 

Cela permet aux fonctions d'être **plus flexibles, évolutives et faciles à utiliser**.

Nous pouvons spécifier des **paramètres par défaut**, et l'utilisateur pourra **surcharcher ces paramètres** :

```go
type Options struct {
	Host             string
	Username         string
	Pwd              string
	Workers          int
	DocumentsPerBulk int
	FlushInterval    time.Duration
}

type Option func(*Options)

func WithHost(v string) Option {
	return func(opts *Options) {
		opts.Host = v
	}
}

func WithWorkers(v int) Option {
	return func(opts *Options) {
		opts.Workers = v
	}
}

type Client struct {
	options Options
}

func NewClient(opt ...Option) *Client {
	options := Options{
		Host:             "localhost:9200",
		Workers:          5,
		DocumentsPerBulk: 500,
		FlushInterval:    30 * time.Second,
	}

	for _, o := range opt {
		o(&options)
	}

	return &Client{
		options: options,
	}
}
```

Nous instancierons un client de la façon suivante : 

```go
// Utilisation des options par défaut
client := es.NewClient()

// Override des options
client := es.NewClient(es.WithHost("staging:9200"), es.WithWorkers(10))
```

Les `Functional Options` sont une technique courante en Go qui permet aux **fonctions d'être plus flexibles et faciles à utiliser**. 

Ce pattern est particulièrement utile pour les fonctions avec de **nombreuses options configurables**.

Source: https://dave.cheney.net/2014/10/17/functional-options-for-friendly-apis

## Decorator

Le design pattern `Décorateur` en Go permet d'ajouter des fonctionnalités supplémentaires à une struct existante en utilisant **la composition plutôt que l'héritage**.

Le principe de base du décorateur est de créer une interface qui décrit les fonctionnalités de base de la struct, puis de créer des implémentations concrètes de cette interface. 

Ensuite, il est possible de créer des `décorateurs` qui prennent **en entrée une instance de l'interface de base** et ajoutent des **fonctionnalités supplémentaires**. 

Les décorateurs ont la même interface que l'objet de base, ce qui permet de les **chaîner les uns aux autres**.

```go
type UserService interface {
    FindUserByID(id int) (*User, error)
    Authenticate(username, password string) (*User, error)
}

type userService struct {
    db *sql.DB
}

func NewUserService(db *sql.DB) UserService {
    return &userService{
        db: db,
    }
}

func (us *userService) FindUserByID(id int) (*User, error) {
    // Code pour récupérer un utilisateur par ID depuis la base de données
}

func (us *userService) Authenticate(username, password string) (*User, error) {
    // Code pour authentifier un utilisateur par nom d'utilisateur et mot de passe
}
``` 
Ici nous avons `userService` qui contient des méthodes de manipulation de la base de donnée et relatives à un utilisateur.

Maintenant nous voulons ajouter un comportement de logging à ces méthodes.

Plutôt que de les ajouter dans le service, et de mélanger la logique business et de la logique technique, nous allons utiliser le pattern des décorateurs pour **wrapper** le service utilisateur et ajouter un logging par **composition**.

```go
type userLoggingDecorator struct {
    UserService
    logger *log.Logger
}

func NewUserLoggingDecorator(us UserService, logger *log.Logger) UserService {
    return &userLoggingDecorator{
        UserService: us,
        logger: logger,
    }
}

func (uld *userLoggingDecorator) FindUserByID(id int) (*User, error) {
    uld.logger.Printf("Recherche de l'utilisateur %d", id)
    return uld.UserService.FindUserByID(id)
}

func (uld *userLoggingDecorator) Authenticate(username, password string) (*User, error) {
    uld.logger.Printf("Authentification de l'utilisateur %s", username)
    return uld.UserService.Authenticate(username, password)
}
```

Nous avons pu ajouter un comportement de logging sur le service de l'utilisateur sans altérer le code business.

{{< admonition type=note title="Note" details=false >}}
Les décorateurs peuvent être chaînés les uns aux autres, en passant une instance décorée comme entrée à un autre décorateur.
{{</ admonition >}}

En utilisant le pattern décorateur, il est facile d'ajouter des **fonctionnalités supplémentaires** à une struct existante **sans avoir besoin de la modifier** directement. Cela permet de **garder le code propre et modulaire**, tout en ajoutant de nouvelles fonctionnalités au besoin.
