// (function() {
//     // Sub-schema for monthly payment status
//     MonthlyPayStatusSchema = module.exports = mongoose.Schema({
//         date: String,
//         status: String
//     });

//     // Main credit account schema
//     CreditAccountSchema = module.exports = mongoose.Schema({
//         // Primary identifier - mobile number (India specific)
//         mobile: {
//             type: String,
//             required: true,
//             validate: {
//                 validator: function(v) {
//                     // Indian mobile number validation: 10 digits starting with 6-9
//                     return /^[6-9]\d{9}$/.test(v);
//                 },
//                 message: props => `${props.value} is not a valid Indian mobile number!`
//             }
//         },

//         // Secondary identifier - email
//         email: {
//             type: String,
//             required: true,
//             lowercase: true,
//             trim: true,
//             validate: {
//                 validator: function(v) {
//                     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
//                 },
//                 message: props => `${props.value} is not a valid email address!`
//             }
//         },

//         // PAN card (Indian Permanent Account Number)
//         pan: {
//             type: String,
//             required: true,
//             uppercase: true,
//             validate: {
//                 validator: function(v) {
//                     // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
//                     return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
//                 },
//                 message: props => `${props.value} is not a valid PAN number!`
//             }
//         },

//         // Credit account fields
//         index: String,
//         memberShortName: String,
//         accountType: String,
//         ownershipIndicator: Number,
//         dateOpened: String,
//         lastPaymentDate: String,
//         dateReported: String,
//         highCreditAmount: Number,
//         currentBalance: Number,
//         paymentHistory: String,
//         paymentStartDate: String,
//         paymentEndDate: String,
//         creditFacilityStatus: String,
//         collateralType: String,
//         interestRate: Number,
//         paymentTenure: Number,
//         emiAmount: Number,
//         paymentFrequency: String,
//         actualPaymentAmount: Number,

//         // Additional fields from original schema that might be useful
//         accountNumber: String,
//         dateClosed: String,
//         amountOverdue: Number,
//         termMonths: Number,
//         woAmountPrincipal: Number,
//         woAmountTotal: Number,

//         // Monthly payment status array
//         monthlyPayStatus: [MonthlyPayStatusSchema],

//         // User identification
//         userName: String,
//         userGender: String,

//         // Account status flags
//         isActive: {
//             type: Boolean,
//             default: true
//         },

//         // Overdue status
//         overdueStatus: {
//             type: String,
//             enum: ['Current', '30+ Days', '60+ Days', '90+ Days', 'NPA'],
//             default: 'Current'
//         },

//         // Credit utilization percentage
//         creditUtilization: {
//             type: Number,
//             min: 0,
//             max: 100
//         }
//     }, {
//         timestamps: {
//             createdAt: 'created_at',
//             updatedAt: 'updated_at'
//         },

//         // Indexes for faster queries
//         indexes: [
//             // Compound index for user identification
//             { mobile: 1, email: 1, pan: 1 },

//             // Index for member/bank queries
//             { memberShortName: 1 },

//             // Index for status queries
//             { creditFacilityStatus: 1 },

//             // Index for overdue accounts
//             { overdueStatus: 1 },

//             // Index for account type queries
//             { accountType: 1 },

//             // Index for date-based queries
//             { dateOpened: 1 },
//             { lastPaymentDate: 1 }
//         ]
//     });

//     CreditAccountModel = module.exports = mongoose.model("CreditAccountModel", CreditAccountSchema);
// })();