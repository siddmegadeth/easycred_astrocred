// file: analytics-engine-advance-enhanced.js
(function() {
    var CIBILConstants = require('./cibil-constants.js');
    var EconomicDataService = require('./economic-data-services.js');
    
    /**
     * Enhanced Advanced Analytics Engine
     * Provides comprehensive analytics, visualization, and improvement planning
     * Integrated with CIBIL constants and Indian market context
     */
    
    function AdvancedAnalytics(cibilData, gradingEngine, riskAssessment) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.riskAssessment = riskAssessment;
        this.economicService = new EconomicDataService();
        this.creditReport = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
        
        // User information with enhanced Indian context
        this.userInfo = {
            name: cibilData.name || null,
            mobile: cibilData.mobile || null,
            email: cibilData.email || null,
            pan: cibilData.pan || null,
            gender: cibilData.gender || null,
            dateOfBirth: cibilData.date_of_birth || null,
            creditScore: cibilData.credit_score || null,
            // Additional Indian identifiers
            aadhaar: cibilData.aadhaar_number || null,
            occupation: this.getOccupationFromCode(),
            incomeEstimate: this.estimateMonthlyIncome(),
            employmentStability: this.calculateEmploymentStability()
        };
    }
    
    /**
     * Get occupation description from code
     */
    AdvancedAnalytics.prototype.getOccupationFromCode = function() {
        var employment = this.creditReport.employment || [];
        if (employment.length === 0) return null;
        
        var occupationCode = employment[0].occupationCode;
        return CIBILConstants.OCCUPATION_CODES[occupationCode] || 'Unknown';
    };
    
    /**
     * Estimate monthly income based on Indian context
     */
    AdvancedAnalytics.prototype.estimateMonthlyIncome = function() {
        try {
            var employment = this.creditReport.employment || [];
            var accounts = this.creditReport.accounts || [];
            
            // Method 1: Based on occupation code
            if (employment.length > 0) {
                var occupationCode = employment[0].occupationCode;
                var incomeMap = {
                    '01': { min: 100000, max: 500000, avg: 250000 }, // Professional
                    '02': { min: 50000, max: 200000, avg: 100000 },  // Government
                    '03': { min: 40000, max: 300000, avg: 75000 },   // Private
                    '04': { min: 30000, max: 500000, avg: 60000 },   // Self-employed
                    '05': { min: 50000, max: 1000000, avg: 100000 }, // Business
                    '06': { min: 15000, max: 40000, avg: 25000 },    // Daily wage
                    '07': { min: 0, max: 0, avg: 0 },               // Unemployed
                    '08': { min: 40000, max: 150000, avg: 80000 },   // Retired
                    '09': { min: 0, max: 30000, avg: 10000 },       // Student
                    '10': { min: 0, max: 0, avg: 0 }                // Homemaker
                };
                
                if (incomeMap[occupationCode]) {
                    return incomeMap[occupationCode];
                }
            }
            
            // Method 2: Based on credit limits (Indian banks typically give 2-3x monthly income)
            var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
            if (totalLimit > 0) {
                var estimatedIncome = totalLimit / 2.5; // Average of 2-3x
                return {
                    min: estimatedIncome * 0.6,
                    max: estimatedIncome * 1.4,
                    avg: estimatedIncome
                };
            }
            
            // Default estimate for Indian context
            return { min: 25000, max: 75000, avg: 50000 };
            
        } catch (error) {
            console.error('Error estimating income:', error);
            return { min: 30000, max: 70000, avg: 50000 };
        }
    };
    
    /**
     * Calculate employment stability score
     */
    AdvancedAnalytics.prototype.calculateEmploymentStability = function() {
        try {
            var employment = this.creditReport.employment || [];
            if (employment.length === 0) return { score: 50, stability: 'Unknown' };
            
            var occupationCode = employment[0].occupationCode;
            var stabilityScores = {
                '01': 90, // Professional - High stability
                '02': 95, // Government - Very high stability
                '03': 75, // Private - Medium-high
                '04': 60, // Self-employed - Medium
                '05': 65, // Business - Medium
                '06': 40, // Daily wage - Low
                '07': 10, // Unemployed - Very low
                '08': 85, // Retired - High
                '09': 30, // Student - Low
                '10': 50  // Homemaker - Medium
            };
            
            var score = stabilityScores[occupationCode] || 50;
            var stability = score >= 80 ? 'Very High' :
                           score >= 70 ? 'High' :
                           score >= 60 ? 'Medium-High' :
                           score >= 50 ? 'Medium' :
                           score >= 40 ? 'Low-Medium' :
                           score >= 30 ? 'Low' : 'Very Low';
            
            return { score: score, stability: stability };
            
        } catch (error) {
            return { score: 50, stability: 'Unknown' };
        }
    };
    
    /**
     * Generate enhanced loan history chart data with CIBIL categorization
     */
    AdvancedAnalytics.prototype.generateLoanHistoryChartData = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var chartData = {
                labels: [],
                datasets: [
                    {
                        label: 'Credit Limit (₹)',
                        data: [],
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        type: 'bar'
                    },
                    {
                        label: 'Current Balance (₹)',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        type: 'bar'
                    },
                    {
                        label: 'Overdue Amount (₹)',
                        data: [],
                        backgroundColor: 'rgba(255, 159, 64, 0.8)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 2,
                        type: 'bar'
                    },
                    {
                        label: 'Utilization %',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.3)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        type: 'line',
                        yAxisID: 'y1'
                    }
                ],
                metadata: {
                    totalLimit: 0,
                    totalBalance: 0,
                    totalOverdue: 0,
                    averageUtilization: 0,
                    accountTypes: {},
                    riskDistribution: {},
                    performanceMetrics: {}
                }
            };
            
            var totalLimit = 0;
            var totalBalance = 0;
            var totalOverdue = 0;
            var accountTypes = {};
            var riskDistribution = {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0
            };
            
            accounts.forEach(function(account, index) {
                var accountName = account.memberShortName || 'Unknown Bank';
                var accountType = account.accountType || 'Unknown';
                var highCredit = account.highCreditAmount || 0;
                var currentBalance = account.currentBalance || 0;
                var overdue = account.amountOverdue || 0;
                var utilization = highCredit > 0 ? (currentBalance / highCredit * 100) : 0;
                
                // Map account type to proper name
                var accountTypeName = CIBILConstants.ACCOUNT_TYPES[accountType] || accountType;
                chartData.labels.push(`${accountName} - ${accountTypeName}`);
                
                chartData.datasets[0].data.push(highCredit);
                chartData.datasets[1].data.push(currentBalance);
                chartData.datasets[2].data.push(overdue);
                chartData.datasets[3].data.push(utilization);
                
                totalLimit += highCredit;
                totalBalance += currentBalance;
                totalOverdue += overdue;
                
                // Track account types
                accountTypes[accountTypeName] = (accountTypes[accountTypeName] || 0) + 1;
                
                // Categorize risk
                var accountRisk = this.categorizeAccountRisk(account);
                riskDistribution[accountRisk]++;
            }, this);
            
            // Calculate metrics
            var averageUtilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
            
            chartData.metadata = {
                totalLimit: totalLimit,
                totalBalance: totalBalance,
                totalOverdue: totalOverdue,
                averageUtilization: parseFloat(averageUtilization.toFixed(2)),
                accountTypes: accountTypes,
                accountCount: accounts.length,
                riskDistribution: riskDistribution,
                performanceMetrics: {
                    utilizationStatus: this.getUtilizationStatus(averageUtilization),
                    overduePercentage: totalLimit > 0 ? (totalOverdue / totalLimit * 100) : 0,
                    securedVsUnsecured: this.calculateSecuredUnsecuredRatio(accounts),
                    activeVsClosed: this.calculateActiveClosedRatio(accounts)
                }
            };
            
            return chartData;
            
        } catch (error) {
            console.error('Error generating loan history chart data:', error);
            return this.getDefaultChartData();
        }
    };
    
    /**
     * Categorize account risk based on CIBIL status codes
     */
    AdvancedAnalytics.prototype.categorizeAccountRisk = function(account) {
        var statusCode = account.creditFacilityStatus;
        
        // High risk statuses
        if (['004', '005', '007', '011', '008', '009', '010'].includes(statusCode)) {
            return 'critical';
        }
        
        // Medium risk statuses
        if (['012', '013', '014', '015', '016'].includes(statusCode)) {
            return 'high';
        }
        
        // Check payment history
        var paymentAnalysis = this.gradingEngine.parsePaymentHistory(account);
        if (paymentAnalysis.missedPercentage > 30) {
            return 'high';
        } else if (paymentAnalysis.missedPercentage > 10 || paymentAnalysis.delayedPercentage > 30) {
            return 'medium';
        }
        
        // Check utilization
        var limit = account.highCreditAmount || 0;
        var balance = account.currentBalance || 0;
        if (limit > 0) {
            var utilization = (balance / limit) * 100;
            if (utilization > 90) return 'high';
            if (utilization > 70) return 'medium';
        }
        
        return 'low';
    };
    
    /**
     * Get utilization status based on CIBIL thresholds
     */
    AdvancedAnalytics.prototype.getUtilizationStatus = function(utilization) {
        var thresholds = CIBILConstants.RISK_THRESHOLDS.CREDIT_UTILIZATION;
        
        if (utilization <= thresholds.OPTIMAL) return 'Optimal';
        if (utilization <= thresholds.WARNING) return 'Moderate';
        if (utilization <= thresholds.HIGH_RISK) return 'High Risk';
        return 'Critical';
    };
    
    /**
     * Calculate secured vs unsecured ratio
     */
    AdvancedAnalytics.prototype.calculateSecuredUnsecuredRatio = function(accounts) {
        var secured = 0;
        var unsecured = 0;
        
        accounts.forEach(account => {
            var type = account.accountType || '';
            // Secured loans typically include HL, AL, GL, etc.
            if (['HL', 'AL', 'GL', 'BL'].includes(type)) {
                secured++;
            } else {
                unsecured++;
            }
        });
        
        return {
            secured: secured,
            unsecured: unsecured,
            ratio: accounts.length > 0 ? (secured / accounts.length * 100).toFixed(1) + '%' : 'N/A'
        };
    };
    
    /**
     * Calculate active vs closed ratio
     */
    AdvancedAnalytics.prototype.calculateActiveClosedRatio = function(accounts) {
        var active = 0;
        var closed = 0;
        
        accounts.forEach(account => {
            var statusCode = account.creditFacilityStatus;
            if (['000', '010'].includes(statusCode)) {
                active++;
            } else if (['001', '002'].includes(statusCode)) {
                closed++;
            }
        });
        
        return {
            active: active,
            closed: closed,
            ratio: accounts.length > 0 ? (active / accounts.length * 100).toFixed(1) + '%' : 'N/A'
        };
    };
    
    /**
     * Generate payment history timeline with CIBIL status codes
     */
    AdvancedAnalytics.prototype.generatePaymentTimelineData = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var timelineData = [];
            var self = this;
            
            accounts.forEach(function(account) {
                var accountName = account.memberShortName || 'Unknown Bank';
                var accountType = account.accountType || 'Unknown';
                var accountTypeName = CIBILConstants.ACCOUNT_TYPES[accountType] || accountType;
                var accountNumber = account.accountNumber || '';
                
                // Get payment analysis
                var paymentAnalysis = self.gradingEngine.parsePaymentHistory(account);
                
                // Add payment events
                paymentAnalysis.payments.forEach(function(payment, index) {
                    var month = new Date();
                    month.setMonth(month.getMonth() - (paymentAnalysis.payments.length - index - 1));
                    
                    var statusDescription = CIBILConstants.PAYMENT_HISTORY_CODES[payment.status] || 
                                           self.getPaymentStatusDescription(payment.status);
                    
                    timelineData.push({
                        id: `${accountNumber}-${index}`,
                        date: month.toISOString().split('T')[0],
                        account: accountName,
                        accountType: accountTypeName,
                        status: payment.status,
                        statusDescription: statusDescription,
                        category: payment.category,
                        severity: self.getPaymentSeverity(payment.status),
                        amountDue: account.emiAmount || 0,
                        amountPaid: payment.category === 'onTime' ? (account.emiAmount || 0) : 0,
                        period: `Month ${index + 1}`,
                        tooltip: `Status: ${statusDescription} | Account: ${accountName}`
                    });
                });
                
                // Add account summary
                timelineData.push({
                    id: `${accountNumber}-summary`,
                    date: new Date().toISOString().split('T')[0],
                    account: accountName,
                    accountType: accountTypeName,
                    status: 'SUMMARY',
                    category: 'summary',
                    details: {
                        totalPayments: paymentAnalysis.total,
                        onTimePayments: paymentAnalysis.categories.onTime,
                        delayedPayments: paymentAnalysis.categories.delayed,
                        missedPayments: paymentAnalysis.categories.missed,
                        onTimePercentage: paymentAnalysis.onTimePercentage,
                        currentBalance: account.currentBalance || 0,
                        overdueAmount: account.amountOverdue || 0,
                        creditLimit: account.highCreditAmount || 0,
                        utilization: account.highCreditAmount > 0 ? 
                            ((account.currentBalance || 0) / account.highCreditAmount * 100) : 0
                    }
                });
            });
            
            // Sort by date
            timelineData.sort(function(a, b) {
                return new Date(a.date) - new Date(b.date);
            });
            
            // Add trend analysis
            timelineData = this.addTrendAnalysis(timelineData);
            
            return timelineData;
            
        } catch (error) {
            console.error('Error generating payment timeline:', error);
            return [];
        }
    };
    
    /**
     * Get payment status description from CIBIL codes
     */
    AdvancedAnalytics.prototype.getPaymentStatusDescription = function(statusCode) {
        var statusMap = {
            '0': 'Current/No Dues',
            '1': '1-30 Days Past Due',
            '2': '31-60 Days Past Due',
            '3': '61-90 Days Past Due',
            '4': '91-120 Days Past Due',
            '5': '121+ Days Past Due',
            '6': 'Not Required',
            '7': 'Not Available',
            '8': 'Written Off',
            '9': 'Collection',
            'C': 'Current',
            'D': 'Default',
            'S': 'Settled',
            'W': 'Written Off',
            'X': 'No History'
        };
        
        return statusMap[statusCode] || `Unknown (${statusCode})`;
    };
    
    /**
     * Get payment severity level
     */
    AdvancedAnalytics.prototype.getPaymentSeverity = function(statusCode) {
        // High severity statuses
        if (['3', '4', '5', '8', '9', 'D', 'W'].includes(statusCode)) {
            return 'high';
        }
        
        // Medium severity
        if (['1', '2'].includes(statusCode)) {
            return 'medium';
        }
        
        // Low severity
        if (['0', '6', '7', 'C', 'X'].includes(statusCode)) {
            return 'low';
        }
        
        return 'unknown';
    };
    
    /**
     * Add trend analysis to timeline data
     */
    AdvancedAnalytics.prototype.addTrendAnalysis = function(timelineData) {
        try {
            var trendAnalysis = {
                improvementTrend: 'Stable',
                recentMissedPayments: 0,
                consecutiveOnTime: 0,
                paymentPattern: 'Regular',
                suggestedActions: []
            };
            
            // Analyze last 6 months
            var lastSixMonths = timelineData.filter(item => 
                item.category !== 'summary' && 
                new Date(item.date) >= new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            );
            
            var missedCount = lastSixMonths.filter(item => item.severity === 'high').length;
            var delayedCount = lastSixMonths.filter(item => item.severity === 'medium').length;
            
            trendAnalysis.recentMissedPayments = missedCount;
            
            if (missedCount === 0 && delayedCount === 0) {
                trendAnalysis.improvementTrend = 'Improving';
                trendAnalysis.paymentPattern = 'Excellent';
            } else if (missedCount === 0 && delayedCount <= 1) {
                trendAnalysis.improvementTrend = 'Stable';
                trendAnalysis.paymentPattern = 'Good';
            } else if (missedCount <= 1) {
                trendAnalysis.improvementTrend = 'Needs Attention';
                trendAnalysis.paymentPattern = 'Fair';
            } else {
                trendAnalysis.improvementTrend = 'Declining';
                trendAnalysis.paymentPattern = 'Poor';
            }
            
            // Add trend summary to timeline
            timelineData.push({
                id: 'trend-analysis',
                date: new Date().toISOString().split('T')[0],
                account: 'Trend Analysis',
                accountType: 'Analysis',
                status: 'TREND',
                category: 'analysis',
                details: trendAnalysis
            });
            
            return timelineData;
            
        } catch (error) {
            return timelineData;
        }
    };
    
    /**
     * Generate 6-month improvement plan with Indian context
     */
    AdvancedAnalytics.prototype.generateImprovementPlan = function() {
        try {
            var recommendations = this.gradingEngine.generateRecommendations ? 
                this.gradingEngine.generateRecommendations() : [];
            var currentGrade = this.gradingEngine.calculateOverallGrade ? 
                this.gradingEngine.calculateOverallGrade() : 'C';
            var targetGrade = this.getTargetGrade(currentGrade);
            var riskAssessment = this.riskAssessment ? this.riskAssessment.calculateDefaultProbability() : null;
            
            var plan = {
                userInfo: this.userInfo,
                currentGrade: currentGrade,
                targetGrade: targetGrade,
                timeline: '6 Months',
                startDate: new Date().toISOString().split('T')[0],
                estimatedCompletion: this.getCompletionDate(6),
                riskProfile: riskAssessment ? riskAssessment.riskLevel : 'Medium',
                monthlyPlans: [],
                priorityAreas: this.identifyPriorityAreas(),
                expectedImpact: this.calculateExpectedImpact(currentGrade, targetGrade),
                indianMarketContext: this.getIndianMarketContext()
            };
            
            // Enhanced priority grouping
            var highPriority = recommendations.filter(r => r.priority === 'High' || r.severity === 'Critical');
            var mediumPriority = recommendations.filter(r => r.priority === 'Medium' || r.severity === 'High');
            var lowPriority = recommendations.filter(r => r.priority === 'Low' || !r.severity);
            
            // Create monthly plans with Indian market focus
            for (var month = 1; month <= 6; month++) {
                var monthlyPlan = {
                    month: month,
                    focus: this.getMonthlyFocus(month, currentGrade),
                    actions: [],
                    goals: [],
                    successMetrics: [],
                    indianMarketTips: this.getIndianMarketTips(month)
                };
                
                if (month === 1) {
                    // Month 1: High priority actions with Indian context
                    highPriority.forEach(function(rec, index) {
                        if (index < 3) {
                            monthlyPlan.actions.push({
                                id: `M1-A${index + 1}`,
                                description: rec.message || rec.description,
                                area: rec.area || 'General',
                                priority: 'High',
                                timeRequired: '2-3 hours',
                                resources: this.getIndianResources(rec.area),
                                implementationSteps: this.getImplementationSteps(rec.area, 'month1')
                            });
                        }
                    }, this);
                    
                    monthlyPlan.goals.push('Download CIBIL report from official website');
                    monthlyPlan.goals.push('Identify and dispute errors in credit report');
                    monthlyPlan.goals.push('Set up NACH mandates for all loan repayments');
                    
                    monthlyPlan.successMetrics.push('CIBIL report reviewed and errors identified');
                    monthlyPlan.successMetrics.push('At least 1 error disputed if found');
                    monthlyPlan.successMetrics.push('Payment automation setup for all accounts');
                }
                else if (month <= 3) {
                    // Months 2-3: Medium priority with debt management focus
                    mediumPriority.forEach(function(rec, index) {
                        if (index < 2) {
                            monthlyPlan.actions.push({
                                id: `M${month}-A${index + 1}`,
                                description: rec.message || rec.description,
                                area: rec.area || 'General',
                                priority: 'Medium',
                                timeRequired: '1-2 hours',
                                resources: this.getIndianResources(rec.area),
                                implementationSteps: this.getImplementationSteps(rec.area, 'month2-3')
                            });
                        }
                    }, this);
                    
                    monthlyPlan.goals.push('Reduce credit card utilization below 50%');
                    monthlyPlan.goals.push('Consolidate high-interest debts if applicable');
                    monthlyPlan.goals.push('Build ₹10,000 emergency fund');
                    
                    monthlyPlan.successMetrics.push('Utilization decreased by minimum 10%');
                    monthlyPlan.successMetrics.push('No late payments this month');
                    monthlyPlan.successMetrics.push('Emergency fund target achieved');
                }
                else {
                    // Months 4-6: Credit building and maintenance
                    lowPriority.forEach(function(rec, index) {
                        if (index < 1) {
                            monthlyPlan.actions.push({
                                id: `M${month}-A${index + 1}`,
                                description: rec.message || rec.description,
                                area: rec.area || 'General',
                                priority: 'Low',
                                timeRequired: '30-60 minutes',
                                resources: this.getIndianResources(rec.area),
                                implementationSteps: this.getImplementationSteps(rec.area, 'month4-6')
                            });
                        }
                    }, this);
                    
                    monthlyPlan.goals.push('Maintain perfect payment history');
                    monthlyPlan.goals.push('Monitor CIBIL score monthly');
                    monthlyPlan.goals.push('Consider secured credit card if needed');
                    
                    monthlyPlan.successMetrics.push('Credit score increase of 15+ points');
                    monthlyPlan.successMetrics.push('No new credit inquiries without need');
                    monthlyPlan.successMetrics.push('Credit mix improved with diverse accounts');
                }
                
                // Add month-specific Indian market actions
                var specificActions = this.getMonthSpecificActions(month, currentGrade);
                monthlyPlan.actions = monthlyPlan.actions.concat(specificActions);
                
                plan.monthlyPlans.push(monthlyPlan);
            }
            
            // Add overall recommendations with Indian bank focus
            plan.overallRecommendations = {
                immediate: highPriority.slice(0, 3).map(rec => ({
                    ...rec,
                    indianContext: this.addIndianContext(rec)
                })),
                shortTerm: mediumPriority.slice(0, 5).map(rec => ({
                    ...rec,
                    indianContext: this.addIndianContext(rec)
                })),
                longTerm: lowPriority.slice(0, 5).map(rec => ({
                    ...rec,
                    indianContext: this.addIndianContext(rec)
                }))
            };
            
            // Add regulatory compliance note for India
            plan.regulatoryNote = {
                rbiGuidelines: 'Follows RBI guidelines for credit information companies',
                dataPrivacy: 'Compliant with IT Act and data protection norms',
                disputeResolution: 'Errors can be disputed through CIBIL website',
                validity: 'Negative information stays for 7 years in India'
            };
            
            return plan;
            
        } catch (error) {
            console.error('Error generating improvement plan:', error);
            return this.getDefaultImprovementPlan();
        }
    };
    
    /**
     * Get Indian market context for improvement plan
     */
    AdvancedAnalytics.prototype.getIndianMarketContext = function() {
        return {
            creditBureau: 'CIBIL (TransUnion CIBIL Limited)',
            scoreRange: '300-900',
            idealScore: '750+ for best rates',
            commonPractices: [
                'Credit cards typically have 45-day interest-free period',
                'EMI payments reported monthly to credit bureaus',
                'Multiple inquiries within 45 days counted as one for some loans',
                'Secured loans improve credit mix significantly'
            ],
            governmentSchemes: [
                'Pradhan Mantri Mudra Yojana for small businesses',
                'Credit Guarantee Fund Scheme for Micro and Small Enterprises',
                'Stand-Up India for SC/ST and women entrepreneurs'
            ]
        };
    };
    
    /**
     * Get Indian market tips for specific month
     */
    AdvancedAnalytics.prototype.getIndianMarketTips = function(month) {
        var tips = [
            "Check your CIBIL report for free once a year from official website",
            "Indian banks prefer credit utilization below 30%",
            "Having a mix of secured and unsecured credit improves score",
            "Avoid making multiple loan applications within short period"
        ];
        
        var monthSpecificTips = {
            1: "Download your CIBIL report from cibil.com for detailed analysis",
            2: "Set up NACH mandates for automatic EMI payments",
            3: "Consider debt consolidation if you have multiple high-interest loans",
            4: "Request credit limit increase on oldest credit card",
            5: "Explore secured credit cards if you have low score",
            6: "Monitor your CIBIL score monthly using free apps"
        };
        
        return {
            general: tips,
            monthSpecific: monthSpecificTips[month] || "Continue maintaining good credit habits"
        };
    };
    
    /**
     * Get Indian resources for specific areas
     */
    AdvancedAnalytics.prototype.getIndianResources = function(area) {
        var resources = {
            'Payment History': [
                'CIBIL dispute resolution portal',
                'Bank NACH mandate forms',
                'RBI Ombudsman for unresolved disputes'
            ],
            'Credit Utilization': [
                'Balance transfer options from Indian banks',
                'Debt consolidation loan calculators',
                'Personal loan EMI calculators'
            ],
            'Credit Mix': [
                'Secured credit card options in India',
                'Gold loan information',
                'Loan against property details'
            ],
            'General': [
                'CIBIL official website (cibil.com)',
                'RBI credit information guidelines',
                'Financial literacy portals by Indian banks'
            ]
        };
        
        return resources[area] || resources['General'];
    };
    
    /**
     * Get implementation steps for Indian context
     */
    AdvancedAnalytics.prototype.getImplementationSteps = function(area, phase) {
        var steps = {
            'Payment History': {
                'month1': [
                    '1. Download CIBIL report from cibil.com',
                    '2. Identify incorrect payment statuses',
                    '3. File dispute through CIBIL portal',
                    '4. Set calendar reminders for all due dates'
                ],
                'month2-3': [
                    '1. Setup NACH mandates for all loans',
                    '2. Enable SMS alerts for due dates',
                    '3. Pay at least 5 days before due date',
                    '4. Maintain payment tracker'
                ]
            },
            'Credit Utilization': {
                'month1': [
                    '1. List all credit card balances and limits',
                    '2. Calculate current utilization percentage',
                    '3. Identify cards above 50% utilization',
                    '4. Create payment priority list'
                ],
                'month2-3': [
                    '1. Pay down highest utilization cards first',
                    '2. Consider balance transfer to lower interest card',
                    '3. Request credit limit increase on oldest card',
                    '4. Avoid new credit card spending'
                ]
            }
        };
        
        return steps[area]?.[phase] || [
            '1. Review your credit report',
            '2. Identify areas for improvement',
            '3. Take corrective actions',
            '4. Monitor progress monthly'
        ];
    };
    
    /**
     * Add Indian context to recommendations
     */
    AdvancedAnalytics.prototype.addIndianContext = function(recommendation) {
        var context = {
            importance: 'High',
            impact: 'Significant',
            timeframe: '3-6 months',
            indianRegulations: 'Compliant with RBI guidelines'
        };
        
        if (recommendation.area === 'Payment History') {
            context.additionalInfo = 'Payment history contributes 35% to CIBIL score';
            context.indianSpecific = 'Late payments reported after 30 days in India';
        } else if (recommendation.area === 'Credit Utilization') {
            context.additionalInfo = 'Optimal utilization is 30% or below for Indian banks';
            context.indianSpecific = 'Credit cards have 45-day interest-free period';
        }
        
        return context;
    };
    
    /**
     * Suggest banks with enhanced Indian market analysis
     */
    AdvancedAnalytics.prototype.suggestBanks = function() {
        try {
            var grade = this.gradingEngine.calculateOverallGrade ? 
                this.gradingEngine.calculateOverallGrade() : 'C';
            var accounts = this.creditReport.accounts || [];
            var defaulters = this.gradingEngine.identifyDefaulters ? 
                this.gradingEngine.identifyDefaulters() : [];
            var riskAssessment = this.riskAssessment ? this.riskAssessment.calculateDefaultProbability() : null;
            
            var hasDefaulters = defaulters.length > 0;
            var totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
            var totalLimit = accounts.reduce((sum, acc) => sum + (acc.highCreditAmount || 0), 0);
            var utilization = totalLimit > 0 ? (totalBalance / totalLimit * 100) : 0;
            var defaultProbability = riskAssessment ? riskAssessment.probability : 50;
            
            // Enhanced Indian banks with detailed criteria
            var allBanks = [
                // Public Sector Banks (Most Stringent)
                { 
                    name: 'State Bank of India (SBI)', 
                    type: 'Public Sector Bank',
                    category: 'Tier 1',
                    minGrade: 'B+', 
                    acceptsDefaulters: false, 
                    maxUtilization: 40,
                    maxDefaultProbability: 25,
                    minCreditScore: 750,
                    loanTypes: ['Home Loan', 'Personal Loan', 'Car Loan', 'Education Loan'],
                    interestRange: '8.5-11.5%',
                    processingFee: '0.5-1% + GST',
                    turnaroundTime: '7-14 days',
                    specialFeatures: ['Lowest interest rates', 'Government backing', 'Widest branch network']
                },
                { 
                    name: 'Punjab National Bank (PNB)', 
                    type: 'Public Sector Bank',
                    category: 'Tier 1',
                    minGrade: 'B', 
                    acceptsDefaulters: false, 
                    maxUtilization: 45,
                    maxDefaultProbability: 30,
                    minCreditScore: 700,
                    loanTypes: ['Personal Loan', 'Home Loan', 'Gold Loan'],
                    interestRange: '9-13%',
                    processingFee: '0.75-1.5% + GST',
                    turnaroundTime: '5-10 days'
                },
                
                // Private Banks (Balance of Risk and Service)
                { 
                    name: 'HDFC Bank', 
                    type: 'Private Bank',
                    category: 'Tier 1',
                    minGrade: 'B+', 
                    acceptsDefaulters: false, 
                    maxUtilization: 50,
                    maxDefaultProbability: 35,
                    minCreditScore: 750,
                    loanTypes: ['Personal Loan', 'Credit Card', 'Business Loan', 'Loan Against Property'],
                    interestRange: '10-16%',
                    processingFee: '1-2% + GST',
                    turnaroundTime: '2-5 days',
                    specialFeatures: ['Quick disbursal', 'Digital process', 'Flexible repayment']
                },
                { 
                    name: 'ICICI Bank', 
                    type: 'Private Bank',
                    category: 'Tier 1',
                    minGrade: 'B', 
                    acceptsDefaulters: false, 
                    maxUtilization: 55,
                    maxDefaultProbability: 40,
                    minCreditScore: 700,
                    loanTypes: ['Personal Loan', 'Credit Card', 'Gold Loan', 'Two-Wheeler Loan'],
                    interestRange: '11-17%',
                    processingFee: '1-2.5% + GST',
                    turnaroundTime: '1-3 days',
                    specialFeatures: ['Instant approval', 'Pre-approved offers', 'EMI conversion']
                },
                { 
                    name: 'Axis Bank', 
                    type: 'Private Bank',
                    category: 'Tier 2',
                    minGrade: 'C+', 
                    acceptsDefaulters: true, 
                    maxUtilization: 65,
                    maxDefaultProbability: 50,
                    minCreditScore: 650,
                    loanTypes: ['Personal Loan', 'Credit Card', 'Education Loan', 'Business Loan'],
                    interestRange: '12-19%',
                    processingFee: '1.5-3% + GST',
                    turnaroundTime: '3-7 days'
                },
                { 
                    name: 'Kotak Mahindra Bank', 
                    type: 'Private Bank',
                    category: 'Tier 2',
                    minGrade: 'C', 
                    acceptsDefaulters: true, 
                    maxUtilization: 70,
                    maxDefaultProbability: 55,
                    minCreditScore: 600,
                    loanTypes: ['Personal Loan', 'Business Loan', 'Secured Credit Card', 'Consumer Durable'],
                    interestRange: '13-20%',
                    processingFee: '2-3% + GST',
                    turnaroundTime: '2-4 days',
                    specialFeatures: ['Pre-approved limits', 'Balance transfer options']
                },
                
                // New Generation & Small Finance Banks
                { 
                    name: 'Yes Bank', 
                    type: 'Private Bank',
                    category: 'Tier 3',
                    minGrade: 'C', 
                    acceptsDefaulters: true, 
                    maxUtilization: 75,
                    maxDefaultProbability: 60,
                    minCreditScore: 550,
                    loanTypes: ['Personal Loan', 'Small Business Loan', 'Professional Loan'],
                    interestRange: '14-22%',
                    processingFee: '2-4% + GST',
                    turnaroundTime: '1-2 days'
                },
                { 
                    name: 'IndusInd Bank', 
                    type: 'Private Bank',
                    category: 'Tier 3',
                    minGrade: 'C', 
                    acceptsDefaulters: true, 
                    maxUtilization: 80,
                    maxDefaultProbability: 65,
                    minCreditScore: 500,
                    loanTypes: ['Personal Loan', 'Used Car Loan', 'Consumer Durable Loan'],
                    interestRange: '15-24%',
                    processingFee: '2.5-4% + GST',
                    turnaroundTime: '1-3 days'
                },
                
                // NBFCs (More Flexible)
                { 
                    name: 'Bajaj Finance', 
                    type: 'NBFC',
                    category: 'Tier 4',
                    minGrade: 'D+', 
                    acceptsDefaulters: true, 
                    maxUtilization: 85,
                    maxDefaultProbability: 70,
                    minCreditScore: 450,
                    loanTypes: ['Personal Loan', 'Consumer Durable', 'Business Loan', 'Loan Against Property'],
                    interestRange: '14-26%',
                    processingFee: '3-5% + GST',
                    turnaroundTime: '24 hours',
                    specialFeatures: ['Instant disbursal', 'Flexible tenure', 'Minimal documentation']
                },
                { 
                    name: 'HDB Financial Services', 
                    type: 'NBFC',
                    category: 'Tier 4',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 90,
                    maxDefaultProbability: 75,
                    minCreditScore: 400,
                    loanTypes: ['Personal Loan', 'Two-Wheeler Loan', 'Used Car Loan'],
                    interestRange: '16-30%',
                    processingFee: '3-6% + GST',
                    turnaroundTime: '1-2 days'
                },
                { 
                    name: 'Aditya Birla Finance', 
                    type: 'NBFC',
                    category: 'Tier 4',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 95,
                    maxDefaultProbability: 80,
                    minCreditScore: 350,
                    loanTypes: ['Personal Loan', 'Loan Against Property', 'Business Loan'],
                    interestRange: '18-36%',
                    processingFee: '4-7% + GST',
                    turnaroundTime: '2-3 days'
                },
                
                // FinTech Lenders (Digital First)
                { 
                    name: 'EarlySalary', 
                    type: 'FinTech',
                    category: 'Tier 5',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 100,
                    maxDefaultProbability: 85,
                    minCreditScore: 300,
                    loanTypes: ['Salary Advance', 'Small Personal Loan', 'Credit Line'],
                    interestRange: '24-36%',
                    processingFee: '2-3% + GST',
                    turnaroundTime: '30 minutes',
                    specialFeatures: ['Instant approval for salaried individuals', 'App-based process', 'No collateral']
                },
                { 
                    name: 'MoneyTap', 
                    type: 'FinTech',
                    category: 'Tier 5',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 100,
                    maxDefaultProbability: 90,
                    minCreditScore: 300,
                    loanTypes: ['Credit Line', 'Personal Loan', 'Small Business Credit'],
                    interestRange: '18-36%',
                    processingFee: '1.5-3% + GST',
                    turnaroundTime: '1 hour',
                    specialFeatures: ['Flexible credit line', 'Interest only on amount used', 'Draw anytime']
                },
                { 
                    name: 'Lendingkart', 
                    type: 'FinTech',
                    category: 'Tier 5',
                    minGrade: 'D', 
                    acceptsDefaulters: true, 
                    maxUtilization: 100,
                    maxDefaultProbability: 95,
                    minCreditScore: 300,
                    loanTypes: ['Business Loan', 'Working Capital', 'MSME Loan'],
                    interestRange: '18-30%',
                    processingFee: '2-4% + GST',
                    turnaroundTime: '3 days',
                    specialFeatures: ['Focus on small businesses', 'Minimal documentation', 'Quick processing']
                }
            ];
            
            var gradeOrder = ['F', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
            var currentGradeIndex = gradeOrder.indexOf(grade);
            
            // Filter banks based on comprehensive criteria
            var suggestedBanks = allBanks.filter(function(bank) {
                var minGradeIndex = gradeOrder.indexOf(bank.minGrade);
                
                // Check grade requirement
                if (currentGradeIndex < minGradeIndex) return false;
                
                // Check if bank accepts defaulters
                if (hasDefaulters && !bank.acceptsDefaulters) return false;
                
                // Check utilization limit
                if (utilization > bank.maxUtilization) return false;
                
                // Check default probability
                if (defaultProbability > bank.maxDefaultProbability) return false;
                
                // Check credit score if available
                var creditScore = parseInt(this.cibilData.credit_score) || 0;
                if (creditScore > 0 && creditScore < bank.minCreditScore) return false;
                
                return true;
            }, this);
            
            // Calculate approval probability with enhanced algorithm
            suggestedBanks.forEach(function(bank) {
                var minGradeIndex = gradeOrder.indexOf(bank.minGrade);
                var gradeDifference = currentGradeIndex - minGradeIndex;
                
                // Base probability
                var probability = 50;
                
                // Grade impact
                probability += gradeDifference * 10;
                
                // Utilization impact (penalty for high utilization)
                var utilizationPenalty = Math.max(0, utilization - 30) * 0.4;
                probability -= utilizationPenalty;
                
                // Defaulters impact
                if (hasDefaulters) {
                    probability -= 15 + (defaulters.length * 5);
                }
                
                // Default probability impact
                var defaultProbabilityPenalty = Math.max(0, defaultProbability - 30) * 0.3;
                probability -= defaultProbabilityPenalty;
                
                // Account mix impact (bonus for good mix)
                var accountMixScore = this.calculateAccountMixScore();
                probability += accountMixScore * 0.5;
                
                // Employment stability impact
                probability += this.userInfo.employmentStability.score * 0.1;
                
                // Tier adjustment
                var tierAdjustment = {
                    'Tier 1': -15,
                    'Tier 2': -10,
                    'Tier 3': -5,
                    'Tier 4': 0,
                    'Tier 5': 5
                };
                probability += tierAdjustment[bank.category] || 0;
                
                // Cap probability
                bank.approvalProbability = Math.min(95, Math.max(5, Math.round(probability)));
                bank.recommendedLoan = this.getRecommendedLoanType(bank, grade);
                
                // Determine recommendation level
                if (bank.approvalProbability >= 80) {
                    bank.recommendation = 'Highly Recommended - Excellent Approval Chance';
                    bank.suggestedAction = 'Apply with confidence';
                } else if (bank.approvalProbability >= 65) {
                    bank.recommendation = 'Recommended - Good Approval Chance';
                    bank.suggestedAction = 'Worth applying with proper documentation';
                } else if (bank.approvalProbability >= 50) {
                    bank.recommendation = 'Moderate Chance - Consider with conditions';
                    bank.suggestedAction = 'Apply with collateral or co-applicant';
                } else if (bank.approvalProbability >= 35) {
                    bank.recommendation = 'Low Chance - Alternative options suggested';
                    bank.suggestedAction = 'Consider secured loan or build credit first';
                } else {
                    bank.recommendation = 'Very Low Chance - Not recommended now';
                    bank.suggestedAction = 'Focus on credit improvement first';
                }
                
                // Add improvement suggestions
                bank.improvementSuggestions = this.getBankSpecificImprovements(bank, grade, utilization, defaultProbability);
                
            }, this);
            
            // Sort by approval probability
            suggestedBanks.sort(function(a, b) {
                return b.approvalProbability - a.approvalProbability;
            });
            
            // Limit to top 8 suggestions
            return suggestedBanks.slice(0, 8);
            
        } catch (error) {
            console.error('Error suggesting banks:', error);
            return this.getDefaultBankSuggestions();
        }
    };
    
    /**
     * Calculate account mix score
     */
    AdvancedAnalytics.prototype.calculateAccountMixScore = function() {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 0;
        
        var score = 0;
        var accountTypes = new Set();
        var hasSecured = false;
        var hasUnsecured = false;
        var hasRevolving = false;
        var hasInstallment = false;
        
        accounts.forEach(account => {
            var type = account.accountType || '';
            accountTypes.add(type);
            
            // Check secured vs unsecured
            if (['HL', 'AL', 'GL', 'BL'].includes(type)) {
                hasSecured = true;
                hasInstallment = true;
            } else if (['CC', 'OD'].includes(type)) {
                hasUnsecured = true;
                hasRevolving = true;
            } else if (['PL', 'EL', 'CL', 'TL'].includes(type)) {
                hasUnsecured = true;
                hasInstallment = true;
            }
        });
        
        // Score components
        if (hasSecured && hasUnsecured) score += 30;
        if (hasRevolving && hasInstallment) score += 20;
        if (accountTypes.size >= 3) score += 20;
        if (accountTypes.size >= 2) score += 10;
        
        return Math.min(100, score);
    };
    
    /**
     * Get recommended loan type based on grade and bank
     */
    AdvancedAnalytics.prototype.getRecommendedLoanType = function(bank, grade) {
        var gradeOrder = ['F', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var gradeIndex = gradeOrder.indexOf(grade);
        
        if (gradeIndex >= gradeOrder.indexOf('B')) {
            // Good credit - suggest unsecured loans
            return bank.loanTypes.find(type => 
                type.includes('Personal Loan') || 
                type.includes('Credit Card') ||
                type.includes('Loan Against Property')
            ) || bank.loanTypes[0];
        } else if (gradeIndex >= gradeOrder.indexOf('C')) {
            // Average credit - suggest secured options
            return bank.loanTypes.find(type => 
                type.includes('Secured') ||
                type.includes('Gold Loan') ||
                type.includes('Loan Against')
            ) || bank.loanTypes[0];
        } else {
            // Poor credit - suggest basic options
            return bank.loanTypes.find(type => 
                type.includes('Small') ||
                type.includes('Basic') ||
                type.includes('Consumer')
            ) || bank.loanTypes[0];
        }
    };
    
    /**
     * Get bank-specific improvement suggestions
     */
    AdvancedAnalytics.prototype.getBankSpecificImprovements = function(bank, grade, utilization, defaultProbability) {
        var suggestions = [];
        
        // Utilization improvements
        if (utilization > bank.maxUtilization * 0.8) {
            suggestions.push(`Reduce credit utilization from ${utilization.toFixed(1)}% to below ${bank.maxUtilization}%`);
        }
        
        // Grade improvements
        var gradeOrder = ['F', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var currentIndex = gradeOrder.indexOf(grade);
        var targetIndex = gradeOrder.indexOf(bank.minGrade);
        
        if (currentIndex < targetIndex) {
            var neededImprovement = targetIndex - currentIndex;
            suggestions.push(`Improve credit grade by ${neededImprovement} level(s) to meet ${bank.name} requirements`);
        }
        
        // Default probability improvements
        if (defaultProbability > bank.maxDefaultProbability * 0.9) {
            suggestions.push(`Reduce risk profile by improving payment history and reducing debt`);
        }
        
        // General improvements
        if (suggestions.length === 0) {
            suggestions.push('Maintain current credit behavior and payment history');
        }
        
        return suggestions;
    };
    
    /**
     * Generate comprehensive credit health report with enhanced analytics
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
            var riskAssessment = this.riskAssessment ? this.riskAssessment.generateRiskReport() : null;
            
            // Get economic data
            var economicContext = this.getEconomicContext();
            
            var report = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    analysisVersion: '3.0',
                    userConsent: this.cibilData.params?.consent || 'Not Specified',
                    dataSource: 'CIBIL TransUnion',
                    jurisdiction: 'India',
                    regulatoryFramework: 'RBI Guidelines for Credit Information'
                },
                userProfile: this.userInfo,
                executiveSummary: this.generateExecutiveSummary(grade, utilization, defaulters.length),
                creditAssessment: {
                    grade: grade,
                    gradeInterpretation: this.interpretGrade(grade),
                    creditScore: this.cibilData.credit_score || 'N/A',
                    scoreInterpretation: this.interpretCreditScore(this.cibilData.credit_score),
                    scoreTrend: this.analyzeScoreTrend(),
                    componentBreakdown: this.gradingEngine.getComponentScores ? 
                        this.gradingEngine.getComponentScores() : {}
                },
                portfolioAnalysis: {
                    totalAccounts: this.creditReport.accounts ? this.creditReport.accounts.length : 0,
                    totalEnquiries: this.creditReport.enquiries ? this.creditReport.enquiries.length : 0,
                    creditUtilization: utilization,
                    utilizationStatus: this.getUtilizationStatus(utilization),
                    creditAgeMonths: creditAge,
                    creditAgeYears: Math.round(creditAge / 12 * 10) / 10,
                    ageCategory: this.getCreditAgeCategory(creditAge),
                    paymentHistory: {
                        onTime: paymentAnalysis.onTime || 0,
                        delayed: paymentAnalysis.delayed || 0,
                        missed: paymentAnalysis.missed || 0,
                        total: paymentAnalysis.total || 0,
                        onTimePercentage: paymentAnalysis.total > 0 ? 
                            Math.round((paymentAnalysis.onTime || 0) / paymentAnalysis.total * 100) : 0,
                        performanceRating: this.getPaymentPerformanceRating(paymentAnalysis)
                    },
                    defaultersCount: defaulters.length,
                    accountMix: this.analyzeAccountMix(),
                    lenderConcentration: this.analyzeLenderConcentration()
                },
                riskAssessment: riskAssessment || this.generateRiskAssessment(),
                economicContext: economicContext,
                improvementPlan: this.generateImprovementPlan(),
                bankSuggestions: this.suggestBanks(),
                visualizations: {
                    loanHistory: this.generateLoanHistoryChartData(),
                    paymentTimeline: this.generatePaymentTimelineData(),
                    utilizationTrend: this.generateUtilizationTrendData(),
                    riskHeatMap: this.generateRiskHeatMapData()
                },
                recommendations: {
                    immediate: recommendations.filter(r => r.priority === 'High' || r.severity === 'Critical').slice(0, 5),
                    shortTerm: recommendations.filter(r => r.priority === 'Medium' || r.severity === 'High').slice(0, 5),
                    longTerm: recommendations.filter(r => r.priority === 'Low' || !r.severity).slice(0, 5)
                },
                nextSteps: this.generateNextSteps(grade, defaulters.length, utilization),
                regulatoryCompliance: {
                    dataAccuracy: 'Based on CIBIL reported data',
                    disputeProcess: 'Errors can be disputed through CIBIL website',
                    validityPeriod: 'Negative information retained for 7 years',
                    consumerRights: 'Right to free annual credit report'
                }
            };
            
            return report;
            
        } catch (error) {
            console.error('Error generating comprehensive report:', error);
            return this.getDefaultReport();
        }
    };
    
    /**
     * Generate executive summary
     */
    AdvancedAnalytics.prototype.generateExecutiveSummary = function(grade, utilization, defaultersCount) {
        var summary = {
            overallStatus: '',
            keyStrengths: [],
            keyConcerns: [],
            immediateActions: [],
            outlook: ''
        };
        
        // Determine overall status
        if (grade >= 'B' && utilization <= 30 && defaultersCount === 0) {
            summary.overallStatus = 'Strong Credit Profile';
            summary.outlook = 'Positive - Eligible for best loan terms';
        } else if (grade >= 'C' && utilization <= 50 && defaultersCount === 0) {
            summary.overallStatus = 'Moderate Credit Profile';
            summary.outlook = 'Stable - Good loan eligibility with standard terms';
        } else if (grade >= 'D' && utilization <= 70 && defaultersCount <= 1) {
            summary.overallStatus = 'Developing Credit Profile';
            summary.outlook = 'Improving - Needs attention in specific areas';
        } else {
            summary.overallStatus = 'Weak Credit Profile';
            summary.outlook = 'Challenged - Significant improvement needed';
        }
        
        // Identify strengths
        if (utilization <= 30) {
            summary.keyStrengths.push('Excellent credit utilization management');
        }
        
        if (defaultersCount === 0) {
            summary.keyStrengths.push('No defaults or write-offs');
        }
        
        if (grade >= 'B') {
            summary.keyStrengths.push('Good overall credit grade');
        }
        
        // Identify concerns
        if (utilization > 50) {
            summary.keyConcerns.push(`High credit utilization (${utilization.toFixed(1)}%)`);
        }
        
        if (defaultersCount > 0) {
            summary.keyConcerns.push(`${defaultersCount} account(s) in default`);
        }
        
        if (grade <= 'D') {
            summary.keyConcerns.push('Low credit grade limiting options');
        }
        
        // Immediate actions
        if (utilization > 70) {
            summary.immediateActions.push('Reduce credit card balances immediately');
        }
        
        if (defaultersCount > 0) {
            summary.immediateActions.push('Contact lenders to resolve defaults');
        }
        
        if (grade <= 'D') {
            summary.immediateActions.push('Focus on consistent on-time payments');
        }
        
        return summary;
    };
    
    /**
     * Interpret grade
     */
    AdvancedAnalytics.prototype.interpretGrade = function(grade) {
        var interpretations = {
            'A+': 'Excellent - Top tier creditworthiness',
            'A': 'Very Good - Strong credit profile',
            'B+': 'Good - Above average credit',
            'B': 'Fair - Average credit profile',
            'C+': 'Below Average - Some improvement needed',
            'C': 'Poor - Significant improvement needed',
            'D+': 'Very Poor - Limited credit options',
            'D': 'Weak - Rebuilding required',
            'E+': 'Bad - Major issues present',
            'E': 'Very Bad - Serious credit problems',
            'F': 'Critical - Extremely poor credit'
        };
        
        return interpretations[grade] || 'Grade not available';
    };
    
    /**
     * Analyze score trend
     */
    AdvancedAnalytics.prototype.analyzeScoreTrend = function() {
        // In a real implementation, this would compare current score with historical data
        // For now, provide a simulated trend analysis
        return {
            direction: 'Stable',
            change: 'Minimal',
            factors: ['Consistent payment history', 'Stable credit utilization'],
            prediction: 'Expected to improve with continued good behavior'
        };
    };
    
    /**
     * Get credit age category
     */
    AdvancedAnalytics.prototype.getCreditAgeCategory = function(creditAgeMonths) {
        if (creditAgeMonths >= 84) return 'Established (7+ years)';
        if (creditAgeMonths >= 60) return 'Mature (5-7 years)';
        if (creditAgeMonths >= 36) return 'Developing (3-5 years)';
        if (creditAgeMonths >= 24) return 'Young (2-3 years)';
        if (creditAgeMonths >= 12) return 'New (1-2 years)';
        return 'Very New (<1 year)';
    };
    
    /**
     * Get payment performance rating
     */
    AdvancedAnalytics.prototype.getPaymentPerformanceRating = function(paymentAnalysis) {
        var onTimePercentage = paymentAnalysis.total > 0 ? 
            (paymentAnalysis.onTime || 0) / paymentAnalysis.total * 100 : 0;
        
        if (onTimePercentage >= 95) return 'Excellent';
        if (onTimePercentage >= 90) return 'Very Good';
        if (onTimePercentage >= 80) return 'Good';
        if (onTimePercentage >= 70) return 'Fair';
        if (onTimePercentage >= 60) return 'Poor';
        return 'Very Poor';
    };
    
    /**
     * Analyze account mix
     */
    AdvancedAnalytics.prototype.analyzeAccountMix = function() {
        var accounts = this.creditReport.accounts || [];
        var mix = {
            secured: 0,
            unsecured: 0,
            revolving: 0,
            installment: 0,
            byType: {},
            diversityScore: 0
        };
        
        accounts.forEach(account => {
            var type = account.accountType || '';
            var typeName = CIBILConstants.ACCOUNT_TYPES[type] || type;
            
            // Count by type
            mix.byType[typeName] = (mix.byType[typeName] || 0) + 1;
            
            // Categorize
            if (['HL', 'AL', 'GL', 'BL'].includes(type)) {
                mix.secured++;
                mix.installment++;
            } else if (['CC', 'OD'].includes(type)) {
                mix.unsecured++;
                mix.revolving++;
            } else if (['PL', 'EL', 'CL', 'TL'].includes(type)) {
                mix.unsecured++;
                mix.installment++;
            }
        });
        
        // Calculate diversity score (0-100)
        var typeCount = Object.keys(mix.byType).length;
        var hasBothSecuredUnsecured = mix.secured > 0 && mix.unsecured > 0 ? 30 : 0;
        var hasBothRevolvingInstallment = mix.revolving > 0 && mix.installment > 0 ? 30 : 0;
        var typeDiversity = Math.min(typeCount * 10, 40);
        
        mix.diversityScore = hasBothSecuredUnsecured + hasBothRevolvingInstallment + typeDiversity;
        
        return mix;
    };
    
    /**
     * Analyze lender concentration
     */
    AdvancedAnalytics.prototype.analyzeLenderConcentration = function() {
        var accounts = this.creditReport.accounts || [];
        var lenderData = {};
        var totalLimit = 0;
        
        accounts.forEach(account => {
            var lender = account.memberShortName || 'Unknown';
            var limit = account.highCreditAmount || 0;
            
            if (!lenderData[lender]) {
                lenderData[lender] = {
                    count: 0,
                    totalLimit: 0,
                    totalBalance: 0,
                    accounts: []
                };
            }
            
            lenderData[lender].count++;
            lenderData[lender].totalLimit += limit;
            lenderData[lender].totalBalance += account.currentBalance || 0;
            lenderData[lender].accounts.push({
                type: account.accountType,
                limit: limit,
                balance: account.currentBalance || 0
            });
            
            totalLimit += limit;
        });
        
        // Calculate concentration ratios
        var lenders = Object.keys(lenderData);
        var concentrationRatio = 0;
        
        if (lenders.length > 0) {
            // Herfindahl-Hirschman Index (HHI) for concentration
            var hhi = 0;
            lenders.forEach(lender => {
                var share = totalLimit > 0 ? lenderData[lender].totalLimit / totalLimit : 0;
                hhi += Math.pow(share * 100, 2);
            });
            
            concentrationRatio = hhi;
        }
        
        return {
            lenders: lenderData,
            totalLenders: lenders.length,
            concentrationRatio: concentrationRatio,
            concentrationLevel: concentrationRatio > 2500 ? 'High' : 
                               concentrationRatio > 1500 ? 'Moderate' : 'Low'
        };
    };
    
    /**
     * Get economic context
     */
    AdvancedAnalytics.prototype.getEconomicContext = function() {
        // This would normally fetch real economic data
        // For now, provide static Indian economic context
        return {
            country: 'India',
            gdpGrowth: '6.5% (FY24 estimate)',
            inflation: '4.5% (CPI)',
            repoRate: '6.5%',
            unemployment: '7.3%',
            marketSentiment: 'Moderately Positive',
            creditGrowth: '15.8% (YOY)',
            npaTrend: 'Declining',
            impactAssessment: 'Moderate economic conditions support credit growth',
            sectorAnalysis: this.getSectorAnalysis()
        };
    };
    
    /**
     * Get sector analysis based on user occupation
     */
    AdvancedAnalytics.prototype.getSectorAnalysis = function() {
        var employment = this.creditReport.employment || [];
        if (employment.length === 0) return { sector: 'Unknown', outlook: 'Neutral' };
        
        var occupationCode = employment[0].occupationCode;
        var sectorMap = {
            '01': { sector: 'Professional Services', outlook: 'Strong', growth: '8-10%' },
            '02': { sector: 'Government', outlook: 'Very Stable', growth: '5-7%' },
            '03': { sector: 'Private Sector', outlook: 'Moderate', growth: '6-8%' },
            '04': { sector: 'Self-Employed', outlook: 'Variable', growth: '4-12%' },
            '05': { sector: 'Business', outlook: 'Moderate', growth: '7-9%' },
            '06': { sector: 'Daily Wage', outlook: 'Volatile', growth: '2-5%' },
            '07': { sector: 'Unemployed', outlook: 'Challenged', growth: '0%' }
        };
        
        return sectorMap[occupationCode] || { sector: 'Other', outlook: 'Neutral', growth: '4-6%' };
    };
    
    /**
     * Generate risk heat map data
     */
    AdvancedAnalytics.prototype.generateRiskHeatMapData = function() {
        var accounts = this.creditReport.accounts || [];
        var heatMapData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: []
        };
        
        // Create datasets for each account
        accounts.forEach((account, index) => {
            var paymentAnalysis = this.gradingEngine.parsePaymentHistory(account);
            var riskValues = [];
            
            // Convert payment status to risk scores (0-100)
            paymentAnalysis.payments.slice(-12).forEach(payment => {
                var riskScore = 0;
                switch(payment.category) {
                    case 'onTime': riskScore = 20; break;
                    case 'delayed': riskScore = 60; break;
                    case 'missed': riskScore = 90; break;
                    default: riskScore = 50;
                }
                riskValues.push(riskScore);
            });
            
            // Pad if less than 12 months
            while (riskValues.length < 12) {
                riskValues.unshift(50); // Neutral risk for missing data
            }
            
            heatMapData.datasets.push({
                label: account.memberShortName || `Account ${index + 1}`,
                data: riskValues,
                backgroundColor: riskValues.map(score => {
                    if (score >= 80) return 'rgba(255, 99, 132, 0.8)';
                    if (score >= 60) return 'rgba(255, 159, 64, 0.8)';
                    if (score >= 40) return 'rgba(255, 205, 86, 0.8)';
                    return 'rgba(75, 192, 192, 0.8)';
                }),
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1
            });
        });
        
        return heatMapData;
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
                accountCount: 0,
                riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
                performanceMetrics: {}
            }
        };
    };
    
    AdvancedAnalytics.prototype.getDefaultBankSuggestions = function() {
        return [{
            name: 'General Credit Improvement Required',
            type: 'Information',
            recommendation: 'Focus on improving credit score before applying',
            suggestedAction: 'Follow the improvement plan provided'
        }];
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
            },
            indianMarketContext: this.getIndianMarketContext()
        };
    };
    
    AdvancedAnalytics.prototype.getDefaultReport = function() {
        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                analysisVersion: '3.0',
                note: 'Generated with limited data'
            },
            userProfile: this.userInfo,
            executiveSummary: {
                overallStatus: 'Limited Data Available',
                keyStrengths: [],
                keyConcerns: ['Insufficient credit data for complete analysis'],
                immediateActions: ['Provide complete credit report for accurate assessment'],
                outlook: 'Cannot determine with current data'
            },
            creditAssessment: {
                grade: 'N/A',
                gradeInterpretation: 'Insufficient data',
                creditScore: 'N/A',
                scoreInterpretation: 'Score not available'
            },
            portfolioAnalysis: {
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
                }
            },
            recommendations: {
                immediate: [],
                shortTerm: [],
                longTerm: []
            },
            nextSteps: ['Provide complete credit data for analysis']
        };
    };
    
    module.exports = AdvancedAnalytics;
    
})();