// EQUIFAX Upload Endpoint
// Similar to CIBIL upload-cibil.js, adapted for EQUIFAX
(function() {
    var EquifaxDataModel = require('../../schema/equifax/equifax-data-schema.js');

    // Upload EQUIFAX data
    app.post('/post/api/equifax/upload', async function(req, res) {
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
            var existingData = await EquifaxDataModel.findOne({
                $or: [
                    { mobile: mobile },
                    { email: email },
                    { pan: pan }
                ]
            });

            var equifaxData;
            
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
                
                equifaxData = await existingData.save();
                
                log('EQUIFAX data updated for: ' + mobile);
            } else {
                // Create new record
                equifaxData = new EquifaxDataModel({
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
                    bureau: 'EQUIFAX'
                });
                
                equifaxData = await equifaxData.save();
                
                log('EQUIFAX data created for: ' + mobile);
            }

            res.json({
                success: true,
                message: existingData ? 'EQUIFAX data updated successfully' : 'EQUIFAX data uploaded successfully',
                data: {
                    id: equifaxData._id,
                    mobile: equifaxData.mobile,
                    pan: equifaxData.pan,
                    email: equifaxData.email,
                    name: equifaxData.name,
                    credit_score: equifaxData.credit_score,
                    bureau: 'EQUIFAX',
                    createdAt: equifaxData.createdAt,
                    updatedAt: equifaxData.updatedAt
                }
            });

        } catch (error) {
            log('Error uploading EQUIFAX data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload EQUIFAX data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // GET endpoint for compatibility
    app.get('/get/api/equifax/upload', async function(req, res) {
        // Redirect to POST
        return res.status(405).json({
            success: false,
            error: 'Use POST method for uploading EQUIFAX data',
            endpoint: '/post/api/equifax/upload'
        });
    });

})();

