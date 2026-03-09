app.controller('verifyCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'utility', 'geoIPServices', function($scope, $rootScope, $timeout, stateManager, utility, geoIPServices) {

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

}])