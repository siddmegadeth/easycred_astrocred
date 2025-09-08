(function() {



    SiteMapSchema = module.exports = mongoose.Schema({
        sitemap_url: [{
            loc: {
                type: String,
                index: true,
                unique: true
            },
            priority: {
                type: Number,
                default: 1
            },
            lastmod: {
                type: Date,
                default: Date.now()
            },
            article_id: {
                type: String,
                index: true,
                unique: true
            }
        }]
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });


    SiteMapSchema.index({ "sitemap_url.loc": 'text' });
    SiteMapModel = module.exports = mongoose.model("SiteMapModel", SiteMapSchema);


})()