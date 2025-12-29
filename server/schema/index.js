(function() {
    require("./profile/profile-schema");
    require("./platform-analytics/platform-analytics-schema");
    require("./tracking-activity/tracking-activity-schema");
    //sitemap
    require("./sitemap/sitemap-schema");
    // cibil
    require("./cibil/index");
    // payments-method-schema.js
    require("./payments-method/payments-method-schema");
    // tensorflow
    require("./tensorflow-model/tensor-flow-schema");
    require("./tensorflow-model/tf-model-schema");
})();