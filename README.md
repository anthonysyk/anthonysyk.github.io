# Versatile Flow — blog & portfolio

Site statique d'Anthony SSI YAN KAI : [Astro](https://astro.build) + Tailwind CSS v4, déployé sur GitHub Pages ([versatile-flow.com](https://versatile-flow.com)).

## Développement

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + build + index de recherche Pagefind (dist/)
npm run preview   # sert dist/ (recherche disponible)
npm run lint
```

## Structure

| Chemin | Rôle |
| --- | --- |
| `src/content/{posts,portfolio,cheatsheets,pages}` | Contenu Markdown (schémas validés dans `src/content.config.ts`) |
| `src/pages` | Routes (accueil, articles, portfolio, tags, recherche, RSS, robots) |
| `src/layouts`, `src/components` | Mise en page et composants |
| `src/lib/site.ts` | Config du site, navigation, helpers |
| `src/styles/global.css` | Thème Tailwind, styles du contenu |
| `public/` | Assets statiques (images WebP, `tools/sasu` = ancien simulateur autonome) |

## Ajouter du contenu

Créer `src/content/posts/mon-article.md` (URL : `/posts/mon-article/`) :

```md
---
title: "Mon article"
date: 2026-01-31
summary: "Résumé affiché dans les cartes et le SEO"
tags: ["go"]
categories: ["code"]
---
```

Admonitions : `<div class="admonition admonition-note"><p class="admonition-title">Note</p>` … `</div>` (types : note, tip, warning, question, quote).

## Déploiement

Push sur `main` → GitHub Actions (`.github/workflows/deploy.yml`) lint, build et publie `dist/` sur Pages.
