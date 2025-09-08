(function() {



    ProfileSchema = module.exports = mongoose.Schema({
        profile: {
            type: String,
            unique: true,
            index: true
        },
        cibil_client_id: {
            type: String,
            unique: true,
            index: true
        },
        isProfileCompleted: {
            type: Boolean,
            default: false
        },
        fast2sms: {
            otp: {
                type: String,
                index: true
            },
            isLastOTPValid: {
                type: Boolean,
                default: false
            }
        },
        profile_info: {
            email: {
                type: String,
                unique: true,
                index: true,
                sparse: true
            },
            isEmailAdded: {
                type: Boolean,
                default: false
            },
            fullname: {
                type: String,
            },
            address: {
                type: String
            },
            image: {
                type: Object
            },
            background_image: {
                type: Object
            },
            mobile: {
                type: String,
                unique: true,
                index: true,
                sparse: true
            },
            isMobileAdded: {
                type: Boolean,
                default: false
            },
            date_of_birth: { type: Date },
            props: Object,
        },
        type: {
            profileType: {
                type: String,
                default: 'individual',
                enum: ['business', 'individual']
            },
            createdBy: {
                type: String,
                enum: ['customer', 'admin', 'business', 'individual', 'intern_program', 'moderator', 'pre_sales', 'easycred_website_lead'],
                default: 'customer'
            },
            provider: {
                type: String,
                enum: ['email', 'google', 'gmail', 'facebook', 'mobile', 'instagram', 'github', 'linkedin', 'device', 'biometric', 'admin_console', 'otpless', 'easycred_website', 'fast2sms'],
                default: 'fast2sms'
            },
            network: { type: Object }
        },
        location: {
            location: {
                type: Object,
            },
            isLocationAdded: {
                type: Boolean,
                default: false
            }
        },
        payments: {
            banks: {

            },
            upi: {
                isUPIAdded: false,
                upi_list: [Object]
            }

        },
        consent: {
            isTermsAccepted: { type: Boolean, default: false },
        }
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });



    ProfileSchema.pre("save", function(next) {
        var user = this;
        now = new Date();

        log("System generated Global Unique ID (profileId) :" + this._id);

        this.profile = this._id;
        //this.universal_customer_id = createUniversalCustomerId(this.profile_info.email);
        log(this.profile);

        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = now
        }

        next();
    });


    ProfileModel = module.exports = mongoose.model("ProfileModel", ProfileSchema);

})()

// location: {
//             type: Object,
//             properties: {
//                 type: {
//                     type: String,
//                     enum: ['Point', 'LineString', 'Polygon'],
//                     default: 'Point'
//                 },
//                 coordinates: {
//                     type: [Number],
//                     default: [0, 0]
//                 }
//             }
//         },