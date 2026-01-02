(function() {


    ProfileSchema = module.exports = mongoose.Schema({

        /* ================= CORE IDENTIFIERS ================= */

        profile: {
            type: String,
            unique: true,
            index: true,
            required: true
        },

        email: {
            type: String,
            unique: true,
            index: true,
            sparse: true,
            lowercase: true,
            trim: true
        },

        mobile: {
            type: String,
            unique: true,
            index: true,
            sparse: true,
            trim: true
        },

        customerId: {
            type: String,
            index: true
        },

        isOnboardingComplete: {
            type: Boolean,
            default: false
        },

        /* ================= OTP ================= */

        fast2sms: {
            otp: {
                type: String,
                index: true
            },
            isLastOTPValid: {
                type: Boolean,
                default: false
            },
            provider: {
                type: String
            }
        },

        /* ================= PROFILE INFO ================= */

        profile_info: {
            email: {
                type: String,
                lowercase: true,
                trim: true
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
                trim: true
            },
            address: {
                type: String
            },
            image: {
                type: Schema.Types.Mixed
            },
            background_image: {
                type: Schema.Types.Mixed
            },
            mobile: {
                type: String,
                trim: true
            },
            gender: {
                type: String,
                enum: ['MALE', 'FEMALE', 'OTHER']
            },
            maritalStatus: {
                type: String
            },
            monthlyIncome: {
                type: Number
            },
            isMobileAdded: {
                type: Boolean,
                default: false
            },
            mobile_verified: {
                type: Boolean,
                default: false
            },
            date_of_birth: {
                type: Date
            },
            isProfileCompleted: {
                type: Boolean,
                default: false
            }
        },

        /* ================= KYC ================= */

        kyc: {
            aadhaar_seeding_status: String,
            isKYCCompleted: {
                type: Boolean,
                default: false
            },
            isAadharVerified: {
                type: Boolean,
                default: false
            },
            isPanVerified: {
                type: Boolean,
                default: false
            },
            aadhaar_number: String,
            aadhaar_linked: String,
            aadhaar_number_masked: String,
            pan_number: String,
            pan_advance: Schema.Types.Mixed,
            aadhar_advance: Schema.Types.Mixed,
            dob_verified: Schema.Types.Mixed
        },

        /* ================= ACCOUNT ================= */

        account: {
            isAccountActive: {
                type: Boolean,
                default: false
            },
            account_type: {
                type: String,
                enum: ['INDIVIDUAL', 'BUSINESS'],
                default: 'INDIVIDUAL'
            },
            category: String
        },

        /* ================= META ================= */

        props: Schema.Types.Mixed,
        consent: Schema.Types.Mixed,
        communication: Schema.Types.Mixed,
        telemetric: Schema.Types.Mixed

    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    });

    ProfileModel = module.exports = mongoose.model('ProfileModel', ProfileSchema);

})();