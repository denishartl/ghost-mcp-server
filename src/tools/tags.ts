import { TagPaginationParams, ToolResponse } from '../types/index.js';
import { handleGhostApiError } from '../utils/error.js';
import { createGhostApi } from '../config/config.js';
import type { BrowseParams } from '@tryghost/admin-api';

const ghostApi = createGhostApi();

export const getTagsSchema = {
  name: 'get_tags',
  description: 'Get list of tags',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of tags to retrieve (default: 10)',
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
        description: 'Sort order (default: name ASC)',
        enum: [
          'name ASC',
          'name DESC',
          'created_at DESC',
          'created_at ASC'
        ]
      },
      include: {
        type: 'string',
        description: 'Related data to include',
        enum: ['count.posts']
      },
      filter: {
        type: 'string',
        description: 'Filter condition (e.g., visibility:public, slug:getting-started)'
      }
    }
  },
};

export const getTags = async ({
  limit = 10,
  page = 1,
  order,
  include,
  filter
}: TagPaginationParams): Promise<ToolResponse> => {
  try {
    const params: BrowseParams = { limit, page };

    if (order) params.order = order;
    if (include) params.include = include;
    if (filter) params.filter = filter;

    const tags = await ghostApi.tags.browse(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tags, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

// Cleanup tool for junk tags created by bad tag-ID handling (see posts.ts
// toTagObjects comment). Not part of the normal content pipeline, but
// needed so a bad create_post call doesn't require a manual trip to the
// Ghost admin UI to fix.
export const deleteTagSchema = {
  name: 'delete_tag',
  description: 'Delete a tag',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Tag ID'
      }
    },
    required: ['id']
  },
};

export const updateTagSchema = {
  name: 'update_tag',
  description: 'Update a tag',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Tag ID'
      },
      name: {
        type: 'string',
        description: 'Tag name'
      },
      slug: {
        type: 'string',
        description: 'Tag slug'
      },
      description: {
        type: 'string',
        description: 'Tag description'
      }
    },
    required: ['id']
  },
};

export const deleteTag = async ({ id }: { id: string }): Promise<ToolResponse> => {
  try {
    await ghostApi.tags.delete({ id });
    return {
      content: [
        {
          type: 'text',
          text: 'Tag deleted successfully',
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};

export const updateTag = async ({
  id,
  name,
  slug,
  description
}: {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
}): Promise<ToolResponse> => {
  try {
    const params: Record<string, unknown> = { id };
    if (name !== undefined) params.name = name;
    if (slug !== undefined) params.slug = slug;
    if (description !== undefined) params.description = description;

    const tag = await (ghostApi.tags.edit as any)(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tag, null, 2),
        },
      ],
    };
  } catch (error) {
    throw handleGhostApiError(error);
  }
};