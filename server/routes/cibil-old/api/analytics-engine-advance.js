(function() {
    /**
     * Advanced Analytics Engine
     * Provides enhanced analytics, visualization, and improvement planning
     * Updated for mobile/email/PAN based schema
     */
    
    function AdvancedAnalytics(cibilData, gradingEngine) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
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
     * Generate chart data for loan history visualization
     */
    AdvancedAnalytics.prototype.generateLoanHistoryChartData = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var chartData = {
                labels: [],
                datasets: [{
                        label: 'Credit Limit (₹)',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Current Balance (₹)',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Overdue Amount (₹)',
                        data: [],
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ],
                // Additional metadata
                metadata: {
                    totalLimit: 0,
                    totalBalance: 0,
                    totalOverdue: 0,
                    averageUtilization: 0,
                    accountTypes: {}
                }
            };
            
            var totalLimit = 0;
            var totalBalance = 0;
            var totalOverdue = 0;
            var accountTypes = {};
            
            accounts.forEach(function(account, index) {
                var accountName = account.memberShortName || 'Unknown Bank';
                var accountType = account.accountType || 'Unknown Type';
                var highCredit = account.highCreditAmount || 0;
                var currentBalance = account.currentBalance || 0;
                var overdue = account.amountOverdue || 0;
                
                chartData.labels.push(accountName + ' - ' + accountType);
                chartData.datasets[0].data.push(highCredit);
                chartData.datasets[1].data.push(currentBalance);
                chartData.datasets[2].data.push(overdue);
                
                totalLimit += highCredit;
                totalBalance += currentBalance;
                totalOverdue += overdue;
                
                // Track account types
                accountTypes[accountType] = (accountTypes[accountType] || 0) + 1;
            });
            
            // Calculate metrics
            chartData.metadata.totalLimit = totalLimit;
            chartData.metadata.totalBalance = totalBalance;
            chartData.metadata.totalOverdue = totalOverdue;
            chartData.metadata.averageUtilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
            chartData.metadata.accountTypes = accountTypes;
            chartData.metadata.accountCount = accounts.length;
            
            return chartData;
            
        } catch (error) {
            console.error('Error generating loan history chart data:', error);
            return this.getDefaultChartData();
        }
    };
    
    /**
     * Generate payment history timeline data
     */
    AdvancedAnalytics.prototype.generatePaymentTimelineData = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var timelineData = [];
            var self = this;
            
            accounts.forEach(function(account) {
                var accountName = account.memberShortName || 'Unknown Bank';
                var accountType = account.accountType || 'Unknown';
                var accountNumber = account.accountNumber || '';
                var paymentHistory = account.paymentHistory || '';
                
                // Try to get payment analysis from grading engine
                var paymentAnalysis = {};
                try {
                    if (self.gradingEngine.parsePaymentHistory) {
                        paymentAnalysis = self.gradingEngine.parsePaymentHistory(paymentHistory);
                    } else {
                        // Fallback parsing
                        paymentAnalysis = {
                            payments: [],
                            onTime: 0,
                            delayed: 0,
                            missed: 0,
                            total: 0
                        };
                        
                        if (paymentHistory && typeof paymentHistory === 'string') {
                            for (var i = 0; i < Math.min(paymentHistory.length, 12); i++) {
                                var statusChar = paymentHistory.charAt(i);
                                var status = self.getPaymentStatusFromChar(statusChar);
                                paymentAnalysis.payments.push({
                                    month: i + 1,
                                    status: status,
                                    char: statusChar
                                });
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing payment history:', parseError);
                }
                
                // Add to timeline
                paymentAnalysis.payments.forEach(function(payment, index) {
                    var month = new Date();
                    month.setMonth(month.getMonth() - (paymentAnalysis.payments.length - index - 1));
                    
                    timelineData.push({
                        id: accountNumber + '-' + index,
                        date: month.toISOString().split('T')[0],
                        account: accountName,
                        accountType: accountType,
                        status: payment.status,
                        statusCode: payment.char || '0',
                        period: payment.period || 'M' + (index + 1)
                    });
                });
                
                // Add account-level payment summary
                timelineData.push({
                    id: accountNumber + '-summary',
                    date: new Date().toISOString().split('T')[0],
                    account: accountName,
                    accountType: accountType,
                    status: 'SUMMARY',
                    details: {
                        onTime: paymentAnalysis.onTime || 0,
                        delayed: paymentAnalysis.delayed || 0,
                        missed: paymentAnalysis.missed || 0,
                        total: paymentAnalysis.total || 0,
                        currentBalance: account.currentBalance || 0,
                        overdue: account.amountOverdue || 0
                    }
                });
            });
            
            // Sort by date
            timelineData.sort(function(a, b) {
                return new Date(a.date) - new Date(b.date);
            });
            
            return timelineData;
            
        } catch (error) {
            console.error('Error generating payment timeline:', error);
            return [];
        }
    };
    
    /**
     * Helper: Get payment status from character
     */
    AdvancedAnalytics.prototype.getPaymentStatusFromChar = function(char) {
        if (!char) return 'Unknown';
        
        var statusMap = {
            '0': 'On Time',
            '1': '1-30 Days Late',
            '2': '31-60 Days Late',
            '3': '61-90 Days Late',
            '4': '91-120 Days Late',
            '5': '121-150 Days Late',
            '6': '151-180 Days Late',
            '7': '180+ Days Late',
            '8': 'Collection/Charge-off',
            '9': 'Bad Debt',
            'D': 'Default',
            'L': 'Loan Closed',
            'S': 'Settled',
            'W': 'Written Off',
            'X': 'No History',
            'C': 'Current',
            'N': 'No Information'
        };
        
        return statusMap[char] || 'Unknown (' + char + ')';
    };
    
    /**
     * Generate 6-month improvement plan
     */
    AdvancedAnalytics.prototype.generateImprovementPlan = function() {
        try {
            var recommendations = this.gradingEngine.generateRecommendations ? 
                this.gradingEngine.generateRecommendations() : [];
            var currentGrade = this.gradingEngine.calculateOverallGrade ? 
                this.gradingEngine.calculateOverallGrade() : 'C';
            var targetGrade = this.getTargetGrade(currentGrade);
            
            var plan = {
                userInfo: this.userInfo,
                currentGrade: currentGrade,
                targetGrade: targetGrade,
                timeline: '6 Months',
                startDate: new Date().toISOString().split('T')[0],
                estimatedCompletion: this.getCompletionDate(6),
                monthlyPlans: [],
                priorityAreas: this.identifyPriorityAreas(),
                expectedImpact: this.calculateExpectedImpact(currentGrade, targetGrade)
            };
            
            // Group recommendations by priority
            var highPriority = recommendations.filter(r => r.priority === 'High');
            var mediumPriority = recommendations.filter(r => r.priority === 'Medium');
            var lowPriority = recommendations.filter(r => r.priority === 'Low');
            
            // Create monthly plans
            for (var month = 1; month <= 6; month++) {
                var monthlyPlan = {
                    month: month,
                    focus: this.getMonthlyFocus(month),
                    actions: [],
                    goals: [],
                    successMetrics: []
                };
                
                // Add actions based on month and priority
                if (month === 1) {
                    // Month 1: High priority actions
                    highPriority.forEach(function(rec, index) {
                        if (index < 3) { // Limit to 3 high priority actions
                            monthlyPlan.actions.push({
                                id: 'M1-A' + (index + 1),
                                description: rec.message || rec.description || 'Improve credit health',
                                area: rec.area || 'General',
                                priority: 'High',
                                timeRequired: '2-3 hours',
                                resources: ['Credit report copy', 'Bank statements']
                            });
                        }
                    });
                    
                    monthlyPlan.goals.push('Review complete credit report for errors');
                    monthlyPlan.goals.push('Set up payment reminders for all accounts');
                    monthlyPlan.successMetrics.push('Dispute at least 1 error if found');
                    monthlyPlan.successMetrics.push('Setup automatic payments for minimum dues');
                }
                else if (month <= 3) {
                    // Months 2-3: Medium priority actions
                    mediumPriority.forEach(function(rec, index) {
                        if (index < 2) { // 2 medium priority actions per month
                            monthlyPlan.actions.push({
                                id: 'M' + month + '-A' + (index + 1),
                                description: rec.message || rec.description || 'Improve credit health',
                                area: rec.area || 'General',
                                priority: 'Medium',
                                timeRequired: '1-2 hours',
                                resources: ['Current account statements']
                            });
                        }
                    });
                    
                    monthlyPlan.goals.push('Reduce credit utilization below 50%');
                    monthlyPlan.goals.push('Make all payments on time');
                    monthlyPlan.successMetrics.push('Utilization decreased by 10%');
                    monthlyPlan.successMetrics.push('No late payments this month');
                }
                else {
                    // Months 4-6: Low priority and maintenance
                    lowPriority.forEach(function(rec, index) {
                        if (index < 1) { // 1 low priority action per month
                            monthlyPlan.actions.push({
                                id: 'M' + month + '-A' + (index + 1),
                                description: rec.message || rec.description || 'Improve credit health',
                                area: rec.area || 'General',
                                priority: 'Low',
                                timeRequired: '30-60 minutes',
                                resources: []
                            });
                        }
                    });
                    
                    monthlyPlan.goals.push('Maintain good payment habits');
                    monthlyPlan.goals.push('Monitor credit score monthly');
                    monthlyPlan.successMetrics.push('Credit score increase of 10+ points');
                    monthlyPlan.successMetrics.push('No new credit inquiries');
                }
                
                // Add month-specific actions
                var specificActions = this.getMonthSpecificActions(month, currentGrade);
                monthlyPlan.actions = monthlyPlan.actions.concat(specificActions);
                
                plan.monthlyPlans.push(monthlyPlan);
            }
            
            // Add overall recommendations
            plan.overallRecommendations = {
                immediate: highPriority.slice(0, 3),
                shortTerm: mediumPriority.slice(0, 5),
                longTerm: lowPriority.slice(0, 5)
            };
            
            return plan;
            
        } catch (error) {
            console.error('Error generating improvement plan:', error);
            return this.getDefaultImprovementPlan();
        }
    };
    
    /**
     * Determine target grade based on current grade
     */
    AdvancedAnalytics.prototype.getTargetGrade = function(currentGrade) {
        var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var currentIndex = gradeOrder.indexOf(currentGrade);
        
        if (currentIndex === -1) {
            return 'B'; // Default target if grade not recognized
        }
        
        if (currentIndex === gradeOrder.length - 1) {
            return currentGrade; // Already at top
        }
        
        // Aim for two grades higher, but not beyond A+
        var targetIndex = Math.min(currentIndex + 2, gradeOrder.length - 1);
        return gradeOrder[targetIndex];
    };
    
    /**
     * Get completion date for plan
     */
    AdvancedAnalytics.prototype.getCompletionDate = function(months) {
        var date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split('T')[0];
    };
    
    /**
     * Identify priority areas for improvement
     */
    AdvancedAnalytics.prototype.identifyPriorityAreas = function() {
        var priorityAreas = [];
        var accounts = this.creditReport.accounts || [];
        
        // Check payment history
        var paymentIssues = accounts.filter(acc => 
            acc.paymentHistory && 
            (acc.paymentHistory.includes('1') || 
             acc.paymentHistory.includes('2') || 
             acc.paymentHistory.includes('3'))
        ).length;
        
        if (paymentIssues > 0) {
            priorityAreas.push({
                area: 'Payment History',
                severity: 'High',
                accountsAffected: paymentIssues,
                action: 'Ensure all payments are made on time'
            });
        }
        
        // Check credit utilization
        var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
        var totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
        var utilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
        
        if (utilization > 50) {
            priorityAreas.push({
                area: 'Credit Utilization',
                severity: utilization > 80 ? 'Critical' : 'High',
                currentRate: utilization.toFixed(1) + '%',
                targetRate: 'Below 30%',
                action: 'Pay down balances or request credit limit increases'
            });
        }
        
        // Check for defaults
        var defaulters = this.gradingEngine.identifyDefaulters ? 
            this.gradingEngine.identifyDefaulters() : [];
        
        if (defaulters.length > 0) {
            priorityAreas.push({
                area: 'Default Accounts',
                severity: 'Critical',
                accountsCount: defaulters.length,
                action: 'Contact lenders to settle or rehabilitate accounts'
            });
        }
        
        // Check credit age
        var oldestAccount = this.getOldestAccount();
        var creditAgeMonths = oldestAccount ? this.calculateMonthsSince(oldestAccount.dateOpened) : 0;
        
        if (creditAgeMonths < 24) {
            priorityAreas.push({
                area: 'Credit History Length',
                severity: 'Medium',
                currentAge: Math.round(creditAgeMonths / 12) + ' years',
                targetAge: '2+ years',
                action: 'Keep oldest accounts open and active'
            });
        }
        
        return priorityAreas;
    };
    
    /**
     * Calculate expected impact of improvement plan
     */
    AdvancedAnalytics.prototype.calculateExpectedImpact = function(currentGrade, targetGrade) {
        var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var currentIndex = gradeOrder.indexOf(currentGrade);
        var targetIndex = gradeOrder.indexOf(targetGrade);
        
        if (currentIndex === -1 || targetIndex === -1) {
            return {
                scoreIncrease: 50,
                interestRateReduction: '1-2%',
                loanEligibility: 'Improved',
                timeline: '6 months'
            };
        }
        
        var gradeDifference = targetIndex - currentIndex;
        var scoreIncrease = 30 + (gradeDifference * 20);
        var interestReduction = (gradeDifference * 0.5) + 0.5;
        
        return {
            scoreIncrease: scoreIncrease,
            interestRateReduction: interestReduction.toFixed(1) + '%',
            loanEligibility: gradeDifference >= 2 ? 'Significantly Improved' : 'Moderately Improved',
            approvalProbability: Math.min(95, 50 + (gradeDifference * 15)) + '%',
            timeline: gradeDifference <= 2 ? '3-6 months' : '6-12 months'
        };
    };
    
    /**
     * Get monthly focus area
     */
    AdvancedAnalytics.prototype.getMonthlyFocus = function(month) {
        var focusAreas = [
            'Credit Report Review & Error Correction',
            'Payment Habit Formation',
            'Debt Reduction Strategy',
            'Credit Limit Optimization',
            'Credit Mix Improvement',
            'Long-term Maintenance'
        ];
        
        return focusAreas[month - 1] || 'Credit Health Improvement';
    };
    
    /**
     * Get month-specific actions
     */
    AdvancedAnalytics.prototype.getMonthSpecificActions = function(month, currentGrade) {
        var actions = [];
        
        switch(month) {
            case 1:
                actions.push({
                    id: 'M1-SPECIFIC',
                    description: 'Obtain free credit report from CIBIL and review for inaccuracies',
                    area: 'Credit Report',
                    priority: 'High',
                    timeRequired: '2 hours',
                    resources: ['CIBIL website', 'Dispute form']
                });
                break;
                
            case 2:
                actions.push({
                    id: 'M2-SPECIFIC',
                    description: 'Setup automatic payments or calendar reminders for all due dates',
                    area: 'Payment History',
                    priority: 'High',
                    timeRequired: '1 hour',
                    resources: ['Banking apps', 'Calendar app']
                });
                break;
                
            case 3:
                actions.push({
                    id: 'M3-SPECIFIC',
                    description: 'Contact creditors to negotiate payment plans for any overdue amounts',
                    area: 'Debt Management',
                    priority: 'Medium',
                    timeRequired: '2-3 hours',
                    resources: ['Account statements', 'Creditor contact information']
                });
                break;
                
            case 4:
                actions.push({
                    id: 'M4-SPECIFIC',
                    description: 'Request credit limit increase on your oldest credit card',
                    area: 'Credit Utilization',
                    priority: 'Medium',
                    timeRequired: '30 minutes',
                    resources: ['Credit card issuer website/customer care']
                });
                break;
                
            case 5:
                actions.push({
                    id: 'M5-SPECIFIC',
                    description: 'Consider diversifying credit mix with different types of credit',
                    area: 'Credit Mix',
                    priority: 'Low',
                    timeRequired: '1-2 hours',
                    resources: ['Research secured cards or small installment loans']
                });
                break;
                
            case 6:
                actions.push({
                    id: 'M6-SPECIFIC',
                    description: 'Review progress and update financial goals for next 6 months',
                    area: 'Planning',
                    priority: 'Low',
                    timeRequired: '2 hours',
                    resources: ['Updated credit report', 'Financial goal template']
                });
                break;
        }
        
        return actions;
    };
    
    /**
     * Suggest banks that might still provide loans (Indian context)
     */
    AdvancedAnalytics.prototype.suggestBanks = function() {
        try {
            var grade = this.gradingEngine.calculateOverallGrade ? 
                this.gradingEngine.calculateOverallGrade() : 'C';
            var accounts = this.creditReport.accounts || [];
            var defaulters = this.gradingEngine.identifyDefaulters ? 
                this.gradingEngine.identifyDefaulters() : [];
            
            var hasDefaulters = defaulters.length > 0;
            var totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
            var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
            var utilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
            
            // Indian banks with updated criteria
            var allBanks = [
                // Tier 1 Banks (Stringent)
                { 
                    name: 'State Bank of India', 
                    type: 'Public Sector Bank',
                    minGrade: 'B+', 
                    acceptsDefaulters: false, 
                    maxUtilization: 50,
                    loanTypes: ['Home Loan', 'Personal Loan', 'Car Loan'],
                    interestRange: '8.5-11.5%',
                    processingFee: '0.5-1%'
                },
                { 
                    name: 'HDFC Bank', 
                    type: 'Private Bank',
                    minGrade: 'B+', 
                    acceptsDefaulters: false, 
                    maxUtilization: 60,
                    loanTypes: ['Personal Loan', 'Credit Card', 'Business Loan'],
                    interestRange: '10-15%',
                    processingFee: '1-2%'
                },
                { 
                    name: 'ICICI Bank', 
                    type: 'Private Bank',
                    minGrade: 'B', 
                    acceptsDefaulters: false, 
                    maxUtilization: 65,
                    loanTypes: ['Personal Loan', 'Credit Card', 'Gold Loan'],
                    interestRange: '11-16%',
                    processingFee: '1-2.5%'
                },
                
                // Tier 2 Banks (Moderate)
                { 
                    name: 'Axis Bank', 
                    type: 'Private Bank',
                    minGrade: 'C+', 
                    acceptsDefaulters: true, 
                    maxUtilization: 70,
                    loanTypes: ['Personal Loan', 'Credit Card', 'Education Loan'],
                    interestRange: '12-18%',
                    processingFee: '1.5-3%'
                },
                { 
                    name: 'Kotak Mahindra Bank', 
                    type: 'Private Bank',
                    minGrade: 'C', 
                    acceptsDefaulters: true, 
                    maxUtilization: 75,
                    loanTypes: ['Personal Loan', 'Business Loan', 'Secured Credit Card'],
                    interestRange: '13-19%',
                    processingFee: '2-3%'
                },
                
                // Tier 3 (Flexible)
                { 
                    name: 'Yes Bank', 
                    type: 'Private Bank',
                    minGrade: 'C', 
                    acceptsDefaulters: true, 
                    maxUtilization: 80,
                    loanTypes: ['Personal Loan', 'Small Business Loan'],
                    interestRange: '14-22%',
                    processingFee: '2-4%'
                },
                { 
                    name: 'IndusInd Bank', 
                    type: 'Private Bank',
                    minGrade: 'C', 
                    acceptsDefaulters: true, 
                    maxUtilization: 85,
                    loanTypes: ['Personal Loan', 'Used Car Loan'],
                    interestRange: '15-24%',
                    processingFee: '2.5-4%'
                },
                
                // NBFCs (Most Flexible)
                { 
                    name: 'Bajaj Finance', 
                    type: 'NBFC',
                    minGrade: 'D+', 
                    acceptsDefaulters: true, 
                    maxUtilization: 90,
                    loanTypes: ['Personal Loan', 'Consumer Durable', 'Business Loan'],
                    interestRange: '14-24%',
                    processingFee: '3-5%'
                },
                { 
                    name: 'HDB Financial Services', 
                    type: 'NBFC',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 95,
                    loanTypes: ['Personal Loan', 'Two-Wheeler Loan'],
                    interestRange: '16-30%',
                    processingFee: '3-6%'
                },
                { 
                    name: 'Aditya Birla Finance', 
                    type: 'NBFC',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 100,
                    loanTypes: ['Personal Loan', 'Loan Against Property'],
                    interestRange: '18-36%',
                    processingFee: '4-7%'
                },
                
                // FinTech Lenders
                { 
                    name: 'EarlySalary', 
                    type: 'FinTech',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 100,
                    loanTypes: ['Salary Advance', 'Small Personal Loan'],
                    interestRange: '24-36%',
                    processingFee: '2-3%',
                    specialFeature: 'Instant approval for salaried individuals'
                },
                { 
                    name: 'MoneyTap', 
                    type: 'FinTech',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 100,
                    loanTypes: ['Credit Line', 'Personal Loan'],
                    interestRange: '18-36%',
                    processingFee: '1.5-3%',
                    specialFeature: 'Flexible credit line with interest only on amount used'
                }
            ];
            
            var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
            var currentGradeIndex = gradeOrder.indexOf(grade);
            
            // Filter banks based on criteria
            var suggestedBanks = allBanks.filter(function(bank) {
                var minGradeIndex = gradeOrder.indexOf(bank.minGrade);
                
                // Check grade requirement
                if (currentGradeIndex < minGradeIndex) return false;
                
                // Check if bank accepts defaulters
                if (hasDefaulters && !bank.acceptsDefaulters) return false;
                
                // Check utilization limit
                if (utilization > bank.maxUtilization) return false;
                
                return true;
            });
            
            // Calculate approval probability
            suggestedBanks.forEach(function(bank) {
                var minGradeIndex = gradeOrder.indexOf(bank.minGrade);
                var gradeDifference = currentGradeIndex - minGradeIndex;
                
                // Base probability
                var probability = 50 + (gradeDifference * 15);
                
                // Adjust based on defaulters
                if (hasDefaulters) {
                    probability = Math.max(20, probability - 20);
                }
                
                // Adjust based on utilization
                var utilizationPenalty = Math.max(0, utilization - 50) * 0.5;
                probability = Math.max(5, probability - utilizationPenalty);
                
                // Tier adjustment (higher tiers are more selective)
                if (bank.type === 'Public Sector Bank' || bank.type === 'Private Bank' && bank.name.includes('HDFC') || bank.name.includes('ICICI')) {
                    probability = Math.max(10, probability - 10);
                }
                
                bank.approvalProbability = Math.min(95, Math.max(5, Math.round(probability)));
                bank.recommendedLoan = bank.loanTypes[0];
                
                // Add recommendation note
                if (bank.approvalProbability >= 70) {
                    bank.recommendation = 'Strong Candidate - High Approval Chance';
                } else if (bank.approvalProbability >= 50) {
                    bank.recommendation = 'Moderate Candidate - Worth Applying';
                } else if (bank.approvalProbability >= 30) {
                    bank.recommendation = 'Low Chance - Consider with Collateral';
                } else {
                    bank.recommendation = 'Very Low Chance - Explore Other Options';
                }
            });
            
            // Sort by probability
            suggestedBanks.sort(function(a, b) {
                return b.approvalProbability - a.approvalProbability;
            });
            
            // Limit to top 10 suggestions
            return suggestedBanks.slice(0, 10);
            
        } catch (error) {
            console.error('Error suggesting banks:', error);
            return [];
        }
    };
    
    /**
     * Generate comprehensive credit health report
     */
    AdvancedAnalytics.prototype.generateComprehensiveReport = function() {
        try {
            var grade = this.gradingEngine.calculateOverallGrade ? 
                this.gradingEngine.calculateOverallGrade() : 'C';
            var defaulters = this.gradingEngine.identifyDefaulters ? 
                this.gradingEngine.identifyDefaulters() : [];
            var recommendations = this.gradingEngine.generateRecommendations ? 
                this.gradingEngine.generateRecommendations() : [];
            var utilization = this.gradingEngine.getCreditUtilization ? 
                this.gradingEngine.getCreditUtilization() : 0;
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis ? 
                this.gradingEngine.getOverallPaymentAnalysis() : { onTime: 0, delayed: 0, missed: 0, total: 0 };
            var creditAge = this.gradingEngine.getCreditAge ? 
                this.gradingEngine.getCreditAge() : 0;
            
            var report = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    analysisVersion: '2.0',
                    userConsent: this.cibilData.params?.consent || 'Not Specified'
                },
                userProfile: this.userInfo,
                summary: {
                    grade: grade,
                    creditScore: this.cibilData.credit_score || 'N/A',
                    scoreInterpretation: this.interpretCreditScore(this.cibilData.credit_score),
                    totalAccounts: this.creditReport.accounts ? this.creditReport.accounts.length : 0,
                    totalEnquiries: this.creditReport.enquiries ? this.creditReport.enquiries.length : 0,
                    creditUtilization: utilization,
                    creditAgeMonths: creditAge,
                    creditAgeYears: Math.round(creditAge / 12 * 10) / 10,
                    paymentHistory: {
                        onTime: paymentAnalysis.onTime || 0,
                        delayed: paymentAnalysis.delayed || 0,
                        missed: paymentAnalysis.missed || 0,
                        total: paymentAnalysis.total || 0,
                        onTimePercentage: paymentAnalysis.total > 0 ? 
                            Math.round((paymentAnalysis.onTime || 0) / paymentAnalysis.total * 100) : 0
                    },
                    defaultersCount: defaulters.length
                },
                riskAssessment: this.generateRiskAssessment(),
                improvementPlan: this.generateImprovementPlan(),
                bankSuggestions: this.suggestBanks(),
                visualizations: {
                    loanHistory: this.generateLoanHistoryChartData(),
                    paymentTimeline: this.generatePaymentTimelineData(),
                    utilizationTrend: this.generateUtilizationTrendData()
                },
                recommendations: {
                    immediate: recommendations.filter(r => r.priority === 'High').slice(0, 5),
                    shortTerm: recommendations.filter(r => r.priority === 'Medium').slice(0, 5),
                    longTerm: recommendations.filter(r => r.priority === 'Low').slice(0, 5)
                },
                nextSteps: this.generateNextSteps(grade, defaulters.length, utilization)
            };
            
            return report;
            
        } catch (error) {
            console.error('Error generating comprehensive report:', error);
            return this.getDefaultReport();
        }
    };
    
    /**
     * Generate risk assessment section
     */
    AdvancedAnalytics.prototype.generateRiskAssessment = function() {
        var accounts = this.creditReport.accounts || [];
        var totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
        var totalOverdue = accounts.reduce((sum, acc) => sum + (acc.amountOverdue || 0), 0);
        var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
        var utilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
        
        return {
            overallRisk: this.calculateOverallRisk(),
            riskFactors: this.identifyRiskFactors(),
            riskMetrics: {
                totalDebt: totalBalance,
                totalOverdue: totalOverdue,
                utilizationRate: utilization,
                debtToIncomeRatio: this.calculateDebtToIncomeRatio(),
                defaultProbability: this.estimateDefaultProbability()
            },
            riskMitigation: this.suggestRiskMitigation()
        };
    };
    
    /**
     * Calculate overall risk level
     */
    AdvancedAnalytics.prototype.calculateOverallRisk = function() {
        var grade = this.gradingEngine.calculateOverallGrade ? 
            this.gradingEngine.calculateOverallGrade() : 'C';
        var defaulters = this.gradingEngine.identifyDefaulters ? 
            this.gradingEngine.identifyDefaulters() : [];
        var utilization = this.gradingEngine.getCreditUtilization ? 
            this.gradingEngine.getCreditUtilization() : 0;
        
        var riskScore = 50;
        
        // Adjust based on grade
        var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var gradeIndex = gradeOrder.indexOf(grade);
        riskScore += (4 - gradeIndex) * 15; // Lower grade = higher risk
        
        // Adjust based on defaulters
        riskScore += defaulters.length * 10;
        
        // Adjust based on utilization
        if (utilization > 80) riskScore += 20;
        else if (utilization > 60) riskScore += 10;
        else if (utilization > 40) riskScore += 5;
        
        if (riskScore >= 80) return 'High';
        if (riskScore >= 60) return 'Medium-High';
        if (riskScore >= 40) return 'Medium';
        if (riskScore >= 20) return 'Low-Medium';
        return 'Low';
    };
    
    /**
     * Identify specific risk factors
     */
    AdvancedAnalytics.prototype.identifyRiskFactors = function() {
        var riskFactors = [];
        var accounts = this.creditReport.accounts || [];
        
        // Check for high utilization
        var totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
        var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
        var utilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
        
        if (utilization > 70) {
            riskFactors.push({
                factor: 'Very High Credit Utilization',
                severity: 'Critical',
                impact: 'Significantly reduces credit score and increases default risk',
                recommendation: 'Reduce balances to below 30% of limits immediately'
            });
        } else if (utilization > 50) {
            riskFactors.push({
                factor: 'High Credit Utilization',
                severity: 'High',
                impact: 'Negative impact on credit score',
                recommendation: 'Aim to reduce utilization to below 30%'
            });
        }
        
        // Check for missed payments
        var missedPayments = accounts.filter(acc => 
            acc.paymentHistory && 
            (acc.paymentHistory.includes('1') || 
             acc.paymentHistory.includes('2') || 
             acc.paymentHistory.includes('3') ||
             acc.paymentHistory.includes('4'))
        );
        
        if (missedPayments.length > 0) {
            riskFactors.push({
                factor: 'Late/Missed Payments',
                severity: 'High',
                impact: 'Payment history is 35% of credit score',
                recommendation: 'Set up automatic payments or payment reminders'
            });
        }
        
        // Check for defaults/write-offs
        var defaults = accounts.filter(acc => 
            acc.paymentHistory && 
            (acc.paymentHistory.includes('8') || 
             acc.paymentHistory.includes('9') ||
             acc.paymentHistory.includes('D') ||
             acc.paymentHistory.includes('W'))
        );
        
        if (defaults.length > 0) {
            riskFactors.push({
                factor: 'Default/Write-off Accounts',
                severity: 'Critical',
                impact: 'Severely damages credit score for 7+ years',
                recommendation: 'Contact lenders for settlement/rehabilitation'
            });
        }
        
        // Check for multiple recent inquiries
        var enquiries = this.creditReport.enquiries || [];
        var recentInquiries = enquiries.filter(function(inquiry) {
            if (!inquiry.enquiryDate) return false;
            var inquiryDate = new Date(inquiry.enquiryDate);
            var sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return inquiryDate > sixMonthsAgo;
        }).length;
        
        if (recentInquiries > 4) {
            riskFactors.push({
                factor: 'Multiple Recent Credit Inquiries',
                severity: 'Medium',
                impact: 'May indicate credit-seeking behavior',
                recommendation: 'Avoid new credit applications for 6 months'
            });
        }
        
        // Check for high debt burden
        var highDebtAccounts = accounts.filter(acc => {
            var limit = acc.highCreditAmount || 1;
            var balance = acc.currentBalance || 0;
            return (balance / limit * 100) > 90;
        });
        
        if (highDebtAccounts.length > 0) {
            riskFactors.push({
                factor: 'Accounts at Maximum Limit',
                severity: 'High',
                impact: 'Indicates potential financial stress',
                recommendation: 'Prioritize paying down maxed-out accounts'
            });
        }
        
        return riskFactors;
    };
    
    /**
     * Calculate debt-to-income ratio (estimated)
     */
    AdvancedAnalytics.prototype.calculateDebtToIncomeRatio = function() {
        // This is an estimation since we don't have income data
        var accounts = this.creditReport.accounts || [];
        var totalMonthlyDebt = accounts.reduce((sum, acc) => {
            return sum + (acc.emiAmount || (acc.currentBalance || 0) * 0.03); // Estimate 3% as minimum payment
        }, 0);
        
        // Estimate income based on employment and credit limits
        var employmentData = this.creditReport.employment || [];
        var estimatedIncome = 50000; // Default estimate
        
        if (employmentData.length > 0) {
            var occupationCode = employmentData[0].occupationCode;
            // Simple occupation-based income estimation
            var incomeMap = {
                '01': 150000, // Professional
                '02': 80000,  // Government
                '03': 75000,  // Private Salaried
                '04': 60000,  // Self-employed
                '05': 70000,  // Business
                '06': 30000,  // Daily wage
                '07': 0       // Unemployed
            };
            estimatedIncome = incomeMap[occupationCode] || 50000;
        }
        
        var dti = estimatedIncome > 0 ? (totalMonthlyDebt / estimatedIncome * 100) : 100;
        return Math.round(dti * 10) / 10;
    };
    
    /**
     * Estimate default probability
     */
    AdvancedAnalytics.prototype.estimateDefaultProbability = function() {
        var riskScore = 0;
        var accounts = this.creditReport.accounts || [];
        
        // Factor 1: Payment history (35%)
        var latePayments = 0;
        accounts.forEach(acc => {
            if (acc.paymentHistory) {
                for (var i = 0; i < Math.min(acc.paymentHistory.length, 12); i++) {
                    var char = acc.paymentHistory.charAt(i);
                    if (char >= '1' && char <= '9') latePayments++;
                }
            }
        });
        riskScore += Math.min(35, (latePayments / (accounts.length * 12)) * 100 * 0.35);
        
        // Factor 2: Utilization (30%)
        var totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
        var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
        var utilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
        riskScore += Math.min(30, utilization * 0.3);
        
        // Factor 3: Credit age (15%)
        var oldestAccount = this.getOldestAccount();
        var creditAgeMonths = oldestAccount ? this.calculateMonthsSince(oldestAccount.dateOpened) : 0;
        var ageScore = Math.min(15, (creditAgeMonths / 240) * 15); // 20 years = perfect
        riskScore += 15 - ageScore; // Older is better
        
        // Factor 4: Credit mix (10%)
        var accountTypes = new Set(accounts.map(acc => acc.accountType));
        var mixScore = accountTypes.size >= 3 ? 0 : (3 - accountTypes.size) * 3.33;
        riskScore += mixScore;
        
        // Factor 5: Recent inquiries (10%)
        var enquiries = this.creditReport.enquiries || [];
        var recentInquiries = enquiries.filter(function(inquiry) {
            if (!inquiry.enquiryDate) return false;
            var inquiryDate = new Date(inquiry.enquiryDate);
            var oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            return inquiryDate > oneYearAgo;
        }).length;
        riskScore += Math.min(10, recentInquiries * 2);
        
        return Math.min(100, Math.round(riskScore));
    };
    
    /**
     * Suggest risk mitigation strategies
     */
    AdvancedAnalytics.prototype.suggestRiskMitigation = function() {
        var mitigations = [];
        var riskFactors = this.identifyRiskFactors();
        
        riskFactors.forEach(factor => {
            if (factor.severity === 'Critical') {
                mitigations.push({
                    action: factor.recommendation,
                    priority: 'Immediate',
                    expectedImpact: 'High risk reduction'
                });
            } else if (factor.severity === 'High') {
                mitigations.push({
                    action: factor.recommendation,
                    priority: 'Urgent',
                    expectedImpact: 'Moderate risk reduction'
                });
            }
        });
        
        // Add general mitigations
        mitigations.push({
            action: 'Build emergency fund equal to 3-6 months of expenses',
            priority: 'Important',
            expectedImpact: 'Reduces likelihood of missed payments during emergencies'
        });
        
        mitigations.push({
            action: 'Consider debt consolidation if multiple high-interest debts',
            priority: 'Consider',
            expectedImpact: 'May lower overall interest and simplify payments'
        });
        
        return mitigations;
    };
    
    /**
     * Generate utilization trend data
     */
    AdvancedAnalytics.prototype.generateUtilizationTrendData = function() {
        // This would ideally come from historical data
        // For now, generate simulated trend
        var accounts = this.creditReport.accounts || [];
        var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
        var totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
        var currentUtilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
        
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var currentMonth = new Date().getMonth();
        
        var trendData = {
            labels: [],
            datasets: [{
                label: 'Credit Utilization %',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4
            }]
        };
        
        // Generate last 12 months trend (simulated)
        for (var i = 11; i >= 0; i--) {
            var monthIndex = (currentMonth - i + 12) % 12;
            trendData.labels.push(months[monthIndex]);
            
            // Simulate trend: random around current with some variation
            var variation = (Math.random() - 0.5) * 20;
            var monthUtilization = Math.max(0, Math.min(100, currentUtilization + variation));
            trendData.datasets[0].data.push(Math.round(monthUtilization * 10) / 10);
        }
        
        return trendData;
    };
    
    /**
     * Generate next steps based on current situation
     */
    AdvancedAnalytics.prototype.generateNextSteps = function(grade, defaultersCount, utilization) {
        var steps = [];
        
        // Immediate steps
        if (defaultersCount > 0) {
            steps.push({
                step: 'Contact defaulted lenders',
                timeline: 'Within 7 days',
                priority: 'Critical',
                action: 'Reach out to discuss settlement or rehabilitation options'
            });
        }
        
        if (utilization > 70) {
            steps.push({
                step: 'Reduce high credit card balances',
                timeline: 'Within 30 days',
                priority: 'High',
                action: 'Pay down cards above 70% utilization first'
            });
        }
        
        // Short-term steps
        steps.push({
            step: 'Review credit report for errors',
            timeline: 'Within 14 days',
            priority: 'High',
            action: 'Download report from CIBIL and dispute any inaccuracies'
        });
        
        steps.push({
            step: 'Setup payment automation',
            timeline: 'Within 30 days',
            priority: 'Medium',
            action: 'Enable auto-pay for minimum payments on all accounts'
        });
        
        // Medium-term steps
        if (grade === 'D' || grade === 'D+') {
            steps.push({
                step: 'Consider secured credit card',
                timeline: 'Within 60 days',
                priority: 'Medium',
                action: 'Apply for secured card to rebuild payment history'
            });
        }
        
        steps.push({
            step: 'Build emergency fund',
            timeline: '3-6 months',
            priority: 'Medium',
            action: 'Save 3 months of expenses in liquid account'
        });
        
        // Long-term steps
        steps.push({
            step: 'Request credit limit increases',
            timeline: '6+ months',
            priority: 'Low',
            action: 'After 6 months of on-time payments, request limit increases'
        });
        
        steps.push({
            step: 'Diversify credit mix',
            timeline: '6-12 months',
            priority: 'Low',
            action: 'Consider adding different types of credit (installment, revolving)'
        });
        
        return steps;
    };
    
    /**
     * Interpret credit score
     */
    AdvancedAnalytics.prototype.interpretCreditScore = function(score) {
        if (!score || isNaN(score)) return 'Score not available';
        
        var numScore = parseInt(score);
        if (numScore >= 800) return 'Excellent - Top tier creditworthiness';
        if (numScore >= 750) return 'Very Good - Strong credit profile';
        if (numScore >= 700) return 'Good - Above average credit';
        if (numScore >= 650) return 'Fair - Average credit, room for improvement';
        if (numScore >= 600) return 'Below Average - May face higher interest rates';
        return 'Poor - Significant improvement needed';
    };
    
    /**
     * Helper: Get oldest account
     */
    AdvancedAnalytics.prototype.getOldestAccount = function() {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return null;
        
        var oldest = accounts[0];
        var oldestDate = new Date(oldest.dateOpened || Date.now());
        
        for (var i = 1; i < accounts.length; i++) {
            var currentDate = new Date(accounts[i].dateOpened || Date.now());
            if (currentDate < oldestDate) {
                oldest = accounts[i];
                oldestDate = currentDate;
            }
        }
        
        return oldest;
    };
    
    /**
     * Helper: Calculate months since date
     */
    AdvancedAnalytics.prototype.calculateMonthsSince = function(dateString) {
        if (!dateString) return 0;
        try {
            var date = new Date(dateString);
            if (isNaN(date.getTime())) return 0;
            
            var now = new Date();
            return (now.getFullYear() - date.getFullYear()) * 12 + 
                   (now.getMonth() - date.getMonth());
        } catch (error) {
            return 0;
        }
    };
    
    /**
     * Default implementations for error cases
     */
    AdvancedAnalytics.prototype.getDefaultChartData = function() {
        return {
            labels: ['No Data Available'],
            datasets: [{
                label: 'Credit Data',
                data: [0],
                backgroundColor: ['rgba(200, 200, 200, 0.2)'],
                borderColor: ['rgba(200, 200, 200, 1)'],
                borderWidth: 1
            }],
            metadata: {
                totalLimit: 0,
                totalBalance: 0,
                totalOverdue: 0,
                averageUtilization: 0,
                accountTypes: {},
                accountCount: 0
            }
        };
    };
    
    AdvancedAnalytics.prototype.getDefaultImprovementPlan = function() {
        return {
            userInfo: this.userInfo,
            currentGrade: 'C',
            targetGrade: 'B',
            timeline: '6 Months',
            startDate: new Date().toISOString().split('T')[0],
            estimatedCompletion: this.getCompletionDate(6),
            monthlyPlans: [],
            priorityAreas: [],
            expectedImpact: {
                scoreIncrease: 50,
                interestRateReduction: '1-2%',
                loanEligibility: 'Improved',
                timeline: '6 months'
            }
        };
    };
    
    AdvancedAnalytics.prototype.getDefaultReport = function() {
        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                analysisVersion: '2.0',
                note: 'Generated with limited data'
            },
            userProfile: this.userInfo,
            summary: {
                grade: 'C',
                creditScore: 'N/A',
                scoreInterpretation: 'Limited data available',
                totalAccounts: 0,
                totalEnquiries: 0,
                creditUtilization: 0,
                creditAgeMonths: 0,
                paymentHistory: {
                    onTime: 0,
                    delayed: 0,
                    missed: 0,
                    total: 0,
                    onTimePercentage: 0
                },
                defaultersCount: 0
            },
            riskAssessment: {
                overallRisk: 'Unknown',
                riskFactors: [],
                riskMetrics: {
                    totalDebt: 0,
                    totalOverdue: 0,
                    utilizationRate: 0,
                    debtToIncomeRatio: 0,
                    defaultProbability: 0
                },
                riskMitigation: []
            },
            recommendations: {
                immediate: [],
                shortTerm: [],
                longTerm: []
            },
            nextSteps: []
        };
    };
    
    module.exports = AdvancedAnalytics;
    
})();