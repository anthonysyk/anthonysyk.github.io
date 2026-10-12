---
title: Golang
date: 2023-08-11
summary: Golang cheatsheet.
categories:
  - cheatsheets
---

Golang cheatsheet.

# Golang Cheatsheet

## Import un package depuis un projet en local : 

```
go mod edit -replace=github.com/username/projet_importé=../projet_importé
```


## Channels

Le select permet de gérer plusieurs cases simultanément, notamment : 
- Ajouter un élément dans un channel
- Interrompre l'execution si le contexte est annulé
- Continuer son exécution et ne pas bloquer

```go
select {
    case stationChan <- station:
        fmt.Println("Station envoyée")
    case <-ctx.Done():
		fmt.Println("Contexte annulé")
		return 
    default:
        fmt.Println("Channel plein, envoi ignoré")
}
```

Dans certains cas on ne veut pas continuer l'éxécution si le channel est plein, et on VEUT bloquer. 

Dans ce cas il faut enlever le default, ou enlever le select.

```go
select {
    case stationChan <- station:
        fmt.Println("Station envoyée")
    case <-ctx.Done():
		fmt.Println("Contexte annulé")
		return
}

ou plus simplement

stationChan <- station:
fmt.Println("Station envoyée")
```
