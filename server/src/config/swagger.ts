import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CelestiArcana API',
      version: '1.0.0',
      description:
        'AI-powered tarot reading and horoscope API with user management, payments, and blog CMS',
      contact: {
        name: 'CelestiArcana Support',
        email: 'contact@celestiarcana.com',
      },
    },
    servers: [
      {
        url: process.env.FRONTEND_URL?.replace(':5173', ':3001') || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://celestiarcana.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk JWT token from Authorization header',
        },
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          description: 'Page number (1-indexed)',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          description: 'Items per page',
        },
        OffsetParam: {
          in: 'query',
          name: 'offset',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0,
          },
          description: 'Number of items to skip (alternative to page)',
        },
      },
      schemas: {
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
              example: 1,
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
              example: 20,
            },
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 150,
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 8,
            },
            hasMore: {
              type: 'boolean',
              description: 'Whether there are more pages',
              example: true,
            },
            hasPrevious: {
              type: 'boolean',
              description: 'Whether there is a previous page',
              example: false,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Invalid input provided',
                },
                details: {
                  type: 'object',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                path: {
                  type: 'string',
                  example: '/api/v1/users/me',
                },
              },
            },
          },
        },
        LegacyError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'An error occurred',
            },
            details: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Clerk user ID',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            credits: {
              type: 'integer',
              description: 'Available credits for readings',
            },
            loginStreak: {
              type: 'integer',
              description: 'Consecutive days logged in',
            },
            totalReadings: {
              type: 'integer',
            },
            isAdmin: {
              type: 'boolean',
            },
            lastLoginDate: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Reading: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            spreadType: {
              type: 'string',
              enum: ['SINGLE', 'THREE_CARD', 'LOVE', 'CAREER', 'HORSESHOE', 'CELTIC_CROSS'],
            },
            question: {
              type: 'string',
            },
            interpretation: {
              type: 'string',
              description: 'AI-generated reading interpretation',
            },
            cards: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Horoscope: {
          type: 'object',
          properties: {
            horoscope: {
              type: 'string',
              description: 'Generated horoscope text',
            },
            cached: {
              type: 'boolean',
              description: 'Whether this was served from cache',
            },
            generatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              examples: {
                queryValidation: {
                  summary: 'Query parameter validation error',
                  value: {
                    success: false,
                    error: {
                      code: 'VALIDATION_ERROR',
                      message: 'Invalid query parameters',
                      details: {
                        issues: [
                          {
                            field: 'page',
                            message: 'Number must be greater than or equal to 1',
                          },
                          {
                            field: 'limit',
                            message: 'Number must be less than or equal to 100',
                          },
                        ],
                      },
                      timestamp: '2024-01-10T12:00:00.000Z',
                      path: '/api/v1/users/me/readings',
                    },
                  },
                },
                bodyValidation: {
                  summary: 'Request body validation error',
                  value: {
                    success: false,
                    error: {
                      code: 'VALIDATION_ERROR',
                      message: 'Invalid request body',
                      details: {
                        issues: [
                          {
                            field: 'email',
                            message: 'Invalid email format',
                          },
                        ],
                      },
                      timestamp: '2024-01-10T12:00:00.000Z',
                      path: '/api/v1/users/me',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Users',
        description: 'User profile and credit management',
      },
      {
        name: 'Readings',
        description: 'Tarot reading operations',
      },
      {
        name: 'Horoscopes',
        description: 'Daily horoscope generation',
      },
      {
        name: 'Payments',
        description: 'Payment and credit purchase endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints (requires admin role)',
      },
      {
        name: 'Blog',
        description: 'Blog and CMS endpoints',
      },
      {
        name: 'AI',
        description: 'AI-powered features (summarization, etc.)',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
