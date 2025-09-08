app.controller('profileCtrl', ['$scope', '$rootScope', '$timeout', 'profileEvent', 'stateManager', function($scope, $rootScope, $timeout, profileEvent, stateManager) {



    $timeout(function() {
        // $rootScope.$on('request_error', function(event, data) {
        //     error('request_error');
        //     $scope.loaderProfile.hide();

        // });

        // $rootScope.$on('loader_show', function(event, data) {
        //     warn('Loader Show');
        //     $scope.loaderProfile.show();
        // });

        // $rootScope.$on('loader_hide', function(event, data) {
        //     warn('loader_hide Show');
        //     $scope.loaderProfile.hide();

        // });

        $rootScope.$on('profile-updated', function() {
            warn('profile-updated event');
            $scope.profile = stateManager.getProfile();
        });
        $rootScope.$on('updated-profile', function(event, data) {
            warn('dashboard exception-occured :');
            log(event);
            log(data);
            $scope.profile = stateManager.getProfile();

        });

        ons.ready(function() {
            warn('Init profileCtrl Ready');
            $scope.isUserLogggedIn = stateManager.isUserLogggedIn();
            if (stateManager.isUserLogggedIn()) {

                if (!stateManager.isProfileCompleted()) {
                    $scope.myNavigator.resetToPage('profile-complete.html');
                }

                $scope.profile = stateManager.getProfile();
                warn("Profile : " + $scope.profile);
                log($scope.profile);
                if ($scope.profile && $scope.profile.background_image && $scope.profile.background_image.secure_url) {

                } else {
                    $scope.profile.background_image = {};
                    $scope.profile.background_image.secure_url = 'assets/not-found.png'
                }

                const profilePondInstance = document.getElementById('profilePondInstance');

                // Create a FilePond instance
                FilePond.setOptions({
                    server: {
                        url: "/post/upload/picture",
                        method: 'post'
                    },
                    allowBrowse: true,
                    allowMultiple: false,
                    maxFiles: 1,
                    maxParallelUploads: 1,
                    allowRemove: false,
                    ignoredFiles: ['.ds_store', 'thumbs.db', 'desktop.ini'],
                    onprocessfilestart: function(error, file) {
                        warn("onprocessfilestart");
                        log(file);
                        $scope.showProgress = true;

                    },
                    onaddfilestart: function(error, file) {
                        warn("onaddfilestart");
                        log(file);
                    },
                    onprocessfile: function(error, file) {
                        warn("onprocessfile");
                        log(file);
                        log(file.file);
                        log(file.status);
                        log(file.source);
                        log(JSON.parse(file.serverId));
                        var result = JSON.parse(file.serverId);

                        $scope.background_image = {};
                        $scope.background_image.url = result.url;
                        $scope.background_image.secure_url = result.secure_url;
                        $scope.background_image.thumbnail_url = result.thumbnail_url;
                        $scope.background_image.public_id = result.public_id;
                        log("background_image : ");
                        log($scope.background_image);
                        log("Profile : " + $scope.profile.profile);
                        $scope.loaderProfile.show();
                        profileEvent.updateBackgroundImage($scope.profile.profile, $scope.background_image)
                            .then(function(resp) {
                                $scope.loaderProfile.hide();
                                warn('Update Background Display Picture :');
                                log(resp)
                                if (resp.data.status && resp.data.isProfileUpdated) {
                                    warn('Updated Background Picture Updated :');
                                    log(resp.data.data);
                                    stateManager.saveProfile(resp.data.data);
                                    $scope.profile = stateManager.getProfile();
                                    ons.notification.toast('Profile Picture Successfully Changed', { timeout: 2000 });

                                } else {
                                    ons.notification.toast('Unable To Background Profile Display Picture', { timeout: 2000 });
                                }
                            });


                    },
                    onprocessfiles: function(error, file) {
                        warn("onprocessfiles");
                        log(file);
                    },
                    onremovefile: function(error, file) {
                        warn("onremovefile");
                        log(file);
                        log(file.file);
                        log(file.status);
                        log(file.source);
                        log(file.serverId);
                    },
                });


                FilePond.create(profilePondInstance);

            } else {
                $timeout(function() {
                    ons.notification.alert('User Not Logged In')
                        .then(function() {
                            stateManager.clearLocalStorage();
                            $scope.myNavigator.resetToPage('login.html');

                        });
                })
            }
        });

    });



    $scope.reload = function($done) {
        $scope.profile = stateManager.getProfile();
        $done();
    };

    $scope.editProfile = function() {
        $scope.myNavigator.pushPage('profile-complete.html', {
            data: {
                isEdit: true
            }
        });

    }

    $scope.editInformation = function() {
        $scope.myNavigator.pushPage('juyspay-onboarding.html', {
            data: {
                isEdit: true
            }
        });

    }




    $scope.logout = function() {
        stateManager.clearLocalStorage();
        $scope.isUserLogggedIn = false;
        $scope.myNavigator.resetToPage('verify.html', {
            data: {
                refresh: true
            }
        });
    }

}])