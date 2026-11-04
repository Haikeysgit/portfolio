import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TRACKS } from './lib/projects';

const projects = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    tracks: z.array(z.enum(TRACKS)).min(1),
    summary: z.string(),
    proof: z.string().optional(),
    role: z.string().optional(),
    team: z.string().optional(),
    stack: z.array(z.string()),
    links: z.array(z.object({ label: z.string(), href: z.string().url() })),
    status: z.string().optional(),
    order: z.number(),
    cover: z.string(),
    shots: z
      .array(z.object({ src: z.string(), alt: z.string(), device: z.enum(['desktop', 'mobile']) }))
      .default([]),
    demo: z.enum(['squadjar', 'kedge', 'hsbyfiona', 'bulkhead']).optional(),
  }),
});

export const collections = { projects };
