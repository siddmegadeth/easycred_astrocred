(function() {



    PlatformAnalyticsSchema = module.exports = mongoose.Schema({
        profile: {
            type: String,
            unique: true,
            index: true
        },
        track: {
            location: {
                type: Object,
                properties: {
                    type: {
                        type: String,
                        enum: ['Point', 'LineString', 'Polygon'],
                        default: 'Point'
                    },
                    coordinates: {
                        type: [Number],
                        default: [0, 0]
                    }
                }
            },
            device: Object,
            total_visit: {
                visit: {
                    type: Number,
                    default: 0
                },
                created_at: {
                    type: Date,
                    default: Date.now()
                }
            }
        }
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });



    PlatformAnalyticsSchema.index({ "location": '2dsphere' });

    PlatformAnalyticsModel = module.exports = mongoose.model("PlatformAnalyticsModel", PlatformAnalyticsSchema);




})()