(function() {

    log = module.exports = console.log.bind(console);
    cluster = module.exports = require('cluster');
    express = module.exports = require("express");
    util = module.exports = require("util");
    app = module.exports = require('express')();
    http = module.exports = require('http').Server(app);
    ejs = module.exports = require('ejs');
    expressLayoutsWebsite = module.exports = require('express-ejs-layouts');


    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'DEV') {
        process.env.PROD_SERVER_URI = process.env.DEVHOST;
    }
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'PROD') {
        process.env.PROD_SERVER_URI = process.env.PRODHOST;
    }


    // socket.io
    global.io = module.exports = require('socket.io')(http, {
        maxHttpBufferSize: 1e8, // 100 MB,
        pingTimeout: 30000,
        transports: ['websocket', 'polling'],
        cors: {
            origin: process.env.PROD_SERVER_URI,
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        }
    });


    readingTime = module.exports = require('reading-time');
    cors = module.exports = require('cors');
    bodyParser = module.exports = require('body-parser');

    request = module.exports = require('request');
    axios = module.exports = require('axios');

    //cookie = module.exports = require('cookie');
    //Cookies = module.exports =require('cookies')
    // mongo
    mongoose = module.exports = require("mongoose");
    // MOngoDB For Atlasg Search Connection
    MongoClient = module.exports = require('mongodb').MongoClient;
    // For Searching
    moment = module.exports = require('moment');
    Schema = module.exports = mongoose.Schema;
    ObjectId = module.exports = mongoose.ObjectId;

    compression = module.exports = require('compression');
    customId = module.exports = require("custom-id");
    timeout = module.exports = require('connect-timeout'); //express v4

    //cookieParser = module.exports = require('cookie-parser');
    session = module.exports = require('express-session');
    //sharedsession  = module.exports =require("express-socket.io-session");


    MongoStore = module.exports = require('connect-mongo');
    proxy = module.exports = require('express-http-proxy');
    // sitemap
    expressSitemapXml = module.exports = require('express-sitemap-xml');


    // for views new npm
    jwt = module.exports = require('jwt-simple');
    jwtSign = module.exports = require('jsonwebtoken');

    _ = module.exports = require('lodash');

    multer = module.exports = require('multer');

    // cloudinary = module.exports = require('cloudinary');
    //CloudinaryStorage = module.exports =require('multer-storage-cloudinary');
    cloudinary = module.exports = require('cloudinary').v2;

    //  Configure Cloudinary :
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
    });
    //fileUpload = module.exports = require('express-fileupload');
    cookieParser = module.exports = require('cookie-parser');
    cron = module.exports = require('node-cron');

    //vapid
    webpush = module.exports = require('web-push');
    //IP
    geoip = module.exports = require('geoip-lite');
    useragent = module.exports = require('useragent');
    UAParser = module.exports = require('ua-parser-js');

    //mailer
    nodemailer = module.exports = require('nodemailer');

    // Email service functions - initialized as null, assigned later by nodemailer/email-service.js
    sendWelcomeEmail = module.exports = null;
    sendKYCCompletionEmail = module.exports = null;
    sendMMTCBuyConfirmationEmail = module.exports = null;
    sendMMTCSellConfirmationEmail = module.exports = null;
    sendLoanApplicationEmail = module.exports = null;

    Fingerprint = module.exports = require('express-fingerprint')
    // tensorflow
    // tf = module.exports = require('@tensorflow/tfjs-node');
})();