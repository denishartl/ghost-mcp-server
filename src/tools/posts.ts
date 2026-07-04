import {
  GhostPost,
  PostPaginationParams,
  PostFormat,
  PostInclude,
  SearchParams,
  ToolResponse,
  CreatePostParams,
  UpdatePostParams
} from '../types/index.js';
import { handleGhostApiError } from '../utils/error.js';
import { createGhostApi } from '../config/config.js';
import type { BrowseParams, ReadParams } from '@tryghost/admin-api';

const ghostApi = createGhostApi();

// Ghost's Admin API links an existing tag by `{id}`, not by a bare ID
// string. Passing bare strings causes Ghost to create a brand-new tag
// named after the literal string (this is what created junk tags named
// after tag IDs in production on 2026-07-02). Always transform before
// sending. `undefined` means "don't touch the tags field"; `[]` means
// "explicitly clear all tags" — both are preserved.
const toTagObjects = (tagIds?: string[]): { id: string }[] | undefined => {
  if (tagIds === undefined) return undefined;
  return tagIds.map((id) => ({ id }));
};

export const getPostsSchema = {
  name: 'get_posts',
  description: 'Get a list of blog posts',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of posts to retrieve (default: 10)',
        minimum: 1,
        maximum: 100
      },
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
        minimum: 1
      },
      order: {
        type: 'string',
        description: 'Sort order (default: published_at DESC)',
        enum: [
          'published_at DESC',
          'published_at ASC',
          'created_at DESC',
          'created_at ASC',
          'updated_at DESC',
          'updated_at ASC'
        ]
      },
      formats: {
        type: 'array',
        description: 'Content formats to retrieve',
        items: {
          type: 'string',
          enum: ['html', 'mobiledoc', 'lexical']
        }
      },
      include: {
        type: 'array',
        description: 'Related data to include',
        items: {
          type: 'string',
          enum: ['authors', 'tags']
        }
      }
    }
  },
};

export const getPostSchema = {
  name: 'get_post',
  description: 'Get a specific post',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Post ID'
      },
      formats: {
        type: 'array',
        description: 'Content formats to retrieve',
        items: {
          type: 'string',
          enum: ['html', 'mobiledoc', 'lexical']
        }
      },
      include: {
        type: 'array',
        description: 'Related data to include',
        items: {
          type: 'string',
          enum: ['authors', 'tags']
        }
      }
    },
    required: ['id']
  },
};

export const createPostSchema = {
  name: 'create_post',
  description: 'Create a new post',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Post title'
      },
      html: {
        type: 'string',
        description: 'Content in HTML format'
      },
      lexical: {
        type: 'string',
        description: 'Content in Lexical format'
      },
      status: {
        type: 'string',
        description: 'Post status',
        enum: ['published', 'draft', 'scheduled']
      },
      visibility: {
        type: 'string',
        description: 'Visibility scope',
        enum: ['public', 'members', 'paid', 'tiers']
      },
      published_at: {
        type: 'string',
        description: 'Publication date (for scheduled posts)'
      },
      tags: {
        type: 'array',
        description: 'Array of existing tag IDs to link (from the locked tag list). Never used to create new tags.',
        items: {
          type: 'string'
        }
      },
      authors: {
        type: 'array',
        description: 'Array of author IDs',
        items: {
          type: 'string'
        }
      },
      featured: {
        type: 'boolean',
        description: 'Set as featured post'
      },
      feature_image: {
        type: 'string',
        description: 'URL of the feature image'
      },
      feature_image_alt: {
        type: 'string',
        description: 'Alt text for the feature image'
      },
      feature_image_caption: {
        type: 'string',
        description: 'Caption for the feature image'
      },
      twitter_image: {
        type: 'string',
        description: 'URL of the Twitter/X share image'
      },
      twitter_title: {
        type: 'string',
        description: 'Twitter/X share title'
      },
      twitter_description: {
        type: 'string',
        description: 'Twitter/X share description'
      },
      og_image: {
        type: 'string',
        description: 'URL of the Open Graph share image'
      },
      og_title: {
        type: 'string',
        description: 'Open Graph share title'
      },
      og_description: {
        type: 'string',
        description: 'Open Graph share description'
      },
      meta_title: {
        type: 'string',
        description: 'SEO meta title (max ~70 chars)'
      },
      meta_description: {
        type: 'string',
        description: 'SEO meta description (max ~155 chars)'
      },
      custom_excerpt: {
        type: 'string',
        description: 'Custom excerpt shown in listings/feeds'
      },
      email_subject: {
        type: 'string',
        description: 'Email subject line'
      },
      email_only: {
        type: 'boolean',
        description: 'Email-only post'
      },
      newsletter: {
        type: 'boolean',
        description: 'Whether to send email'
      }
    },
    required: ['title']
  }
};

export const updatePostSchema = {
  name: 'update_post',
  description: 'Update a post',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Post ID'
      },
      title: {
        type: 'string',
        description: 'Post title'
      },
      html: {
        type: 'string',
        description: 'Content in HTML format'
      },
      lexical: {
        type: 'string',
        description: 'Content in Lexical format'
      },
      status: {
        type: 'string',
        description: 'Post status',
        enum: ['published', 'draft', 'scheduled']
      },
      visibility: {
        type: 'string',
        description: 'Visibility scope',
        enum: ['public', 'members', 'paid', 'tiers']
      },
      published_at: {
        type: 'string',
        description: 'Publication date (for scheduled posts)'
      },
      tags: {
        type: 'array',
        description: 'Array of existing tag IDs to link (replaces existing tags on the post). Never used to create new tags.',
        items: {
          type: 'string'
        }
      },
      authors: {
        type: 'array',
        description: 'Array of author IDs (replaces existing authors)',
        items: {
          type: 'string'
        }
      },
      featured: {
        type: 'boolean',
        description: 'Set as featured post'
      },
      feature_image: {
        type: 'string',
        description: 'URL of the feature image'
      },
      feature_image_alt: {
        type: 'string',
        description: 'Alt text for the feature image'
      },
      feature_image_caption: {
        type: 'string',
        description: 'Caption for the feature image'
      },
      twitter_image: {
        type: 'string',
        description: 'URL of the Twitter/X share image'
      },
      twitter_title: {
        type: 'string',
        description: 'Twitter/X share title'
      },
      twitter_description: {
        type: 'string',
        description: 'Twitter/X share description'
      },
      og_image: {
        type: 'string',
        description: 'URL of the Open Graph share image'
      },
      og_title: {
        type: 'string',
        description: 'Open Graph share title'
      },
      og_description: {
        type: 'string',
        description: 'Open Graph share description'
      },
      meta_title: {
        type: 'string',
        description: 'SEO meta title (max ~70 chars)'
      },
      meta_description: {
        type: 'string',
        description: 'SEO meta description (max ~155 chars)'
      },
      custom_excerpt: {
        type: 'string',
        description: 'Custom excerpt shown in listings/feeds'
      },
      email_subject: {
        type: 'string',
        description: 'Email subject line'
      },
      email_only: {
        type: 'boolean',
        description: 'Email-only post'
      },
      newsletter: {
        type: 'boolean',
        description: 'Whether to send email'
      }
    },
    required: ['id']
  }
};

export const deletePostSchema = {
  name: 'delete_post',
  description: 'Delete a post',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Post ID'
      }
    },
    required: ['id']
  }
};

export const getPostBySlugSchema = {
  name: 'get_post_by_slug',
  description: 'Get a post by slug',
  inputSchema: {
    type: 'object',
    properties: {
      slug: {
        type: 'string',
        description: 'Post slug'
      },
      formats: {
        type: 'array',
        description: 'Content formats to retrieve',
        items: {
          type: 'string',
          enum: ['html', 'mobiledoc', 'lexical']
        }
      },
      include: {
        type: 'array',
        description: 'Related data to include',
        items: {
          type: 'string',
          enum: ['authors', 'tags']
        }
      }
    },
    required: ['slug']
  }
};

export const searchPostsSchema = {
  name: 'search_posts',
  description: 'Search posts',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search keyword'
      },
      limit: {
        type: 'number',
        description: 'Number of posts to retrieve (default: 10)',
        minimum: 1,
        maximum: 100
      },
      formats: {
        type: 'array',
        description: 'Content formats to retrieve',
        items: {
          type: 'string',
          enum: ['html', 'mobiledoc', 'lexical']
        }
      },
      include: {
        type: 'array',
        description: 'Related data to include',
        items: {
          type: 'string',
          enum: ['authors', 'tags']
        }
      }
    },
    required: ['query']
  },
};

export const getPosts = async ({ limit = 10, page = 1, order, formats, include }: PostPaginationParams): Promise<ToolResponse> => {
  try {
    const params: BrowseParams = { limit, page };
    
    if (order) params.order = order;
    if (formats?.length) params.formats = formats.join(',');
    if (include?.length) params.include = include.join(',');

    const posts = await ghostApi.posts.browse(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(posts, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

export const getPost = async ({ 
  id, 
  formats, 
  include 
}: { 
  id: string; 
  formats?: PostFormat[]; 
  include?: PostInclude[]; 
}): Promise<ToolResponse> => {
  try {
    const params: ReadParams = { id };
    
    if (formats?.length) params.formats = formats.join(',');
    if (include?.length) params.include = include.join(',');

    const post = await ghostApi.posts.read(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(post, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

export const searchPosts = async ({
  query,
  limit = 10,
  formats,
  include
}: SearchParams): Promise<ToolResponse> => {
  try {
    const params: BrowseParams = { limit, search: query };
    
    if (formats?.length) params.formats = formats.join(',');
    if (include?.length) params.include = include.join(',');

    const posts = await ghostApi.posts.browse(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(posts, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

export const createPost = async (params: CreatePostParams): Promise<ToolResponse> => {
  try {
    // Ghost only converts `html` into its native Lexical format when the
    // request is made with `source: 'html'`. Without it, `html` is silently
    // ignored and the post is created with empty content. `lexical` needs
    // no such flag since it's the native format.
    const queryParams: Record<string, string> = {};
    if ((params as { html?: string }).html) {
      queryParams.source = 'html';
    }

    const postParams = {
      ...params,
      tags: toTagObjects(params.tags as unknown as string[] | undefined),
    };

    const post = await (ghostApi.posts.add as any)(postParams, queryParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(post, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

export const updatePost = async ({ id, ...params }: { id: string } & UpdatePostParams): Promise<ToolResponse> => {
  try {
    const queryParams: Record<string, string> = {};
    if ((params as { html?: string }).html) {
      queryParams.source = 'html';
    }

    // Ghost requires the post's real current `updated_at` for its
    // optimistic-concurrency check on edits. A fabricated "now" timestamp
    // mismatches the stored value and Ghost silently drops the edit
    // (observed in production as an update that returns 200 but changes
    // nothing). Always fetch the real value unless the caller explicitly
    // supplied one.
    if (!params.updated_at) {
      const current = await ghostApi.posts.read({ id });
      params.updated_at = current.updated_at ?? new Date().toISOString();
    }

    const postParams = {
      id,
      ...params,
      tags: toTagObjects(params.tags as unknown as string[] | undefined),
    };

    const post = await (ghostApi.posts.edit as any)(postParams, queryParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(post, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

export const deletePost = async ({ id }: { id: string }): Promise<ToolResponse> => {
  try {
    await ghostApi.posts.delete({ id });
    return {
      content: [
        {
          type: 'text',
          text: 'Post deleted successfully',
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

export const getPostBySlug = async ({
  slug,
  formats,
  include
}: {
  slug: string;
  formats?: PostFormat[];
  include?: PostInclude[];
}): Promise<ToolResponse> => {
  try {
    const params: BrowseParams = { filter: `slug:${slug}` };
    
    if (formats?.length) params.formats = formats.join(',');
    if (include?.length) params.include = include.join(',');

    const [post] = await ghostApi.posts.browse(params);
    if (!post) {
      throw new Error(`Post with slug "${slug}" not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(post, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};