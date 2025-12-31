(function() {
    /**
     * Grading Engine
     * Calculates credit scores, grades, and provides analysis
     * Updated for mobile/email/PAN based schema and Indian context
     */
    
    function GradingEngine(cibilData) {
        this.data = cibilData;
        this.creditReport = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
        
        // User information from updated schema
        this.userInfo = {
            name: cibilData.name || null,
            mobile: cibilData.mobile || null,
            email: cibilData.email || null,
            pan: cibilData.pan || null,
            gender: cibilData.gender || null,
            dateOfBirth: cibilData.date_of_birth || null,
            creditScore: cibilData.credit_score || null
        };
    }
    
    /**
     * Helper method to safely convert values to numbers
     */
    GradingEngine.prototype.safeToNumber = function(value) {
        if (value === undefined || value === null) return 0;
        
        // Handle string values that might be formatted with commas or other characters
        if (typeof value === 'string') {
            // Remove commas and any non-numeric characters except decimal point and minus sign
            var cleaned = value.replace(/[^\d.-]/g, '');
            var num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        }
        
        // For numbers, just return them
        return typeof value === 'number' ? value : 0;
    };
    
    /**
     * Enhanced payment history parsing for CIBIL data
     */
    GradingEngine.prototype.parsePaymentHistory = function(account) {
        try {
            var paymentHistoryStr = account.paymentHistory || '';
            var monthlyPayStatus = account.monthlyPayStatus || [];
            var payments = [];
            var onTime = 0,
                delayed = 0,
                missed = 0,
                notReported = 0;
            
            var self = this;
            
            // Priority 1: Use monthlyPayStatus array if available and valid
            if (Array.isArray(monthlyPayStatus) && monthlyPayStatus.length > 0) {
                monthlyPayStatus.forEach(function(payment, index) {
                    if (payment && payment.status) {
                        var status = payment.status;
                        var statusCategory = self.categorizePaymentStatus(status);
                        
                        if (statusCategory === 'Paid') onTime++;
                        else if (statusCategory === 'Delayed') delayed++;
                        else if (statusCategory === 'Missed') missed++;
                        else if (statusCategory === 'Not Reported') notReported++;
                        
                        payments.push({
                            date: payment.date || '',
                            status: status,
                            category: statusCategory,
                            period: index + 1
                        });
                    }
                });
            }
            // Priority 2: Parse paymentHistory string if monthlyPayStatus is not available or empty
            else if (paymentHistoryStr && paymentHistoryStr.length > 0) {
                // Handle different CIBIL payment history formats
                var months = Math.min(36, paymentHistoryStr.length);
                
                for (var i = 0; i < months; i++) {
                    var statusCode = paymentHistoryStr.charAt(i);
                    var statusCategory = self.categorizePaymentStatus(statusCode);
                    
                    if (statusCategory === 'Paid') onTime++;
                    else if (statusCategory === 'Delayed') delayed++;
                    else if (statusCategory === 'Missed') missed++;
                    else if (statusCategory === 'Not Reported') notReported++;
                    
                    var date = new Date();
                    date.setMonth(date.getMonth() - (months - i - 1));
                    
                    payments.push({
                        date: date.toISOString().split('T')[0],
                        status: statusCode,
                        category: statusCategory,
                        period: i + 1
                    });
                }
            }
            
            // If no payment history data is available, check if we can infer from other fields
            if (payments.length === 0) {
                // Check if account has any overdue amount
                var overdue = self.safeToNumber(account.amountOverdue);
                var currentBalance = self.safeToNumber(account.currentBalance);
                
                if (overdue > 0) {
                    missed = 1; // Assume at least one missed payment if there's overdue amount
                    payments.push({
                        date: new Date().toISOString().split('T')[0],
                        status: 'Overdue',
                        category: 'Missed',
                        period: 1
                    });
                } else if (currentBalance > 0) {
                    // If there's a balance but no overdue, assume payments are being made
                    onTime = 1;
                    payments.push({
                        date: new Date().toISOString().split('T')[0],
                        status: 'CUR',
                        category: 'Paid',
                        period: 1
                    });
                }
            }
            
            return {
                payments: payments,
                onTime: onTime,
                delayed: delayed,
                missed: missed,
                notReported: notReported,
                total: payments.length,
                onTimePercentage: payments.length > 0 ? (onTime / payments.length) * 100 : 0,
                missedPercentage: payments.length > 0 ? (missed / payments.length) * 100 : 0
            };
            
        } catch (error) {
            console.error('Error parsing payment history:', error);
            return {
                payments: [],
                onTime: 0,
                delayed: 0,
                missed: 0,
                notReported: 0,
                total: 0,
                onTimePercentage: 0,
                missedPercentage: 0
            };
        }
    };
    
    /**
     * Enhanced payment status categorization for CIBIL specific codes
     */
    GradingEngine.prototype.categorizePaymentStatus = function(status) {
        if (!status) return 'Not Reported';
        
        // Convert to string and normalize
        var statusStr = String(status).toUpperCase().trim();
        
        // Handle CIBIL-specific status codes first
        switch (statusStr) {
            case '000':
            case '00':
            case '0':
            case 'STD': // Standard
            case 'CUR': // Current
            case 'OK':
            case 'PB':  // Performing Borrowal
            case 'PC':  // Performing Credit
                return 'Paid';
                
            case '001':
            case '01':
            case '1':
            case 'SMA': // Special Mention Account
            case 'SM':  // Special Mention
            case '30':  // 30 days past due
                return 'Delayed';
                
            case '002':
            case '02':
            case '2':
            case 'SUB': // Substandard
            case 'SS':  // Substandard
            case '60':  // 60 days past due
                return 'Delayed';
                
            case '003':
            case '03':
            case '3':
            case 'DBT': // Doubtful
            case 'DF':  // Doubtful
            case '90':  // 90 days past due
                return 'Missed';
                
            case '004':
            case '04':
            case '4':
            case 'LSS': // Loss
            case 'LS':  // Loss
            case '120': // 120 days past due
                return 'Missed';
                
            case '005':
            case '05':
            case '5':
            case 'DEF': // Default
            case '150': // 150 days past due
                return 'Missed';
                
            case 'WO':  // Write-off
            case 'WR':  // Write-off
            case 'WOF': // Write-off
                return 'Missed';
                
            case 'XXX': // Not reported
            case 'NA':  // Not available
            case 'NR':  // Not Reported
            case 'N/A': // Not available
            case '':    // Empty
                return 'Not Reported';
        }
        
        // Handle numeric status codes (common in CIBIL)
        if (!isNaN(statusStr)) {
            var statusNum = parseInt(statusStr);
            
            // CIBIL numeric codes represent days past due
            if (statusNum === 0) return 'Paid';
            if (statusNum >= 1 && statusNum <= 30) return 'Delayed';
            if (statusNum >= 31 && statusNum <= 60) return 'Delayed';
            if (statusNum >= 61 && statusNum <= 90) return 'Missed';
            if (statusNum >= 91 && statusNum <= 120) return 'Missed';
            if (statusNum > 120) return 'Missed'; // Severe delinquency
        }
        
        // Handle string codes that might contain numbers
        if (/\d/.test(statusStr)) {
            var numMatch = statusStr.match(/\d+/);
            if (numMatch) {
                var num = parseInt(numMatch[0]);
                if (num === 0) return 'Paid';
                if (num > 0 && num <= 30) return 'Delayed';
                if (num > 30 && num <= 60) return 'Delayed';
                if (num > 60) return 'Missed';
            }
        }
        
        // Default to Not Reported for unknown codes
        return 'Not Reported';
    };
    
    /**
     * Calculate payment history score (35% weight)
     */
    GradingEngine.prototype.calculatePaymentHistoryScore = function() {
        try {
            var totalOnTime = 0;
            var totalDelayed = 0;
            var totalMissed = 0;
            var totalPayments = 0;
            var totalAccounts = this.creditReport.accounts ? this.creditReport.accounts.length : 0;
            
            var self = this;
            
            if (totalAccounts === 0) {
                return 50; // No accounts, neutral score
            }
            
            this.creditReport.accounts.forEach(function(account) {
                var paymentAnalysis = self.parsePaymentHistory(account);
                totalOnTime += paymentAnalysis.onTime;
                totalDelayed += paymentAnalysis.delayed;
                totalMissed += paymentAnalysis.missed;
                totalPayments += paymentAnalysis.total;
            });
            
            // Add minimum payment threshold check
            if (totalPayments === 0) {
                // Check if accounts have valid statuses
                var hasActiveAccounts = this.creditReport.accounts.some(function(acc) {
                    return acc.creditFacilityStatus === '00' ||
                        acc.creditFacilityStatus === '01' ||
                        acc.creditFacilityStatus === 'Active' ||
                        acc.creditFacilityStatus === 'Open';
                });
                return hasActiveAccounts ? 75 : 50;
            }
            
            // Calculate weighted score giving more importance to recent payments
            var onTimePercentage = (totalOnTime / totalPayments) * 100;
            
            // Apply different weights based on severity
            var adjustedScore = onTimePercentage;
            
            // Heavier penalty for missed payments than delayed payments
            var missedPenalty = totalMissed * 15; // 15 points per missed payment
            var delayedPenalty = totalDelayed * 5; // 5 points per delayed payment
            
            // Additional penalty if missed payments are recent
            var recentMissedPenalty = this.calculateRecentMissedPenalty();
            
            adjustedScore = onTimePercentage - missedPenalty - delayedPenalty - recentMissedPenalty;
            
            // Ensure score is within bounds
            adjustedScore = Math.max(0, Math.min(100, adjustedScore));
            
            // Round to nearest 5
            return Math.round(adjustedScore / 5) * 5;
            
        } catch (error) {
            console.error('Error calculating payment history score:', error);
            return 50; // Neutral score on error
        }
    };
    
    /**
     * Calculate penalty for recent missed payments
     */
    GradingEngine.prototype.calculateRecentMissedPenalty = function() {
        try {
            var recentMissedCount = 0;
            var self = this;
            
            this.creditReport.accounts.forEach(function(account) {
                var paymentAnalysis = self.parsePaymentHistory(account);
                // Check last 6 months for missed payments
                var recentPayments = paymentAnalysis.payments.slice(-6);
                recentMissedCount += recentPayments.filter(function(p) {
                    return p.category === 'Missed';
                }).length;
            });
            
            return recentMissedCount * 10; // 10 points per recent missed payment
        } catch (error) {
            return 0;
        }
    };
    
    /**
     * Calculate overall credit score grade
     */
    GradingEngine.prototype.calculateOverallGrade = function() {
        try {
            var paymentHistoryScore = this.calculatePaymentHistoryScore();
            var creditUtilizationScore = this.calculateCreditUtilizationScore();
            var creditAgeScore = this.calculateCreditAgeScore();
            var debtBurdenScore = this.calculateDebtBurdenScore();
            var creditMixScore = this.calculateCreditMixScore();
            var recentInquiriesScore = this.calculateRecentInquiriesScore();
            
            // Indian CIBIL scoring weights (approximation)
            var totalScore = (
                paymentHistoryScore * 0.35 +     // 35% Payment History
                creditUtilizationScore * 0.30 +  // 30% Credit Utilization
                creditAgeScore * 0.15 +          // 15% Credit History Length
                debtBurdenScore * 0.10 +         // 10% Total Debt/EMI Burden
                creditMixScore * 0.05 +          // 5% Credit Mix
                recentInquiriesScore * 0.05      // 5% Recent Credit Behavior
            );
            
            // Apply any adjustments based on Indian market specifics
            totalScore = this.applyIndianMarketAdjustments(totalScore);
            
            return this.convertScoreToGrade(totalScore);
            
        } catch (error) {
            console.error('Error calculating overall grade:', error);
            return 'C'; // Default grade on error
        }
    };
    
    /**
     * Apply Indian market specific adjustments
     */
    GradingEngine.prototype.applyIndianMarketAdjustments = function(score) {
        var adjustments = 0;
        
        // Check for secured vs unsecured loan mix
        var securedLoans = 0;
        var unsecuredLoans = 0;
        
        this.creditReport.accounts.forEach(function(account) {
            if (account.accountType) {
                var type = account.accountType.toLowerCase();
                if (type.includes('home') || type.includes('car') || type.includes('loan against') || 
                    type.includes('secured') || type.includes('mortgage')) {
                    securedLoans++;
                } else if (type.includes('credit card') || type.includes('personal loan') || 
                    type.includes('consumer') || type.includes('unsecured')) {
                    unsecuredLoans++;
                }
            }
        });
        
        // Favor a mix of secured and unsecured credit (Indian banks prefer this)
        if (securedLoans > 0 && unsecuredLoans > 0) {
            adjustments += 5; // Bonus for good credit mix
        }
        
        // Check for government/SBI accounts (considered stable in India)
        var hasGovernmentBank = this.creditReport.accounts.some(function(account) {
            var lender = account.memberShortName || '';
            return lender.includes('SBI') || lender.includes('State Bank') || 
                   lender.includes('PNB') || lender.includes('Bank of Baroda') ||
                   lender.includes('Canara') || lender.includes('Union Bank');
        });
        
        if (hasGovernmentBank) {
            adjustments += 3; // Slight bonus for government bank relationships
        }
        
        // Check employment stability (if available)
        var employmentData = this.creditReport.employment || [];
        if (employmentData.length > 0) {
            var occupationCode = employmentData[0].occupationCode;
            // Government jobs are considered very stable in India
            if (occupationCode === '02') { // Government employee
                adjustments += 5;
            }
        }
        
        return Math.min(100, Math.max(0, score + adjustments));
    };
    
    /**
     * Convert numerical score to letter grade
     */
    GradingEngine.prototype.convertScoreToGrade = function(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'C+';
        if (score >= 65) return 'C';
        if (score >= 60) return 'D+';
        if (score >= 55) return 'D';
        if (score >= 50) return 'E+';
        if (score >= 45) return 'E';
        return 'F';
    };
    
    /**
     * Calculate credit utilization score (30% weight)
     */
    GradingEngine.prototype.calculateCreditUtilizationScore = function() {
        try {
            var totalBalance = 0;
            var totalLimit = 0;
            var self = this;
            
            var accounts = this.creditReport.accounts || [];
            
            accounts.forEach(function(account) {
                // Use safe conversion for both balance and limit
                var balance = self.safeToNumber(account.currentBalance);
                var limit = self.safeToNumber(account.highCreditAmount);
                
                // Only add positive values
                if (balance > 0) totalBalance += balance;
                if (limit > 0) totalLimit += limit;
            });
            
            if (totalLimit === 0) {
                // No credit limits, check if there are any accounts
                if (accounts.length === 0) return 50; // No accounts
                return 40; // Has accounts but no limits (e.g., closed accounts)
            }
            
            var utilization = (totalBalance / totalLimit) * 100;
            
            // Indian banks prefer utilization below 30%, penalize heavily above 50%
            if (utilization <= 10) return 100;
            if (utilization <= 20) return 95;
            if (utilization <= 30) return 85;
            if (utilization <= 40) return 70;
            if (utilization <= 50) return 60;
            if (utilization <= 60) return 50;
            if (utilization <= 70) return 40;
            if (utilization <= 80) return 30;
            if (utilization <= 90) return 20;
            return 10;
            
        } catch (error) {
            console.error('Error calculating credit utilization score:', error);
            return 50;
        }
    };
    
    /**
     * Calculate credit age score (15% weight)
     */
    GradingEngine.prototype.calculateCreditAgeScore = function() {
        try {
            var oldestDate = new Date();
            var newestDate = new Date(2000, 0, 1); // Very old date
            var self = this;
            var hasValidDate = false;
            var validAccounts = 0;
            
            var accounts = this.creditReport.accounts || [];
            
            accounts.forEach(function(account) {
                if (account.dateOpened && account.dateOpened !== 'NA' && account.dateOpened !== '11111111') {
                    var accountDate = self.parseDate(account.dateOpened);
                    if (accountDate && accountDate < oldestDate) {
                        oldestDate = accountDate;
                        hasValidDate = true;
                    }
                    if (accountDate && accountDate > newestDate) {
                        newestDate = accountDate;
                    }
                    validAccounts++;
                }
            });
            
            if (!hasValidDate) {
                if (validAccounts > 0) return 60; // Has accounts but no dates
                return 50; // No accounts at all
            }
            
            var creditAgeMonths = Math.floor((new Date() - oldestDate) / (1000 * 60 * 60 * 24 * 30));
            var creditAgeYears = creditAgeMonths / 12;
            
            // Indian context: Longer history is better, but very old accounts might be inactive
            if (creditAgeYears >= 10) return 100; // Excellent: 10+ years
            if (creditAgeYears >= 7) return 90;   // Very Good: 7-10 years
            if (creditAgeYears >= 5) return 80;   // Good: 5-7 years
            if (creditAgeYears >= 3) return 70;   // Fair: 3-5 years
            if (creditAgeYears >= 2) return 60;   // Average: 2-3 years
            if (creditAgeYears >= 1) return 50;   // Below Average: 1-2 years
            return 40;                            // Poor: <1 year
            
        } catch (error) {
            console.error('Error calculating credit age score:', error);
            return 50;
        }
    };
    
    /**
     * Calculate debt burden score (10% weight)
     */
    GradingEngine.prototype.calculateDebtBurdenScore = function() {
        try {
            var totalDebt = 0;
            var totalMonthlyIncome = 0;
            var totalEMI = 0;
            var self = this;
            
            var accounts = this.creditReport.accounts || [];
            
            // Calculate total debt and EMI
            accounts.forEach(function(account) {
                var balance = self.safeToNumber(account.currentBalance);
                var emi = self.safeToNumber(account.emiAmount);
                var limit = self.safeToNumber(account.highCreditAmount);
                
                if (balance > 0) totalDebt += balance;
                if (emi > 0) totalEMI += emi;
            });
            
            // Estimate monthly income based on credit profile (Indian context)
            totalMonthlyIncome = this.estimateMonthlyIncome();
            
            if (totalMonthlyIncome === 0) {
                // Can't calculate debt-to-income ratio
                // Use debt-to-limit ratio instead
                return this.calculateDebtToLimitRatio();
            }
            
            // Calculate Debt-to-Income ratio (monthly)
            var dtiRatio = (totalEMI / totalMonthlyIncome) * 100;
            
            // Indian banks typically prefer DTI below 40-50%
            if (dtiRatio <= 30) return 100; // Excellent: <30%
            if (dtiRatio <= 40) return 85;  // Good: 30-40%
            if (dtiRatio <= 50) return 70;  // Fair: 40-50%
            if (dtiRatio <= 60) return 50;  // Poor: 50-60%
            if (dtiRatio <= 70) return 30;  // Very Poor: 60-70%
            return 10;                      // Critical: >70%
            
        } catch (error) {
            console.error('Error calculating debt burden score:', error);
            return 50;
        }
    };
    
    /**
     * Estimate monthly income based on credit profile (Indian context)
     */
    GradingEngine.prototype.estimateMonthlyIncome = function() {
        try {
            var employmentData = this.creditReport.employment || [];
            var accounts = this.creditReport.accounts || [];
            
            // Method 1: Use employment data if available
            if (employmentData.length > 0) {
                var occupationCode = employmentData[0].occupationCode;
                // Indian salary estimates by occupation
                var salaryEstimates = {
                    '01': 150000, // Professional (Doctor, Engineer, CA)
                    '02': 80000,  // Government employee
                    '03': 75000,  // Private sector employee
                    '04': 60000,  // Self-employed
                    '05': 100000, // Business owner
                    '06': 30000,  // Daily wage
                    '07': 0,      // Unemployed
                    '08': 90000,  // Senior management
                    '09': 120000  // Executive level
                };
                return salaryEstimates[occupationCode] || 50000;
            }
            
            // Method 2: Estimate based on credit limits
            var totalLimit = 0;
            accounts.forEach(function(account) {
                var limit = this.safeToNumber(account.highCreditAmount);
                if (limit > 0) totalLimit += limit;
            }, this);
            
            // Rough estimate: Credit limit is typically 2-3x monthly income
            if (totalLimit > 0) {
                return totalLimit / 2.5; // Average of 2-3x
            }
            
            // Method 3: Default estimate based on account types
            var hasCreditCards = accounts.some(function(acc) {
                return acc.accountType && acc.accountType.toLowerCase().includes('credit card');
            });
            
            return hasCreditCards ? 50000 : 30000; // Default estimates
            
        } catch (error) {
            return 50000; // Default Indian middle-class income
        }
    };
    
    /**
     * Calculate debt-to-limit ratio as fallback
     */
    GradingEngine.prototype.calculateDebtToLimitRatio = function() {
        try {
            var totalDebt = 0;
            var totalLimit = 0;
            var self = this;
            
            this.creditReport.accounts.forEach(function(account) {
                var balance = self.safeToNumber(account.currentBalance);
                var limit = self.safeToNumber(account.highCreditAmount);
                
                if (balance > 0) totalDebt += balance;
                if (limit > 0) totalLimit += limit;
            });
            
            if (totalLimit === 0) return 50;
            
            var ratio = (totalDebt / totalLimit) * 100;
            
            if (ratio <= 20) return 100;
            if (ratio <= 35) return 80;
            if (ratio <= 50) return 60;
            if (ratio <= 65) return 40;
            return 20;
            
        } catch (error) {
            return 50;
        }
    };
    
    /**
     * Calculate credit mix score (5% weight)
     */
    GradingEngine.prototype.calculateCreditMixScore = function() {
        try {
            var accountTypes = new Set();
            var securedCount = 0;
            var unsecuredCount = 0;
            var revolvingCount = 0;
            var installmentCount = 0;
            
            var accounts = this.creditReport.accounts || [];
            
            accounts.forEach(function(account) {
                if (account.accountType) {
                    accountTypes.add(account.accountType);
                    
                    var type = account.accountType.toLowerCase();
                    
                    // Categorize by security
                    if (type.includes('home') || type.includes('car') || type.includes('loan against') || 
                        type.includes('secured') || type.includes('mortgage') || type.includes('gold')) {
                        securedCount++;
                    } else if (type.includes('credit card') || type.includes('personal loan') || 
                        type.includes('consumer') || type.includes('unsecured')) {
                        unsecuredCount++;
                    }
                    
                    // Categorize by repayment type
                    if (type.includes('credit card') || type.includes('overdraft') || 
                        type.includes('line of credit')) {
                        revolvingCount++;
                    } else if (type.includes('loan') || type.includes('emi')) {
                        installmentCount++;
                    }
                }
            });
            
            // Indian banks prefer a healthy mix
            var score = 50; // Base score
            
            // Bonus for having both secured and unsecured credit
            if (securedCount > 0 && unsecuredCount > 0) score += 20;
            
            // Bonus for having both revolving and installment credit
            if (revolvingCount > 0 && installmentCount > 0) score += 15;
            
            // Bonus for multiple account types
            if (accountTypes.size >= 3) score += 15;
            else if (accountTypes.size === 2) score += 10;
            
            return Math.min(100, score);
            
        } catch (error) {
            console.error('Error calculating credit mix score:', error);
            return 50;
        }
    };
    
    /**
     * Calculate recent inquiries score (5% weight)
     */
    GradingEngine.prototype.calculateRecentInquiriesScore = function() {
        try {
            var enquiries = this.creditReport.enquiries || [];
            var sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            var self = this;
            var recentInquiries = enquiries.filter(function(inquiry) {
                if (!inquiry.enquiryDate) return false;
                var inquiryDate = self.parseDate(inquiry.enquiryDate);
                return inquiryDate > sixMonthsAgo;
            }).length;
            
            // Check for multiple inquiries from same lender (potentially shopping)
            var lenderCounts = {};
            enquiries.forEach(function(inquiry) {
                if (inquiry.memberShortName) {
                    lenderCounts[inquiry.memberShortName] = (lenderCounts[inquiry.memberShortName] || 0) + 1;
                }
            });
            
            var duplicateInquiries = Object.values(lenderCounts).filter(count => count > 1).length;
            
            var score = 100; // Start with perfect score
            
            // Penalize for multiple recent inquiries
            score -= recentInquiries * 15;
            
            // Additional penalty for duplicate inquiries (rate shopping)
            score -= duplicateInquiries * 10;
            
            // Minimum score
            return Math.max(10, score);
            
        } catch (error) {
            console.error('Error calculating recent inquiries score:', error);
            return 50;
        }
    };
    
    /**
     * Helper function to parse dates in various formats
     */
    GradingEngine.prototype.parseDate = function(dateStr) {
        if (!dateStr || dateStr === '11111111' || dateStr === 'NA' || dateStr === 'N/A') {
            return null;
        }
        
        try {
            // Try YYYY-MM-DD format first
            if (dateStr.length === 10 && dateStr[4] === '-') {
                return new Date(dateStr);
            }
            
            // Try DD/MM/YYYY format
            if (dateStr.length === 10 && dateStr[2] === '/') {
                var parts = dateStr.split('/');
                if (parts.length === 3) {
                    return new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            
            // Try DDMMYYYY format
            if (dateStr.length === 8) {
                var day = parseInt(dateStr.substring(0, 2));
                var month = parseInt(dateStr.substring(2, 4)) - 1;
                var year = parseInt(dateStr.substring(4, 8));
                return new Date(year, month, day);
            }
            
            // Try MMDDYYYY format
            if (dateStr.length === 8) {
                var month = parseInt(dateStr.substring(0, 2)) - 1;
                var day = parseInt(dateStr.substring(2, 4));
                var year = parseInt(dateStr.substring(4, 8));
                return new Date(year, month, day);
            }
            
            // Try YYYYMMDD format
            if (dateStr.length === 8) {
                var year = parseInt(dateStr.substring(0, 4));
                var month = parseInt(dateStr.substring(4, 6)) - 1;
                var day = parseInt(dateStr.substring(6, 8));
                return new Date(year, month, day);
            }
            
            // Last resort: let JavaScript parse it
            return new Date(dateStr);
            
        } catch (e) {
            console.error('Error parsing date:', dateStr, e);
            return null;
        }
    };
    
    /**
     * Identify potential defaulters
     */
    GradingEngine.prototype.identifyDefaulters = function() {
        try {
            var self = this;
            var accounts = this.creditReport.accounts || [];
            
            return accounts
                .filter(function(account) {
                    var paymentAnalysis = self.parsePaymentHistory(account);
                    var missedPayments = paymentAnalysis.missed;
                    
                    var overdue = self.safeToNumber(account.amountOverdue);
                    var limit = self.safeToNumber(account.highCreditAmount);
                    var currentBalance = self.safeToNumber(account.currentBalance);
                    
                    var overduePercentage = limit > 0 ? (overdue / limit) * 100 : 0;
                    var utilization = limit > 0 ? (currentBalance / limit) * 100 : 0;
                    
                    // Indian defaulter criteria
                    return missedPayments >= 3 || // 3+ missed payments
                        overduePercentage > 30 ||  // >30% overdue
                        utilization > 95 ||        // >95% utilization (maxed out)
                        account.creditFacilityStatus === '04' || // Loss
                        account.creditFacilityStatus === '05' || // Default
                        (paymentAnalysis.missedPercentage > 50); // >50% missed payments
                })
                .map(function(account) {
                    var paymentAnalysis = self.parsePaymentHistory(account);
                    var overdue = self.safeToNumber(account.amountOverdue);
                    var limit = self.safeToNumber(account.highCreditAmount);
                    var currentBalance = self.safeToNumber(account.currentBalance);
                    
                    return {
                        accountType: account.accountType || 'Unknown',
                        lender: account.memberShortName || 'Unknown',
                        accountNumber: account.accountNumber || 'N/A',
                        currentBalance: currentBalance,
                        creditLimit: limit,
                        overdueAmount: overdue,
                        overduePercentage: limit > 0 ? (overdue / limit) * 100 : 0,
                        missedPayments: paymentAnalysis.missed,
                        status: account.creditFacilityStatus || 'Unknown',
                        riskLevel: self.determineDefaulterRiskLevel(account, paymentAnalysis)
                    };
                });
            
        } catch (error) {
            console.error('Error identifying defaulters:', error);
            return [];
        }
    };
    
    /**
     * Determine risk level for defaulter
     */
    GradingEngine.prototype.determineDefaulterRiskLevel = function(account, paymentAnalysis) {
        var overdue = this.safeToNumber(account.amountOverdue);
        var limit = this.safeToNumber(account.highCreditAmount);
        var overduePercentage = limit > 0 ? (overdue / limit) * 100 : 0;
        
        if (paymentAnalysis.missed >= 6 || overduePercentage > 50) {
            return 'Critical';
        } else if (paymentAnalysis.missed >= 3 || overduePercentage > 30) {
            return 'High';
        } else if (paymentAnalysis.missed >= 1 || overduePercentage > 10) {
            return 'Medium';
        }
        return 'Low';
    };
    
    /**
     * Generate improvement recommendations
     */
    GradingEngine.prototype.generateRecommendations = function() {
        try {
            var recommendations = [];
            var grade = this.calculateOverallGrade();
            
            // Grade-based recommendations
            if (grade === 'D' || grade === 'E' || grade === 'F') {
                recommendations.push({
                    priority: 'High',
                    message: 'Your credit grade is very low (' + grade + '). Focus on clearing overdue payments first.',
                    area: 'Overall Grade',
                    action: 'Contact lenders to settle overdue amounts',
                    timeline: 'Immediate'
                });
            }
            
            // Payment history recommendations
            var paymentAnalysis = this.getOverallPaymentAnalysis();
            if (paymentAnalysis.missedRate > 0.2) {
                recommendations.push({
                    priority: 'High',
                    message: 'You have missed ' + paymentAnalysis.missed + ' payments (' + (paymentAnalysis.missedRate * 100).toFixed(1) + '%). Payment history is the most important factor.',
                    area: 'Payment History',
                    action: 'Set up automatic payments or payment reminders',
                    timeline: 'Immediate'
                });
            } else if (paymentAnalysis.delayed > 0) {
                recommendations.push({
                    priority: 'Medium',
                    message: 'You have ' + paymentAnalysis.delayed + ' delayed payments. Even 30-day delays can hurt your score.',
                    area: 'Payment History',
                    action: 'Pay at least 5 days before due date',
                    timeline: 'Next billing cycle'
                });
            }
            
            // Credit utilization recommendations
            var utilization = this.getCreditUtilization();
            if (utilization > 70) {
                recommendations.push({
                    priority: 'High',
                    message: 'Your credit utilization is ' + utilization.toFixed(1) + '% (recommended: below 30%).',
                    area: 'Credit Utilization',
                    action: 'Pay down credit card balances or request limit increases',
                    timeline: '1-3 months'
                });
            } else if (utilization > 50) {
                recommendations.push({
                    priority: 'Medium',
                    message: 'Your credit utilization is ' + utilization.toFixed(1) + '% (recommended: below 30%).',
                    area: 'Credit Utilization',
                    action: 'Reduce balances on highest utilization cards first',
                    timeline: '3-6 months'
                });
            }
            
            // Credit age recommendations
            var creditAge = this.getCreditAge();
            if (creditAge < 12) {
                recommendations.push({
                    priority: 'Low',
                    message: 'Your credit history is only ' + creditAge + ' months old. Longer history improves scores.',
                    area: 'Credit Age',
                    action: 'Keep your oldest accounts open and active',
                    timeline: 'Long-term'
                });
            }
            
            // Credit mix recommendations
            var accountTypes = new Set();
            this.creditReport.accounts.forEach(function(account) {
                if (account.accountType) accountTypes.add(account.accountType);
            });
            
            if (accountTypes.size < 2) {
                recommendations.push({
                    priority: 'Low',
                    message: 'You have only ' + accountTypes.size + ' type of credit account. Diversity can improve scores.',
                    area: 'Credit Mix',
                    action: 'Consider adding a different type of credit (e.g., installment loan if you only have cards)',
                    timeline: '6-12 months'
                });
            }
            
            // Recent inquiries recommendations
            var recentInquiries = this.creditReport.enquiries.filter(function(inquiry) {
                if (!inquiry.enquiryDate) return false;
                var inquiryDate = this.parseDate(inquiry.enquiryDate);
                var sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return inquiryDate > sixMonthsAgo;
            }, this).length;
            
            if (recentInquiries > 4) {
                recommendations.push({
                    priority: 'Medium',
                    message: 'You have ' + recentInquiries + ' credit inquiries in the last 6 months.',
                    area: 'Recent Inquiries',
                    action: 'Avoid new credit applications for the next 6 months',
                    timeline: '6 months'
                });
            }
            
            // Sort by priority
            var priorityOrder = { High: 1, Medium: 2, Low: 3 };
            return recommendations.sort(function(a, b) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return [];
        }
    };
    
    /**
     * Helper methods for recommendations
     */
    GradingEngine.prototype.getOverallPaymentAnalysis = function() {
        try {
            var onTime = 0,
                delayed = 0,
                missed = 0,
                total = 0;
            var self = this;
            
            var accounts = this.creditReport.accounts || [];
            
            accounts.forEach(function(account) {
                var analysis = self.parsePaymentHistory(account);
                onTime += analysis.onTime;
                delayed += analysis.delayed;
                missed += analysis.missed;
                total += analysis.total;
            });
            
            return {
                onTime: onTime,
                delayed: delayed,
                missed: missed,
                total: total,
                onTimeRate: total > 0 ? onTime / total : 0,
                missedRate: total > 0 ? missed / total : 0,
                delayedRate: total > 0 ? delayed / total : 0
            };
            
        } catch (error) {
            return { onTime: 0, delayed: 0, missed: 0, total: 0, onTimeRate: 0, missedRate: 0, delayedRate: 0 };
        }
    };
    
    GradingEngine.prototype.getCreditUtilization = function() {
        try {
            var totalBalance = 0;
            var totalLimit = 0;
            var self = this;
            
            var accounts = this.creditReport.accounts || [];
            
            accounts.forEach(function(account) {
                var balance = self.safeToNumber(account.currentBalance);
                var limit = self.safeToNumber(account.highCreditAmount);
                
                if (balance > 0) totalBalance += balance;
                if (limit > 0) totalLimit += limit;
            });
            
            return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
            
        } catch (error) {
            return 0;
        }
    };
    
    GradingEngine.prototype.getCreditAge = function() {
        try {
            var oldestDate = new Date();
            var self = this;
            var hasValidDate = false;
            
            var accounts = this.creditReport.accounts || [];
            
            accounts.forEach(function(account) {
                if (account.dateOpened && account.dateOpened !== 'NA' && account.dateOpened !== '11111111') {
                    var accountDate = self.parseDate(account.dateOpened);
                    if (accountDate && accountDate < oldestDate) {
                        oldestDate = accountDate;
                        hasValidDate = true;
                    }
                }
            });
            
            if (!hasValidDate) return 0;
            
            return Math.floor((new Date() - oldestDate) / (1000 * 60 * 60 * 24 * 30));
            
        } catch (error) {
            return 0;
        }
    };
    
    /**
     * Process accounts for detailed analysis
     */
    GradingEngine.prototype.processAccounts = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var processedAccounts = [];
            var self = this;
            
            accounts.forEach(function(account) {
                var paymentAnalysis = self.parsePaymentHistory(account);
                var utilization = 0;
                var limit = self.safeToNumber(account.highCreditAmount);
                var balance = self.safeToNumber(account.currentBalance);
                
                if (limit > 0) {
                    utilization = (balance / limit) * 100;
                }
                
                processedAccounts.push({
                    index: account.index,
                    accountType: account.accountType || 'Unknown',
                    memberShortName: account.memberShortName || 'Unknown',
                    accountNumber: account.accountNumber || 'N/A',
                    dateOpened: account.dateOpened || 'N/A',
                    dateReported: account.dateReported || 'N/A',
                    currentBalance: balance,
                    highCreditAmount: limit,
                    amountOverdue: self.safeToNumber(account.amountOverdue),
                    utilization: utilization,
                    paymentAnalysis: paymentAnalysis,
                    status: self.determineAccountStatus(account, paymentAnalysis),
                    creditFacilityStatus: account.creditFacilityStatus || 'Unknown',
                    riskLevel: self.determineAccountRiskLevel(account, paymentAnalysis)
                });
            });
            
            return processedAccounts;
            
        } catch (error) {
            console.error('Error processing accounts:', error);
            return [];
        }
    };
    
    /**
     * Determine account status
     */
    GradingEngine.prototype.determineAccountStatus = function(account, paymentAnalysis) {
        // Check for specific CIBIL status codes
        var statusCode = account.creditFacilityStatus;
        if (statusCode) {
            switch(statusCode) {
                case '00': return 'Active/Performing';
                case '01': return 'Closed';
                case '02': return 'Written Off';
                case '03': return 'Settled';
                case '04': return 'Suit Filed';
                case '05': return 'Wilful Default';
                case '06': return 'Settled - Partial';
                case '07': return 'Restructured';
            }
        }
        
        // Check for overdue amount
        if (account.amountOverdue && account.amountOverdue > 0) {
            return 'Overdue';
        }
        
        // Check payment history
        if (paymentAnalysis.missed > 0) {
            return 'Default';
        }
        
        if (paymentAnalysis.delayed > 0) {
            return 'Delayed';
        }
        
        // Check utilization
        var limit = this.safeToNumber(account.highCreditAmount);
        var balance = this.safeToNumber(account.currentBalance);
        if (limit > 0) {
            var utilization = (balance / limit) * 100;
            if (utilization > 90) {
                return 'High Utilization';
            } else if (utilization > 70) {
                return 'Moderate Utilization';
            }
        }
        
        // Check if account is closed
        if (account.dateClosed) {
            return 'Closed';
        }
        
        return 'Good Standing';
    };
    
    /**
     * Determine account risk level
     */
    GradingEngine.prototype.determineAccountRiskLevel = function(account, paymentAnalysis) {
        var status = this.determineAccountStatus(account, paymentAnalysis);
        
        switch(status) {
            case 'Wilful Default':
            case 'Written Off':
            case 'Default':
                return 'Critical';
                
            case 'Overdue':
            case 'Suit Filed':
                return 'High';
                
            case 'Delayed':
            case 'High Utilization':
                return 'Medium';
                
            case 'Settled':
            case 'Restructured':
            case 'Moderate Utilization':
                return 'Low-Medium';
                
            case 'Closed':
            case 'Active/Performing':
            case 'Good Standing':
                return 'Low';
                
            default:
                return 'Unknown';
        }
    };
    
    /**
     * Get component scores for detailed analysis
     */
    GradingEngine.prototype.getComponentScores = function() {
        return {
            paymentHistory: this.calculatePaymentHistoryScore(),
            creditUtilization: this.calculateCreditUtilizationScore(),
            creditAge: this.calculateCreditAgeScore(),
            debtBurden: this.calculateDebtBurdenScore(),
            creditMix: this.calculateCreditMixScore(),
            recentInquiries: this.calculateRecentInquiriesScore()
        };
    };
    
    /**
     * Get detailed credit report summary
     */
    GradingEngine.prototype.getCreditReportSummary = function() {
        var accounts = this.processAccounts();
        var defaulters = this.identifyDefaulters();
        var recommendations = this.generateRecommendations();
        var componentScores = this.getComponentScores();
        var overallGrade = this.calculateOverallGrade();
        
        return {
            userInfo: this.userInfo,
            overallGrade: overallGrade,
            componentScores: componentScores,
            accountSummary: {
                totalAccounts: accounts.length,
                activeAccounts: accounts.filter(acc => acc.status !== 'Closed').length,
                defaultersCount: defaulters.length,
                totalBalance: accounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
                totalLimit: accounts.reduce((sum, acc) => sum + acc.highCreditAmount, 0),
                totalOverdue: accounts.reduce((sum, acc) => sum + acc.amountOverdue, 0),
                averageUtilization: this.getCreditUtilization()
            },
            paymentSummary: this.getOverallPaymentAnalysis(),
            defaulters: defaulters,
            recommendations: recommendations,
            accounts: accounts
        };
    };
    
    module.exports = GradingEngine;
    
})();