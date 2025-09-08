(function() {



    LoginActivitySchema = module.exports = mongoose.Schema({
        mobile: {
            type: String,
            unique: true,
            index: true
        },
        activity: [Object]
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });




    LoginActivityModel = module.exports = mongoose.model("LoginActivityModel", LoginActivitySchema);




})()