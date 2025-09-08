(function() {
    const swaggerJsdoc = require('swagger-jsdoc');
    const swaggerUi = require('swagger-ui-express');

    // Swagger JSDoc options
    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'EasyCred Retail API For PL/Gold API',
                version: '1.0.0',
                description: 'API documentation for the EasyCred Retail Platform',
            },
            servers: [{
                    url: 'http://localhost:' + (process.env.PORT_NUMBER_SERVER || process.env.PORT || 3000),
                    description: 'Development server'
                },
                {
                    url: process.env.PROD_SERVER_URI,
                    description: 'Production server'
                }
            ],
        },

        apis: ['./server/routes/**/*.js', './server/routes/**/index.js'],
    };

    // Initialize swagger-jsdoc
    const swaggerSpec = swaggerJsdoc(swaggerOptions);

    // Serve swagger docs
    // The 'app' variable is global, as defined in server/init/module.js
    if (typeof app !== 'undefined') {
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        log('Swagger UI setup complete and serving at /api-docs');
    } else {
        log('Error: Express app is not defined. Swagger UI could not be setup.');
    }

})();