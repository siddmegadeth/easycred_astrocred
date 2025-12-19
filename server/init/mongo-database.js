(function() {

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'DEV') {
        log('Running Development Database :');
        log("DATABASE NAME : " + process.env.MONGODB_NAME_DEVELOPMENT);
        mongoDbURI = module.exports = process.env.MONGODB_URI_DEVELOPMENT;


        const options = {
            dbName: process.env.MONGODB_NAME_DEVELOPMENT
        };

        log("MONGODB CLUSTER URI DEV: " + mongoDbURI);

        // Use async/await pattern with try-catch to prevent server crash
        (async function() {
            try {
                const connection = await MongoClient.connect(mongoDbURI, {
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 10000
                });
                connectionMongoSearch = module.exports = connection;
                dbo = module.exports = connectionMongoSearch.db(process.env.MONGODB_NAME_DEVELOPMENT);
                log('MongoClient Connected Successfully (DEV)');
            } catch (errConnection) {
                log('MongoClient Connection Error (DEV):', errConnection.message);
                log('Note: Some features may not work without MongoDB connection');
                log('Server will continue running, but database operations will fail');
                connectionMongoSearch = module.exports = null;
                dbo = module.exports = null;
            }
        })();

        mongoose.connect(mongoDbURI, {
            ...options,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        })
            .then(function(errDb, dbConnection) {
                console.log('Connection to the online.com DEV DB/ Atlas Cluster is successful!');
                log("Database Name DEV : " + process.env.MONGODB_NAME_DEVELOPMENT);
                log("MONGODB CLUSTER URI DEV: " + mongoDbURI);
            })
            .catch((err) => {
                console.error('Mongoose Connection Error (DEV):', err.message);
                log('Note: Server will continue but database operations will fail');
                log('Please check:');
                log('1. MongoDB server is running and accessible');
                log('2. Network connectivity to MongoDB server');
                log('3. MongoDB credentials are correct');
                log('4. Firewall rules allow connection to MongoDB server');
            });

    }
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'PROD') {


        log('Running Production Database :');
        log("DATABASE NAME : " + process.env.MONGODB_NAME_PRODUCTION); //MONGODB_NAME_PRODUCTION
        mongoDbURI = module.exports = process.env.MONGODB_URI_PRODUCTION;
        log("MONGODB CLUSTER URI PROD: " + mongoDbURI);

        const options = {
            dbName: process.env.MONGODB_NAME_PRODUCTION
        };

        // Use async/await pattern with try-catch to prevent server crash
        (async function() {
            try {
                const connection = await MongoClient.connect(mongoDbURI, {
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 10000
                });
                connectionMongoSearch = module.exports = connection;
                dbo = module.exports = connectionMongoSearch.db(process.env.MONGODB_NAME_PRODUCTION);
                log('MongoClient Connected Successfully (PROD)');
            } catch (errConnection) {
                log('MongoClient Connection Error (PROD):', errConnection.message);
                log('Note: Some features may not work without MongoDB connection');
                log('Server will continue running, but database operations will fail');
                connectionMongoSearch = module.exports = null;
                dbo = module.exports = null;
            }
        })();


        mongoose.connect(mongoDbURI, {
            ...options,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        })
            .then(function(errDb, dbConnection) {
                console.log('Connection to the online.com PROD DB/ Atlas Cluster is successful!');
                log("Database Name PROD : " + process.env.MONGODB_NAME_PRODUCTION);
                log("MONGODB CLUSTER URI PROD: " + mongoDbURI);
            })
            .catch((err) => {
                console.error('Mongoose Connection Error (PROD):', err.message);
                log('Note: Server will continue but database operations will fail');
                log('Please check:');
                log('1. MongoDB server is running and accessible');
                log('2. Network connectivity to MongoDB server');
                log('3. MongoDB credentials are correct');
                log('4. Firewall rules allow connection to MongoDB server');
            });

    }



})()