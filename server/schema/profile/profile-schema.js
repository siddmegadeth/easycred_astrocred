(function() {

    ProfileSchema = module.exports = mongoose.Schema({
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
            gender: {
                type: String
            },
            maritalStatus: {
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
            date_of_birth: { type: Date },
            props: Object,
        },
        kyc: {
            isKYCCompleted: { type: Boolean, default: false },
            isAadharVerified: { type: Boolean, default: false },
            isPanVerified: { type: Boolean, default: false },
            panNumber: { type: String },
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
        },
        consent: { type: Object },
        communication: { type: Object }
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