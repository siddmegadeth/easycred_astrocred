(function() {

    // set and define public accessible assets such as css/images/files from js
    app.use(express.static("cdn"));


    // mapping for EJS to website Object 
    app.use(expressLayoutsWebsite);
    app.set('view engine', 'ejs');
    app.set("views", "views");


})()