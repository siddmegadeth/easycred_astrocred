(function() {




    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'DEV') {
        log('Running DEVELOPMENT Database MONGO CONNECT SESSION MANAGEMENT:');

        var sess = {
            secret: process.env.SECRET_KEY,
            cookie: { maxAge: 240000 },
            saveUninitialized: true,
            resave: true
        }
        log('Session Value :');
        //log(sess);
        app.use(session(sess));

    }
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'PROD') {

        log('Running Production Database MONGO CONNECT SESSION MANAGEMENT:');
    
        var sess = {
            secret: process.env.SECRET_KEY,
            resave: false,
            sameSite: true,
            saveUninitialized: true,
            cookie: { secure: false },
            genid: function(req) {
                return nanoid() // use UUIDs for session IDs
            },
            store: {}
        }

        var options = {
            dbName: process.env.MONGODB_NAME_PRODUCTION
        };
        app.set('trust proxy', 1) // trust first proxy
        sess.cookie.secure = true // serve secure cookies
        sess.store = MongoStore.create({
            mongoUrl: mongoDbURI,
            dbName: process.env.MONGODB_NAME_PRODUCTION
        })

        log('Session Value :');
        // log(sess);
        app.use(session(sess))
    }



})()