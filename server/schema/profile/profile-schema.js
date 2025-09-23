(function() {

    ProfileFormSchema = module.exports = mongoose.Schema({
        profile: {
            type: String,
            unique: true,
            index: true
        },
        customerId: {
            type: String,
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
        isKYCCompleted: { type: Boolean, default: false },
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
            isMobileAdded: {
                type: Boolean,
                default: false
            },
            date_of_birth: { type: Date },
            props: Object,
        },
        kyc: {
            isKYCCompleted: { type: Boolean, default: false },
            isAadharVerified: { type: Boolean, default: false },
            pancard: {
                type: Object
            },
            aadhar: {
                aadhaar_seeding_status: { type: String },
                aadhar_card: { type: String },
                verification: { type: Object }
            },
            bank_kyc: {
                type: Object
            }
        }
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });




    ProfileFormSchema.pre("save", function(next) {
        var user = this;
        now = new Date();

        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = now
        }
        next();
    });



    ProfileFormModel = module.exports = mongoose.model("ProfileFormModel", ProfileFormSchema);

})()