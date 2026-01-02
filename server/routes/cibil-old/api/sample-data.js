(function() {


    function generateSampleCIBILData(client_id) {
        var accountTypes = ['01', '02', '03', '04', '05', '06', '07', '08'];
        var lenders = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank'];

        var accounts = [];
        var numAccounts = Math.floor(Math.random() * 4) + 2;

        for (var i = 0; i < numAccounts; i++) {
            var sanctionedAmount = Math.floor(Math.random() * 1000000) + 50000;
            var currentBalance = Math.floor(Math.random() * sanctionedAmount);

            var paymentHistory = '';
            for (var j = 0; j < 36; j++) {
                var status = Math.random() > 0.15 ? '0' : (Math.random() > 0.5 ? '1' : '2');
                paymentHistory += status;
            }

            accounts.push({
                index: 'T00' + (i + 1),
                memberShortName: lenders[Math.floor(Math.random() * lenders.length)],
                accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
                ownershipIndicator: 1,
                dateOpened: formatDate(new Date(Date.now() - Math.floor(Math.random() * 1000) * 24 * 60 * 60 * 1000)),
                lastPaymentDate: formatDate(new Date()),
                dateReported: formatDate(new Date()),
                highCreditAmount: sanctionedAmount,
                currentBalance: currentBalance,
                paymentHistory: paymentHistory,
                paymentStartDate: formatDate(new Date()),
                paymentEndDate: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
                creditFacilityStatus: '00',
                collateralType: '00',
                interestRate: 13.5,
                paymentTenure: 147,
                emiAmount: 3182,
                paymentFrequency: "03",
                actualPaymentAmount: currentBalance
            });
        }

        var enquiries = [];
        var numInquiries = Math.floor(Math.random() * 5);
        for (var i = 0; i < numInquiries; i++) {
            enquiries.push({
                index: 'I00' + (i + 1),
                enquiryDate: formatDate(new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000)),
                memberShortName: lenders[Math.floor(Math.random() * lenders.length)],
                enquiryPurpose: '05',
                enquiryAmount: 49500
            });
        }

        return {
            client_id: client_id,
            mobile: "9708016996",
            pan: "IVZPK2103N",
            name: "SHIV KUMAR",
            gender: "male",
            credit_score: "663",
            credit_report: [{
                names: [{
                    index: "N01",
                    name: "SHIV KUMAR",
                    birthDate: "2010-10-10",
                    gender: "2"
                }],
                ids: [{
                    index: "I01",
                    idType: "01",
                    idNumber: "XXXXX1010X"
                }],
                telephones: [{
                    index: "T01",
                    telephoneNumber: "1234567890",
                    telephoneType: "03"
                }],
                emails: [{
                    index: "C01",
                    emailID: "NA@NA.NA"
                }],
                employment: [{
                    index: "E01",
                    accountType: "08",
                    dateReported: "08032024",
                    occupationCode: "04"
                }],
                scores: [{
                    scoreName: "CIBILTUSC3",
                    scoreCardName: "08",
                    scoreCardVersion: "10",
                    scoreDate: "01012010",
                    score: "00663",
                    reasonCodes: [{
                        reasonCodeName: "reasonCode1",
                        reasonCodeValue: "07"
                    }]
                }],
                addresses: [{
                    index: "A01",
                    line1: "DELHI",
                    stateCode: "07",
                    pinCode: "110011",
                    addressCategory: "02",
                    dateReported: "10101011",
                    enquiryEnriched: "Y"
                }],
                accounts: accounts,
                enquiries: enquiries
            }],
            status_code: 200,
            success: true,
            message: "Success",
            message_code: "success"
        };
    }

    function formatDate(date) {
        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();
        return day + month + year;
    }

    module.exports = { generateSampleCIBILData: generateSampleCIBILData, formatDate: formatDate };
})();