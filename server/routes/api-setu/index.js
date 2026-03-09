(function () {
    'use strict';

    const ApiSetuService = require('./api-setu-service');

    /**
     * API Setu Routes
     */

    // Fetch and Verify DL
    app.post('/api/setu/verify/dl', async (req, res) => {
        try {
            const { dlNo, dob, mobile } = req.body;
            if (!dlNo || !dob || !mobile) return res.status(400).json({ success: false, message: 'Params missing' });

            const data = await ApiSetuService.getDrivingLicense(dlNo, dob);

            // Update profile
            await ProfileModel.updateOne({ mobile: mobile }, {
                $addToSet: { 'api_setu.verifiedAssets': 'DL' },
                'api_setu.isVerified': true,
                'api_setu.lastCheck': new Date()
            });

            res.json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Fetch and Verify RC
    app.post('/api/setu/verify/rc', async (req, res) => {
        try {
            const { regNo, chassisNo, mobile } = req.body;
            if (!regNo || !chassisNo || !mobile) return res.status(400).json({ success: false, message: 'Params missing' });

            const data = await ApiSetuService.getVehicleRC(regNo, chassisNo);

            await ProfileModel.updateOne({ mobile: mobile }, {
                $addToSet: { 'api_setu.verifiedAssets': 'RC' },
                'api_setu.isVerified': true,
                'api_setu.lastCheck': new Date()
            });

            res.json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

})();
