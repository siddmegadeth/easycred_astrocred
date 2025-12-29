(function() {


    app.set('trust proxy', 1);
    mongoDbURI = module.exports = process.env.MONGODB_URI_DEVELOPMENT;
    app.use(session({
        name: 'easycred_sid',
        secret: 'EASYCRED_SUPER_SECRET_KEY',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store: MongoStore.create({
            mongoUrl: mongoDbURI
        }),
        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 15 * 60 * 1000
        }
    }));



})();