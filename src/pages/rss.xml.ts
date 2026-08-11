/**
 * RSS feed at /rss.xml.
 *
 * Items carry summaries rather than full post bodies. Rendering MDX to
 * feed-safe HTML needs a sanitizer and a markdown renderer as extra
 * dependencies; a summary plus a link is enough for a reader to decide, and
 * keeps the build dependency-free.
 *
 * Like every other consumer, this goes through getPublishedPosts — a feed is
 * the easiest place to leak a scheduled post, since nobody looks at it.
 */

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '~/lib/content';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: 'nebulouscode',
    description: 'Writing about the things I build.',
    // context.site comes from `site` in astro.config.mjs, which is what makes
    // the item links absolute.
    site: context.site ?? 'https://nebulouscode.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.publishedAt,
      link: `/blog/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
  });
}
