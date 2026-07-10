/**
 * TypeScript definitions and mappings for Payload CMS integration.
 * Maps Payload collection documents to Prisma relational models.
 */

// Payload CMS Post collection structure
export interface PayloadPost {
  id: string;
  title: string;
  slug: string;
  content: {
    root: {
      children: Array<{
        children: Array<{ text: string }>;
        type: string;
      }>;
    };
  };
  type: 'blog' | 'news' | 'press_kit';
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Payload CMS Artist collection structure
export interface PayloadArtist {
  id: string;
  stageName: string;
  slug: string;
  bio?: string;
  socialLinks?: {
    platform: 'twitter' | 'instagram' | 'spotify' | 'youtube';
    url: string;
  }[];
}

/**
 * Adapter mapping helpers to transform Payload CMS documents into 
 * format compatible with Prisma database inserts and updates.
 */
export const cmsAdapter = {
  /**
   * Transforms RichText from Payload CMS into HTML structure for ContentPost database insertion.
   */
  mapPost: (payloadPost: PayloadPost) => {
    // Basic rich text to html compiler simulation
    const bodyHtml = payloadPost.content.root.children
      .map((block) => {
        const textContent = block.children?.map((c) => c.text).join('') || '';
        if (block.type === 'heading') {
          return `<h2 class="text-xl font-bold mt-4 mb-2">${textContent}</h2>`;
        }
        return `<p class="mb-4 text-zinc-300">${textContent}</p>`;
      })
      .join('\n');

    return {
      title: payloadPost.title,
      slug: payloadPost.slug,
      bodyHtml,
      type: payloadPost.type,
      publishedAt: new Date(payloadPost.publishedAt),
    };
  },

  /**
   * Transforms Payload CMS Artist definitions into Prisma input.
   */
  mapArtist: (payloadArtist: PayloadArtist) => {
    // Format social links as unified JSON Object
    const socialLinksJson: Record<string, string> = {};
    payloadArtist.socialLinks?.forEach((link) => {
      socialLinksJson[link.platform] = link.url;
    });

    return {
      stageName: payloadArtist.stageName,
      slug: payloadArtist.slug,
      bio: payloadArtist.bio || '',
      socialLinks: socialLinksJson,
    };
  },
};
