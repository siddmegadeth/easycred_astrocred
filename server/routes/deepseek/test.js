(function() {

    /**
     * @swagger
     * /get/deep/seek/test:
     *   get:
     *     tags:
     *       - deepseek
     *     summary: Test DeepDeek API Test
     *     description:  Test DeepDeek API Test
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *         application/x-www-form-urlencoded:
     *           schema:
     *             type: object
     *             properties:
     *               user:
     *                 type: string
     *                 description: no params
     *     responses:
     *       200:
     *         description: Success Test 200 From DeepSeek Test API.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: boolean
     *                   example: true
     *                 isVerified:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Verified"
     *                 data:
     *                   type: object
     *       500:
     *         description: Internal server error or failed authentication/profile creation.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: boolean
     *                   example: true
     *                 isVerified:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: "Failed To Authenticate Using OTP"
     *                 data:
     *                   type: array
     */


    app.get("/get/deep/seek/test", function(req, resp) {
        log('/get/deep/seek/test');
        resp.send({ status: true, isVerified: true, message: 'Deep Seek TEST API Success', data: {} });

    });

})();