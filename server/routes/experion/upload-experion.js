// EXPERION Upload Endpoint
// Similar to CIBIL upload-cibil.js, adapted for EXPERION
(function() {
    var ExperionDataModel = require('../../schema/experion/experion-data-schema.js');

    // Upload EXPERION data
    app.post('/post/api/experion/upload', async function(req, res) {
        try {
            var { mobile, pan, email, name, gender, credit_report, credit_score, params } = req.body;
            
            // Validate required fields
            if (!mobile || !pan || !email || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: mobile, pan, email, name are required'
                });
            }

            // Normalize inputs
            pan = pan.toUpperCase().trim();
            email = email.toLowerCase().trim();
            mobile = mobile.trim();

            // Check if data already exists
            var existingData = await ExperionDataModel.findOne({
                $or: [
                    { mobile: mobile },
                    { email: email },
                    { pan: pan }
                ]
            });

            var experionData;
            
            if (existingData) {
                // Update existing record
                existingData.credit_report = credit_report || existingData.credit_report;
                existingData.credit_score = credit_score || existingData.credit_score;
                existingData.name = name || existingData.name;
                existingData.gender = gender || existingData.gender;
                existingData.params = params || existingData.params;
                existingData.updatedAt = new Date();
                
                // Clear analysis cache when data is updated
                if (existingData.analysis) {
                    existingData.analysis = {};
                }
                
                experionData = await existingData.save();
                
                log('EXPERION data updated for: ' + mobile);
            } else {
                // Create new record
                experionData = new ExperionDataModel({
                    mobile: mobile,
                    pan: pan,
                    email: email,
                    name: name,
                    gender: gender || 'Other',
                    credit_report: credit_report || [],
                    credit_score: credit_score || null,
                    params: params || {},
                    status: true,
                    success: true,
                    bureau: 'EXPERION'
                });
                
                experionData = await experionData.save();
                
                log('EXPERION data created for: ' + mobile);
            }

            res.json({
                success: true,
                message: existingData ? 'EXPERION data updated successfully' : 'EXPERION data uploaded successfully',
                data: {
                    id: experionData._id,
                    mobile: experionData.mobile,
                    pan: experionData.pan,
                    email: experionData.email,
                    name: experionData.name,
                    credit_score: experionData.credit_score,
                    bureau: 'EXPERION',
                    createdAt: experionData.createdAt,
                    updatedAt: experionData.updatedAt
                }
            });

        } catch (error) {
            log('Error uploading EXPERION data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload EXPERION data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // GET endpoint for compatibility
    app.get('/get/api/experion/upload', async function(req, res) {
        // Redirect to POST
        return res.status(405).json({
            success: false,
            error: 'Use POST method for uploading EXPERION data',
            endpoint: '/post/api/experion/upload'
        });
    });

})();

