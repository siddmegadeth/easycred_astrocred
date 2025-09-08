(function() {


    createUniversalCustomerId = module.exports = function(email) {
        log('createUniversalCustomerId :');
        log('Email ' + email);
        var id = "ES" + email.split('@')[0].toUpperCase() + "_" + email.split('@')[1].toUpperCase();
        log('createUniversalCustomerId id ' + id);
        return id;
    }

    nanoid = module.exports = function() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 21;
        var t = "",
            r = crypto.getRandomValues(new Uint8Array(e));
        for (var n = 0; n < e; n++) t += process.env.ENCRYPT_TEXT[63 & r[n]];
        return t;
    };
    nanoid();



    generateOTP = module.exports = function(otp_length) {
        // Declare a digits variable
        // which stores all digits
        var digits = "0123456789";
        let OTP = "";
        for (let i = 0; i < otp_length; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
    };


    getCountryFullFromCode = module.exports = function(country) {
        if (country == 'IN' || country == 'in')
            return 'india';
    }


    //  milesToRadian = module.exports = function(miles) {
    //     var earthRadiusInMiles = 3963;
    //     log("Miles to Calculate : " + miles);
    //     log("Km To Radian");
    //     log(miles / earthRadiusInMiles);
    //     return miles / earthRadiusInMiles;
    // };

    // // or custom function - convert km to radian
    // kmToRadian = module.exports = function(km) {
    //     var earthRadiusInMiles = 6378;
    //     log("KM to Calculate : " + km);
    //     log("Km To Radian");
    //     log(km / earthRadiusInMiles);
    //     return km / earthRadiusInMiles;
    // };

    milesToRadian = module.exports = function(miles) {
        var earthRadiusInMiles = 3963;
        log("Miles to Calculate : " + miles);
        log("Km To Radian");
        log(miles / earthRadiusInMiles);
        return miles / earthRadiusInMiles;
    };

    // or custom function - convert km to radian
    kmToRadian = module.exports = function(km) {
        var earthRadiusInMiles = 6378;
        log("KM to Calculate : " + km);
        log("Km To Radian");
        log(km / earthRadiusInMiles);
        return km / earthRadiusInMiles;
    };

    detectIP = module.exports = function(ip) {


    }

})()