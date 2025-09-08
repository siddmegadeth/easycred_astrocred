(function() {
    BASEPATH = __dirname;
    require('datejs')
    require("./init/index");
    require("./middleware/index");
    require("./middleware-security/index");
    require("./deepseek/index");
    require("./schema/index");
    require("./routes/index");
    require("./socket/index");
    require("./cluster-start");

   // log(createUniversalCustomerId('siddmegadeth@gmail.com'));
})();

// https://wa.me/15558420791
// https://wa.me/917903956646