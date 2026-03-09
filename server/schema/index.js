(function() {
    require("./profile/profile-schema");
    require("./platform-analytics/platform-analytics-schema");
    require("./tracking-activity/tracking-activity-schema");
    //sitemap
    require("./sitemap/sitemap-schema");
    // cibil
    require("./cibil/index");
    // multi-bureau
    require("./equifax/index");
    require("./experion/index");
    require("./crif/index");
    require("./multi-bureau/index");
    // payments-method-schema.js
    require("./payments-method/payments-method-schema");
    // subscription
    require("./subscription/index");
    // api-key
    require("./api-key/index");
    // product
    require("./product/index");
    // tensorflow
    require("./tensorflow-model/tensor-flow-schema");
    require("./tensorflow-model/tf-model-schema");
})();