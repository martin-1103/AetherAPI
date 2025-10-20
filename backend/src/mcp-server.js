import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { query } from './database.js';

const server = new Server(
  {
    name: 'api-manager-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_projects',
        description: 'List all API projects',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project_endpoints',
        description: 'Get all endpoints for a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'get_endpoint_details',
        description: 'Get detailed information about a specific endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            endpointId: {
              type: 'string',
              description: 'The ID of the endpoint',
            },
          },
          required: ['endpointId'],
        },
      },
      {
        name: 'export_openapi',
        description: 'Export project endpoints as OpenAPI 3.0 specification',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project to export',
            },
          },
          required: ['projectId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_projects': {
        const result = await query('SELECT id, name, description, created_at FROM projects ORDER BY created_at DESC');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.rows, null, 2),
            },
          ],
        };
      }

      case 'get_project_endpoints': {
        const { projectId } = args;
        const result = await query(
          'SELECT id, name, method, url, headers, body, description, folder, created_at FROM endpoints WHERE project_id = $1 ORDER BY folder, name',
          [projectId]
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.rows, null, 2),
            },
          ],
        };
      }

      case 'get_endpoint_details': {
        const { endpointId } = args;
        const result = await query(
          'SELECT e.*, p.name as project_name FROM endpoints e JOIN projects p ON e.project_id = p.id WHERE e.id = $1',
          [endpointId]
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.rows[0] || {}, null, 2),
            },
          ],
        };
      }

      case 'export_openapi': {
        const { projectId } = args;
        
        const projectResult = await query('SELECT name, description FROM projects WHERE id = $1', [projectId]);
        const endpointsResult = await query(
          'SELECT * FROM endpoints WHERE project_id = $1 ORDER BY folder, name',
          [projectId]
        );

        if (projectResult.rows.length === 0) {
          throw new Error('Project not found');
        }

        const project = projectResult.rows[0];
        const endpoints = endpointsResult.rows;

        const paths = {};
        
        endpoints.forEach(endpoint => {
          const path = new URL(endpoint.url).pathname;
          const method = endpoint.method.toLowerCase();
          
          if (!paths[path]) {
            paths[path] = {};
          }

          paths[path][method] = {
            summary: endpoint.name,
            description: endpoint.description || '',
            parameters: [],
            requestBody: endpoint.body ? {
              content: {
                'application/json': {
                  schema: {
                    type: 'object'
                  }
                }
              }
            } : undefined,
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          };
        });

        const openapi = {
          openapi: '3.0.0',
          info: {
            title: project.name,
            description: project.description || '',
            version: '1.0.0',
          },
          paths: paths,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(openapi, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
