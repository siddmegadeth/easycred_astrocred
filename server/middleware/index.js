(function() {
    require("./init-public"); // init-public.js
    require("./middleware");
    require("./middleware-session");
    require("./middleware-jwt");
    require("./middleware-cloudinary");
    require("./sandbox-middleware");
    require("./surepass-middleware");
    require("./middleware-finger");
    //require("./socket-middleware");
})();