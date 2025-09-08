(function() {



    // JWT Common Function
    createJWT = module.exports = function(profile) {
        log('Create JWT :');
        log(profile.profile_info.mobile);
        var timer = moment().add(process.env.TIMETOLIVE_JWT, 'days').unix();
        var payload = {
            sub: new Date().valueOf() + customId({
                profileId: process.env.profileId || profile.profile_info.mobile, // Optional
                randomLength: 2, // Optional
                lowerCase: true // Optional
            }),
            iat: moment().unix(),
            exp: timer
        };
        log("JWT Token Expiry Set For :");
        log(timer);
        log('Payload :');
        log(payload);
        var token = jwt.encode(payload, process.env.ACCESSTOKEN_SECRET);
        log("JWT Token :");
        log(token);
        // res.cookie('easycred_app_retail_access_token', token, {
        //     expires: timer,
        //     maxAge: timer
        // });
        return token;
    }

})()