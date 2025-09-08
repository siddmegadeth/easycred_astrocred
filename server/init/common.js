(function() {

    let a = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

    nanoid = module.exports = function() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 21;
        var t = "",
            r = crypto.getRandomValues(new Uint8Array(e));
        for (var n = 0; n < e; n++) t += a[63 & r[n]];
        return t;
    };
    nanoid();

    generateIntegerNumber = module.exports = function(n) {
        var add = 1,
            max = 12 - add;

        if (n > max) {
            return generate(max) + generate(n - max);
        }

        max = Math.pow(10, n + add);
        var min = max / 10; // Math.pow(10, n) basically 
        var number = Math.floor(Math.random() * (max - min + 1)) + min;

        return ("" + number).substring(add);
    }


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


    // parseCookies = module.exports = function(request) {
    //     const list = {};
    //     const cookieHeader = request.headers ? .cookie;
    //     if (!cookieHeader) return list;

    //     cookieHeader.split(`;`).forEach(function(cookie) {
    //         let [name, ...rest] = cookie.split(`=`);
    //         name = name ? .trim();
    //         if (!name) return;
    //         const value = rest.join(`=`).trim();
    //         if (!value) return;
    //         list[name] = decodeURIComponent(value);
    //     });

    //     return list;
    // }

})()