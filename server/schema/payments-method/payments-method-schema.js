(function() {



    PaymentMethodSchema = module.exports = mongoose.Schema({
        profile: {
            type: String,
            unique: true,
            index: true
        },
        universal_customer_id: {
            type: String,
            index: true
        },
        customer_id: {
            type: String,
            index: true
        },
        customerRefNo: {
            type: String,
            index: true
        },
        isUPIAdded: {
            type: Boolean,
            default: false
        },
        isBankAdded: {
            type: Boolean,
            default: false
        },
        payment_method: {
            banks: {
                type: Object
            },
            upi: {
                type: Object
            }
        }
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });




    PaymentMethodModel = module.exports = mongoose.model("PaymentMethodModel", PaymentMethodSchema);



})()