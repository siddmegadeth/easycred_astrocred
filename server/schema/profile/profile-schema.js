(function() {

    ProfileSchema = module.exports = mongoose.Schema({
        profile: {
            type: String,
            unique: true,
            index: true
        },
        email: {
            type: String,
            unique: true,
            index: true,
            sparse: true
        },
        mobile: {
            type: String,
            unique: true,
            index: true,
            sparse: true
        },
        customerId: {
            type: String,
            index: true
        },
        isOnboardingComplete: {
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
            },
            provider: { type: String }
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
            email_verified: {
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
            gender: {
                type: String
            },
            maritalStatus: {
                type: String
            },
            monthlyIncome: {
                type: String
            },
            isMobileAdded: {
                type: Boolean,
                default: false
            },
            mobile_verified: {
                type: Boolean,
                default: false
            },
            date_of_birth: { type: Date },
            isProfileCompleted: {
                type: Boolean,
                default: false
            }
        },
        props: Object,
        kyc: {
            isKYCCompleted: { type: Boolean, default: false },
            isAadharVerified: { type: Boolean, default: false },
            isPanVerified: { type: Boolean, default: false },
            aadhaar_number: { type: String },
            pan_number: { type: String }
        },
        account: {
            isAccountActive: { type: Boolean, status: false },
            account_type: { type: String, default: 'INDIVIDUAL', enum: ['INDIVIDUAL', 'BUSINESS'] }
        },
        consent: { type: Object },
        communication: { type: Object },
        telemetric: { type: Object }
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });




    ProfileSchema.pre("save", function(next) {
        var user = this;
        now = new Date();

        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = now
        }
        next();
    });



    ProfileModel = module.exports = mongoose.model("ProfileModel", ProfileSchema);

})()