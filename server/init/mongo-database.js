(function() {

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'DEV') {
        log('Running Development Database :');
        log("DATABASE NAME : " + process.env.MONGODB_NAME_DEVELOPMENT);
        mongoDbURI = module.exports = process.env.MONGODB_URI_DEVELOPMENT;


        const options = {
            dbName: process.env.MONGODB_NAME_DEVELOPMENT
        };

        log("MONGODB CLUSTER URI DEV: " + mongoDbURI);

        MongoClient.connect(mongoDbURI, function(errConnection, connection) {

            connectionMongoSearch = module.exports = connection;
            dbo = module.exports = connectionMongoSearch.db(process.env.MONGODB_NAME_DEVELOPMENT);

        });

        mongoose.connect(mongoDbURI, options)
            .then(function(errDb, dbConnection) {
                console.log('Connection to the online.com DEV DB/ Atlas Cluster is successful!');
                log("Database Name DEV : " + process.env.MONGODB_NAME_DEVELOPMENT);
                log("MONGODB CLUSTER URI DEV: " + mongoDbURI);

            })
            .catch((err) => console.error(err));

    }
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'PROD') {


        log('Running Production Database :');
        log("DATABASE NAME : " + process.env.MONGODB_NAME_PRODUCTION); //MONGODB_NAME_PRODUCTION
        mongoDbURI = module.exports = process.env.MONGODB_URI_PRODUCTION;
        log("MONGODB CLUSTER URI PROD: " + mongoDbURI);

        const options = {
            dbName: process.env.MONGODB_NAME_PRODUCTION
        };

        MongoClient.connect(mongoDbURI, function(errConnection, connection) {
            connectionMongoSearch = module.exports = connection;
            dbo = module.exports = connectionMongoSearch.db(process.env.MONGODB_NAME_PRODUCTION);

        });


        mongoose.connect(mongoDbURI, options)
            .then(function(errDb, dbConnection) {
                console.log('Connection to the online.com DEV DB/ Atlas Cluster is successful!');
                log("Database Name PROD : " + process.env.MONGODB_NAME_PRODUCTION);
                log("MONGODB CLUSTER URI PROD: " + mongoDbURI);

            })
            .catch((err) => console.error(err));

    }



})()