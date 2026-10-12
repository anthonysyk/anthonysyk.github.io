import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const entry = z.object({
  title: z.string(),
  date: z.coerce.date(),
  summary: z.string().default(''),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  image: z.string().optional(),
  hidden: z.boolean().default(false),
  draft: z.boolean().default(false),
});

const make = <S extends z.ZodType>(dir: string, schema: S) =>
  defineCollection({ loader: glob({ pattern: '**/*.md', base: `./src/content/${dir}` }), schema });

export const collections = {
  posts: make('posts', entry),
  portfolio: make('portfolio', entry),
  cheatsheets: make('cheatsheets', entry),
  pages: make('pages', z.object({ title: z.string() })),
};
