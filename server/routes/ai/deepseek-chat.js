(function () {
    'use strict';

    /**
     * DeepSeek AI Chat Routes
     * Powers the ASTRO AI Assistant for credit advice
     */

    const SYSTEM_PROMPT = `You are ASTRO, an AI-powered credit advisor for ASTROCRED platform. 
You help Indian users understand their credit reports, improve their credit scores, and make better financial decisions.

Your capabilities:
1. Explain credit report components (accounts, enquiries, defaults)
2. Provide actionable advice for score improvement
3. Answer questions about loans, credit cards, and financial products
4. Calculate and explain risk factors
5. Generate personalized improvement plans

Important guidelines:
- Always be helpful, clear, and encouraging
- Use simple language, avoid jargon
- When discussing amounts, use Indian Rupee (₹) format
- Reference Indian banks and financial institutions
- Be empathetic about financial difficulties
- Never provide specific investment advice (suggest consulting a SEBI advisor)
- Keep responses concise but informative (max 200 words unless asked for details)

Current user context will be provided with each message.`;

    // Chat with ASTRO AI
    app.post('/api/ai/chat', async (req, res) => {
        try {
            const { message, context } = req.body;

            if (!message) {
                return res.status(400).json({ success: false, error: 'Message is required' });
            }

            // Build context message
            let contextMessage = '';
            if (context) {
                contextMessage = `\n\nUser's Credit Profile:
- Credit Score: ${context.credit_score || 'N/A'}
- Total Accounts: ${context.total_accounts || 'N/A'}
- Default Accounts: ${context.default_accounts || 0}
- Total Overdue: ₹${context.total_overdue || 0}
- Credit Utilization: ${context.credit_utilization || 'N/A'}%
- Recent Enquiries: ${context.recent_enquiries || 0}
- Credit Age: ${context.credit_age || 'N/A'} years
- Risk Level: ${context.risk_level || 'N/A'}`;
            }

            const response = await deepseekClient.post('/chat/completions', {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT + contextMessage },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const aiReply = response.data.choices[0].message.content;

            res.json({
                success: true,
                reply: aiReply,
                tokens_used: response.data.usage?.total_tokens || 0
            });

        } catch (error) {
            console.error('DeepSeek API Error:', error.response?.data || error.message);
            res.status(500).json({
                success: false,
                error: 'AI service temporarily unavailable',
                fallback: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment, or check out our FAQ section for common questions.'
            });
        }
    });

    // Generate Credit Report Summary
    app.post('/api/ai/summarize-report', async (req, res) => {
        try {
            const { creditData } = req.body;

            if (!creditData) {
                return res.status(400).json({ success: false, error: 'Credit data is required' });
            }

            const summaryPrompt = `Summarize this credit report in plain English for the user. Highlight the top 3 issues and top 3 strengths. Be encouraging but honest.

Credit Report Data:
${JSON.stringify(creditData, null, 2)}

Format your response as:
📊 SUMMARY: [2-3 sentences overview]

⚠️ TOP ISSUES:
1. [Issue with brief explanation]
2. [Issue with brief explanation]
3. [Issue with brief explanation]

✅ STRENGTHS:
1. [Strength with brief explanation]
2. [Strength with brief explanation]
3. [Strength with brief explanation]

💡 IMMEDIATE ACTION: [One specific thing they can do today]`;

            const response = await deepseekClient.post('/chat/completions', {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: summaryPrompt }
                ],
                temperature: 0.5,
                max_tokens: 800
            });

            res.json({
                success: true,
                summary: response.data.choices[0].message.content
            });

        } catch (error) {
            console.error('Report Summary Error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to generate summary' });
        }
    });

    // Generate Improvement Plan
    app.post('/api/ai/improvement-plan', async (req, res) => {
        try {
            const { creditData, targetScore, timeframeMonths } = req.body;

            const planPrompt = `Create a ${timeframeMonths || 12}-month credit improvement plan for this user.
Target: Improve score from ${creditData.credit_score} to ${targetScore || 750}.

Current Status:
${JSON.stringify(creditData, null, 2)}

Format as a month-by-month action plan with:
- Specific actions to take
- Expected score impact
- Priority level (High/Medium/Low)
- Estimated cost if applicable`;

            const response = await deepseekClient.post('/chat/completions', {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: planPrompt }
                ],
                temperature: 0.6,
                max_tokens: 1500
            });

            res.json({
                success: true,
                plan: response.data.choices[0].message.content
            });

        } catch (error) {
            console.error('Improvement Plan Error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to generate plan' });
        }
    });

    // Quick Tips (Cached, Low-Cost)
    app.get('/api/ai/quick-tips', async (req, res) => {
        // These are pre-generated tips that don't require API calls
        const tips = [
            { category: 'payment', tip: 'Set up auto-pay for at least the minimum due on all credit cards to avoid late payment marks.' },
            { category: 'utilization', tip: 'Try to keep your credit card balances below 30% of your limit. Below 10% is even better.' },
            { category: 'enquiries', tip: 'Avoid applying for multiple loans/cards in a short period. Each application creates a hard inquiry.' },
            { category: 'age', tip: 'Keep your oldest credit card active (even with minimal use) to maintain a long credit history.' },
            { category: 'mix', tip: 'Having a healthy mix of secured (home/car loan) and unsecured (credit card/personal loan) credit helps your score.' },
            { category: 'defaults', tip: 'If you have defaults, prioritize settling the largest overdue amounts first for maximum score impact.' },
            { category: 'monitoring', tip: 'Check your credit report regularly for errors. Dispute any inaccuracies with the bureau.' }
        ];

        res.json({ success: true, tips: tips });
    });

    log('🤖 DeepSeek AI Routes Initialized');

})();
