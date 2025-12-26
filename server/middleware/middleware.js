(function() {


    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
        res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
        next();
    });

    // parse application/json
    app.use(bodyParser.json());
    app.use(express.json());
    app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit: 100000 }));
    app.set("PORT", process.env.PORT_NUMBER_SERVER || process.env.PORT);
    app.set('host', process.env.NODE_IP || 'localhost');
    
    // Configure EJS view engine
    var path = require('path');
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../views'));

    // app.use(function(req, res, next) {
    //     log('Locals Value :');
    //     log(res.locals);
    //     next();
    // });

    app.use(compression());
    app.use(timeout(120000));
    app.use(cookieParser())

    app.options('*', cors());
    app.use(cors());
    //app.use(cookieParser());

})()