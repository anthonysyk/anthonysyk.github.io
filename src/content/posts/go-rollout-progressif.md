---
title: "REX | Rollout progressif en Go avec hash stable et fallback"
date: 2025-10-12
summary: Basculer des utilisateurs vers une nouvelle source de données par pourcentage, sans état stocké, avec un fallback sur l'ancienne source en cas de timeout ou d'erreur.
tags:
  - go
  - architecture
categories:
  - code
draft: false
---

On veut remplacer une source de données (un fichier plat, un ancien service) par une nouvelle, sans tout basculer d'un coup. Il faut pouvoir :

1. envoyer 10 % des utilisateurs sur la nouvelle voie, puis 50 %, puis 100 % ;
2. qu'un utilisateur reste dans son groupe quand on monte le pourcentage ;
3. retomber sur l'ancienne source si la nouvelle est lente ou en erreur ;
4. comparer les performances des deux voies.

![Flux du rollout](/posts/go-rollout/flow.svg)

## 1. Un bucket stable par hash

```go
func InRollout(id string, threshold uint64) bool {
	h := sha1.Sum([]byte(id))
	return binary.BigEndian.Uint64(h[:8])%100 < threshold
}
```

On hache l'identifiant et on garde un bucket de 0 à 99. L'utilisateur est dans le rollout si son bucket est inférieur au seuil.

- **Déterministe** : le même identifiant donne toujours le même bucket, sans base de données ni cookie.
- **Sticky** : les groupes sont emboîtés. Passer de 10 % à 50 % **ajoute** des utilisateurs, n'en retire aucun.
- **Réparti** : SHA-1 donne une distribution uniforme. Ici on n'attend pas de sécurité, seulement de la répartition.

![Groupes emboîtés](/posts/go-rollout/buckets.svg)

Les deux propriétés se testent :

```go
func TestSticky(t *testing.T) {
	for i := range 10_000 {
		id := fmt.Sprintf("user-%d", i)
		for th := uint64(0); th < 100; th++ {
			if InRollout(id, th) && !InRollout(id, th+1) {
				t.Fatalf("%s left the rollout when threshold went %d -> %d", id, th, th+1)
			}
		}
	}
}

func TestDistribution(t *testing.T) {
	for _, th := range []uint64{0, 10, 50, 90, 100} {
		in := 0
		for i := range 100_000 {
			if InRollout(fmt.Sprintf("user-%d", i), th) {
				in++
			}
		}
		got := float64(in) / 1000
		if d := got - float64(th); d < -1 || d > 1 {
			t.Errorf("threshold %d: %.2f%% in rollout", th, got)
		}
	}
}
```

## 2. Un seuil piloté par l'environnement, désactivé par défaut

```go
var Threshold = sync.OnceValue(func() uint64 {
	v, err := strconv.ParseUint(os.Getenv("ROLLOUT_THRESHOLD"), 10, 64)
	if err != nil || v > 100 {
		return 0
	}
	return v
})
```

Une variable absente ou invalide vaut **0 : rollout désactivé**. C'est le choix sûr. `sync.OnceValue` (Go 1.21) lit la variable une seule fois. Changer le pourcentage se fait par un redéploiement ou un changement de configuration, sans modifier le code.

## 3. Le fallback

```go
var ErrInvalid = errors.New("invalid request")

func Fetch[T any](ctx context.Context, id string, threshold uint64, timeout time.Duration, next, legacy Source[T]) (T, error) {
	if id != "" && !InRollout(id, threshold) {
		return legacy(ctx, id)
	}

	nctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	res, err := next(nctx, id)
	switch {
	case err == nil:
		return res, nil
	case errors.Is(err, ErrInvalid):
		var zero T
		return zero, err // l'ancienne source échouerait aussi
	case errors.Is(err, context.DeadlineExceeded):
		slog.Warn("next source timeout", "timeout", timeout)
	default:
		slog.Error("next source error", "err", err)
	}
	slog.Warn("fallback on legacy source")
	return legacy(ctx, id)
}
```

Les décisions à prendre explicitement :

- **Utilisateur sans identifiant** (anonyme) : ici il est toujours envoyé sur la nouvelle voie. L'autre choix (toujours l'ancienne) est valable, mais il faut le décider et le documenter, car sans identifiant on ne peut pas le placer dans un bucket.
- **Erreur de validation** : pas de fallback. La requête est invalide, l'ancienne source échouerait aussi, et on masquerait un bug du client.
- **Timeout vs erreur** : deux logs distincts. Un timeout signale un problème de performance, une erreur un bug.
- **Le fallback utilise le contexte parent**, pas celui du timeout déjà expiré.
- **Métrique** : le nombre de fallbacks par motif donne le critère pour monter le seuil. Si le taux de fallback dépasse un seuil convenu, on ne monte pas.

Ce comportement se teste sans attendre, avec `testing/synctest` (Go 1.25) : l'horloge est virtuelle dans la bulle, donc un timeout de 200 ms s'exécute en 0 s :

```go
synctest.Test(t, func(t *testing.T) {
	got, err := Fetch(t.Context(), "", 100, 200*time.Millisecond, slow, legacy)
	// got == "legacy", durée virtuelle == 200 ms, test exécuté en 0 s
})
```

## 4. Comparer les deux voies

```go
func Timed[T any](fn func() (T, error)) (T, error, time.Duration) {
	start := time.Now()
	res, err := fn()
	return res, err, time.Since(start)
}
```

Un helper générique mesure chaque appel. Logger les durées en **nanosecondes** : c'est l'unité par défaut de Datadog pour les attributs de durée, ce qui évite les conversions dans les dashboards. On compare ensuite les percentiles ancienne/nouvelle voie avant de monter le seuil.

## Déroulé d'un rollout

1. Seuil à 0, déploiement du code : aucun changement de comportement.
2. Seuil à 10 : on surveille le taux de fallback, les latences, les erreurs.
3. Seuil à 50, puis 100. Un retour en arrière = baisser le seuil, les groupes étant emboîtés.
4. Une fois à 100 depuis un moment, on supprime l'ancienne voie et le code de rollout.

## À retenir

- `sha1(id) % 100 < seuil` : un rollout sans état, déterministe et sticky.
- Désactivé par défaut, piloté par la configuration.
- Le fallback protège l'utilisateur, mais il faut décider ce qu'on ne rejoue **pas**.
- Mesurer et logger chaque cas : c'est ce qui permet de monter le pourcentage en confiance.
