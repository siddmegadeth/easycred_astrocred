(function() {


    app.set('trust proxy', 1);
    mongoDbURI = module.exports = process.env.MONGODB_URI_DEVELOPMENT;



app.set('trust proxy', 1);

app.use(session({
    name: 'easycred_sid',

    secret: process.env.SECRET_KEY,

    resave: false,
    saveUninitialized: false,   // 🔥 CRITICAL

    rolling: true,

    store: MongoStore.create({
        mongoUrl: mongoDbURI,
        dbName: process.env.MONGODB_NAME_PRODUCTION
    }),

    cookie: {
        httpOnly: true,

        secure: process.env.NODE_ENV === 'production',

        sameSite: process.env.NODE_ENV === 'production'
            ? 'none'
            : 'lax',

        maxAge: 15 * 60 * 1000
    }
}));


})();