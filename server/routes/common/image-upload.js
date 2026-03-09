(function() {


    app.post("/post/upload/picture", ProfilePictures.any(), function(req, resp) {
        log("/post/upload/picture");
        var files = req.files;
        log(files);
        log(files[0]);

        cloudinary.uploader
            .upload(files[0].path)
            .then(function(result) {
                log(result);
                resp.send(result);
            });

    });

})()