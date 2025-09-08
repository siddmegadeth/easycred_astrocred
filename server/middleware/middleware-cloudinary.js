(function() {



    const { CloudinaryStorage } = require('multer-storage-cloudinary');


    // Add Upload InventoryPicturesStorageCloudinary  Middleware
    InventoryPicturesStorageCloudinary = new CloudinaryStorage({
        cloudinary: cloudinary,
        resource_type: "auto",
        folder: 'easycred_product_pictures',
        allowedFormats: ['jpg', 'png', 'jpeg'],
        filename: function(req, file, cb) {
            log("Cloudinary Push Service For easycred product picture Upload")
            log(file);
            //get original file name
            var result = file.mimetype.split("/");
            ext = "." + result[1];
            log(null, file.fieldname + '-' + Date.now() + ext);
            cb(null, file.fieldname + '-' + Date.now());
        }

    });

    InventoryPictures = module.exports = multer({ storage: InventoryPicturesStorageCloudinary });



    // Add Upload InventoryPicturesStorageCloudinary  Middleware
    ProfilePicturesStorageCloudinary = new CloudinaryStorage({
        cloudinary: cloudinary,
        resource_type: "auto",
        folder: 'easycred_display_picture',
        allowedFormats: ['jpg', 'png', 'jpeg'],
        filename: function(req, file, cb) {
            log("Cloudinary Push Service For easycred profile picture  Upload")
            log(file);
            //get original file name
            var result = file.mimetype.split("/");
            ext = "." + result[1];
            log(null, file.fieldname + '-' + Date.now() + ext);
            cb(null, file.fieldname + '-' + Date.now());
        }
    });

    ProfilePictures = module.exports = multer({ storage: ProfilePicturesStorageCloudinary });



})()