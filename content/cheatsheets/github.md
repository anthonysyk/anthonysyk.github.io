---
weight: 4
title: "Github"
date: 2023-08-11T21:57:40+08:00
draft: false
author: "Anthony SSI YAN KAI"
description: ""
categories: ["cheatsheets"]
comment: false
---

Github cheatsheet.

<!--more-->

# Github Cheatsheet

### Supprimer un tag sur le remote

git push origin :refs/tags/v1.00

### Supprimer un tag en local

git tag -d v1.00

### Supprimer tous les tags locaux

git tag | xargs git tag -d

### Supprimer toutes les branches sauf master

git branch | grep -v "master" | xargs git branch -D


