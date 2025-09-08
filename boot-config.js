(function() {


    log = module.exports = console.log.bind(console);
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'DEV') {

        process.env.PROD_SERVER_URI = process.env.DEVHOST;
        process.env.GEARDRIVE_APP_URL = process.env.DEVHOST;

    } else if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'PROD') {
        process.env.PROD_SERVER_URI = process.env.PRODHOST;
        process.env.GEARDRIVE_APP_URL = process.env.PRODHOST;
    }

    log('SELECTED URL');
    log(process.env.PROD_SERVER_URI);
    log(process.env.GEARDRIVE_APP_URL);


})()

//var productionLink = 'https://gethike-app.herokuapp.com';