import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  name: 'Versatile Flow',
  author: 'Anthony SSI YAN KAI',
  title: 'Versatile Flow | Anthony SSI YAN KAI',
  description: 'Blog et portfolio de Anthony SSI YAN KAI — développeur backend Go & Cloud, data et DevOps.',
  role: 'Développeur Backend · Go & Cloud',
  /** Affiche le badge « Disponible » sur l'accueil */
  available: false,
  /** Année de début de carrière, pour le calcul des années d'expérience */
  since: 2016,
  social: {
    GitHub: 'https://github.com/anthonysyk',
    LinkedIn: 'https://www.linkedin.com/in/anthony-ssi-yan-kai',
    Email: 'mailto:asyk.dev@gmail.com',
  },
};

export const nav = [
  { href: '/portfolio/', label: 'Portfolio' },
  { href: '/posts/', label: 'Articles' },
  { href: '/about/', label: 'À propos' },
];

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const formatDate = (d: Date) =>
  d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export const formatMonth = (d: Date) =>
  d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', timeZone: 'UTC' });

export const readingTime = (body = '') => Math.max(1, Math.round(body.split(/\s+/).length / 220));

const byDate = (a: CollectionEntry<'posts'>, b: CollectionEntry<'posts'>) => b.data.date.valueOf() - a.data.date.valueOf();

export async function getPosts({ includeHidden = false } = {}) {
  const posts = await getCollection('posts', (p) => !p.data.draft && (includeHidden || !p.data.hidden));
  return posts.sort(byDate);
}

export async function getProjects() {
  const items = await getCollection('portfolio', (p) => !p.data.draft && !p.data.hidden);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Projet du hero : celui marqué `featured: true`, sinon le plus récent */
export async function getFeaturedProject() {
  const projects = await getProjects();
  return projects.find((p) => p.data.featured) ?? projects[0];
}

export function groupBy(posts: CollectionEntry<'posts'>[], key: 'tags' | 'categories') {
  const map = new Map<string, { label: string; posts: CollectionEntry<'posts'>[] }>();
  for (const p of posts)
    for (const label of p.data[key]) {
      const slug = slugify(label);
      if (!map.has(slug)) map.set(slug, { label, posts: [] });
      map.get(slug)!.posts.push(p);
    }
  return map;
}
