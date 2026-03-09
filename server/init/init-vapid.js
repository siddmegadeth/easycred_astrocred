(function() {

    const webpush = require('web-push');

    // VAPID keys should be generated only once.
    vapidKeys = module.exports = webpush.generateVAPIDKeys();

    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    webpush.setVapidDetails(
        vapidSubject,
        process.env.VAPID_PUBLICKEY,
        process.env.VAPID_PRIVATEKEY
    );
    //   vapidKeys.publicKey,
    //    vapidKeys.privateKey

    // app.get("/subscribe", async (req, res) => {
    //     const subscription = req.body
    //     const payload = JSON.stringify({
    //         title: "Hello Body",
    //         body: "Fist notification !! ",
    //     })

    //     try {
    //         const data = await webpush.sendNotification(subscription, payload)
    //         res.status(201).json({ data })
    //     } catch (error) {
    //         console.log({ error })
    //         res.status(400).json({ error })
    //     }
    // })

})();
