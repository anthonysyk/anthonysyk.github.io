---
title: "REX | Une page composable à partir de tuiles, selon le contexte utilisateur"
date: 2024-03-15
summary: "Une seule API renvoie la liste ordonnée des tuiles à afficher selon le contexte : free plan ou premium, Gameweek en cours ou terminée, web ou mobile. Retour sur le design, en Go."
tags:
  - go
  - api
categories:
  - code
draft: false
---

En 2024, chez [SorareData](/portfolio/soraredata/), un outil d'aide aux joueurs de Sorare (un jeu de fantasy football), on avait un écran d'accueil pour chaque Gameweek : le *Gameweek center*.

Cet écran est un assemblage de blocs, que j'appelle des **tuiles** : les *Results*, les *Games*, les *Manager watchlists*, les *Impact players*, les *Rewards*, etc.

![Le Gameweek center sur mobile : chaque bloc est une tuile](/posts/go-api-tuiles/mobile.jpg)

## Le problème

L'écran existait sur le site web et dans l'application mobile. Les deux ne montraient pas la même chose :

- pendant la Gameweek, on veut les analyses ; une fois la Gameweek terminée, plutôt les Rewards ;
- sur mobile, moins de place, donc moins de tuiles ;
- le free plan voit certaines analyses verrouillées.

Deux solutions classiques : **un appel par tuile** (lent et bavard sur mobile), ou **un gros endpoint figé** qui renvoie tout à tout le monde. Aucune ne convenait.

## L'idée : l'API décrit la page

Un seul appel. La réponse contient les données **et la liste ordonnée des tuiles à afficher**. L'application n'a plus qu'à parcourir la liste.

![Deux pages différentes servies par le même endpoint](/posts/go-api-tuiles/page.svg)

Pour modifier la page mobile, on change le serveur : pas besoin d'attendre une nouvelle version de l'application. C'est du *server-driven UI* à petite échelle.

La réponse ressemble à ceci :

```go
type Response struct {
	Tiles         []Tile   `json:"tiles"`                  // ordre d'affichage
	PaywallTiles  []Tile   `json:"paywallTiles,omitempty"` // tuiles verrouillées
	Results       *Results `json:"results,omitempty"`
	Games         []Item   `json:"games,omitempty"`
	ImpactPlayers []Item   `json:"impactPlayers,omitempty"`
	// ...
}
```

Chaque bloc est optionnel : un bloc non demandé n'est même pas dans le JSON.

## Choisir les tuiles

Une fonction décide, selon la situation :

```go
func tilesFor(p Params) []Tile {
	switch {
	case !p.Active:
		return []Tile{TileRewards, TileResults}
	case p.Platform == Mobile:
		return []Tile{TileResults, TileGames, TileImpactPlayers}
	default:
		return []Tile{TileResults, TileWatchlists, TileGames, TileImpactPlayers}
	}
}
```

Ajouter une tuile : une constante, un champ, un cas. Les anciennes tuiles ne bougent pas.

## Les calculer en parallèle

Chaque tuile a sa propre source de données. Plutôt que de les enchaîner, on lance **une goroutine par tuile**. Le temps de réponse devient celui de la tuile la plus lente, pas la somme.

```go
var wg sync.WaitGroup
for _, t := range res.Tiles {
	wg.Add(1)
	go func() {
		defer wg.Done()
		switch t {
		case TileResults:
			res.Results, _ = src.Results()
		case TileGames:
			res.Games, _ = src.Games()
		// ...
		}
	}()
}
wg.Wait()
```

Pas besoin de mutex : **chaque goroutine écrit dans un champ différent** de la réponse, donc il n'y a pas de conflit (à condition que la liste ne contienne pas deux fois la même tuile). `go test -race` le confirme. Capturer `t` directement dans la goroutine est sûr depuis Go 1.22 : chaque tour de boucle a sa propre variable. Sur le test, avec 4 sources de 50 ms chacune, la réponse arrive en un peu plus de 50 ms (le temps de la plus lente) au lieu de 200 ms.

## Une tuile vide disparaît

Une tuile sans donnée (pas encore de Results en début de Gameweek, par exemple) ne doit pas laisser un trou. Une fois toutes les goroutines terminées, on la retire de la liste :

```go
res.Tiles = slices.DeleteFunc(res.Tiles, func(t Tile) bool {
	return isEmpty(res, t)
})
```

Une source en panne est traitée comme une tuile vide : la page se dégrade au lieu de renvoyer une erreur 500 à cause d'un bloc secondaire. (Il faut tout de même **logger** l'erreur, mon prototype l'ignore pour rester lisible.)

## Le free plan : verrouiller, pas refuser

Pour un utilisateur du free plan, on ne répond pas « accès refusé ». On renvoie la page avec deux ajustements :

1. `paywallTiles` liste les tuiles verrouillées, et l'application affiche un cadenas ;
2. les listes sont **tronquées** : par exemple 5 Impact players au lieu de tous, comme un aperçu qui donne envie de passer au plan payant.

La troncature était copiée dans chaque endpoint. J'en ai fait une fonction générique, avec un type dédié pour les limites :

```go
type Limit int

const LimitImpactPlayersFree Limit = 5

func TruncateForFree[T any](page []T, hasNext bool, plan Plan, offset int, limit Limit) ([]T, bool) {
	if plan != Free {
		return page, hasNext
	}
	n := int(limit)
	if offset >= n {
		return nil, false
	}
	if offset+len(page) >= n {
		return page[:n-offset], false
	}
	return page, hasNext
}
```

Trois cas à gérer, testés en table-driven :

| Situation | Résultat |
|---|---|
| la page reste sous la limite | inchangée |
| la page atteint ou dépasse la limite | coupée si besoin, et plus de « page suivante » |
| on a déjà dépassé la limite | liste vide |

Le « plus de page suivante » compte : sans lui, l'application tenterait de charger la suite pour rien. Attention au cas limite où la page s'arrête pile sur la limite : avec un simple `>`, `hasNext` resterait vrai et l'application chargerait une page vide. D'où le `>=`.

## Pièges

- **Les anciennes versions de l'application** reçoivent des tuiles qu'elles ne connaissent pas. Règle à écrire dans le contrat : **ignorer les tuiles inconnues**.
- **Une tuile en double** dans la liste casserait l'absence de mutex : deux goroutines écriraient le même champ.

## Pistes d'amélioration

- **Ne demander que ce qu'il faut.** Un paramètre `?components=` permettrait de rafraîchir une seule tuile.
- **Un timeout par tuile**, pour qu'une source lente ne ralentisse pas toute la page.
- **Limiter la concurrence** si les tuiles tapent la même base : `errgroup` avec `SetLimit`.

## Ce que j'en retiens

- Faire **décrire la page par l'API** rend l'écran modifiable sans nouvelle version de l'application.
- Une goroutine par tuile, sans mutex, est sûre tant que chacune écrit dans son propre champ.
- Retirer les tuiles vides ou en échec de la liste simplifie tous les clients.
- Une règle répétée (ici la troncature du free plan) mérite une fonction générique testée.
