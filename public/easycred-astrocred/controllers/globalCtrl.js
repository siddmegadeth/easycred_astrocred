app.controller('globalCtrl', ['$scope', '$rootScope', '$timeout', function($scope, $rootScope, $timeout) {


    $timeout(function() {


        document.addEventListener('init', function(event) {
            var page = event.target;
            warn('Current Page : ');
            log(page);
        });
        document.addEventListener('show', function(event) {
            var page = event.target;
            warn('Current Page Show : ');
            log(page);
        });


        Offline.options = {
            checkOnLoad: true,
            interceptRequests: true,
            reconnect: {
                // How many seconds should we wait before rechecking.
                initialDelay: 3,
                delay: 10
                // How long should we wait between retries.
            },
            requests: true,
            game: false
        };

        Offline.on('down', function() {
            log("Down");
            log($scope.myNavigator);
            $scope.myNavigator.resetToPage('offline.html', {
                animation: 'lift'
            });
        });


        Offline.on('confirmed-up', function() {
            log("confirmed Up");

        });
        //$scope.toggleMode();
    });


    $scope.toggleMode = function(mode) {
        var element = document.body;

        var onsen = document.getElementById('light')
        warn('ONSEN BASE');
        log(onsen);
        onsen.remove();

        const onsenDark = document.createElement('link');
        onsenDark.href = 'plugins/onsen-2.12.8/css/dark-onsen-css-components.min.css';
        document.body.appendChild(onsenDark);

        const onsenDarkStyle = document.createElement('link');
        onsenDarkStyle.href = 'styles/dark.css';
        document.body.appendChild(onsenDarkStyle);

    }



}])