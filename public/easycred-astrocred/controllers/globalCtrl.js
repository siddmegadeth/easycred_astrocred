app.controller('globalCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', function($location, $timeout, $scope, stateManager, $rootScope) {

    $timeout(function() {
        window.onload = function() {
            stateManager.checkAccessToken()
                .then(function(resp) {
                    warn('Access Token Status :');
                    log(resp);
                    if (resp.data.isLoggedIn) {
                        $rootScope.$emit('init', {});
                        $rootScope.$emit('init-navbar', {});
                        $scope.isLoggedIn = true;
                    } else {
                        $scope.isLoggedIn = false;
                        stateManager.clearLocalStorage();
                        $location.url("/login");
                    }
                });
        }
    });


    $rootScope.$on('init', function() {
        $timeout(function() {

        }, 500);
    });

    $rootScope.$on('progress_loader_show', function() {
        warn('Loader Show :');
        $scope.loaderShow = true;
    });

    $rootScope.$on('progress_loader_hide', function() {
        warn('Loader Hide :');
        $scope.loaderShow = false;

    });


    $scope.initAutoComplete = function() {
        log(document.getElementById("searchText"));
        const autoCompleteJS = new autoComplete({
            selector: "#searchText",
            placeHolder: "Search Customer Id, Loan Account",
            submit: false,
            threshold: 1,
            searchEngine: "loose",
            data: {
                src: '/get/search/typeahed/all/personal/loans',
                cache: true,
                keys: ['fullname']
            },
            query: (input) => {
                log(input);
                if (input.length == 0) {
                    warn('Final Result :');

                }
                return input;
            },
            resultsList: {
                element: (list, data) => {
                    const info = document.createElement("p");
                    if (data.results.length > 0) {
                        info.innerHTML = `Displaying <strong>${data.results.length}</strong> out of <strong>${data.matches.length}</strong> results`;
                    } else {
                        info.innerHTML = `Found <strong>${data.matches.length}</strong> matching results for <strong>"${data.query}"</strong>`;
                    }
                    list.prepend(info);
                },
                noResults: true,
                maxResults: undefined,
                tabSelect: true
            },
            resultItem: {
                element: (item, data) => {

                    var split = data.key.split('_');
                    var i = 0;
                    var complete = '';
                    while (i != split.length) {
                        complete = complete + split[i] + " ";
                        i++;
                    };

                    // Modify Results Item Style
                    item.style = "display: flex; justify-content: space-between;";
                    // Modify Results Item Content
                    item.innerHTML = `
                              <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                                ${data.match}
                              </span>
                              <span style="display: flex; align-items: center; font-size: 13px; font-weight: 100; text-transform: uppercase; color: rgba(0,0,0,.2);">
                                ${complete}
                              </span>`;
                },
                highlight: true
            }
        });
        document.querySelector("#searchText").addEventListener("selection", function(event) {
            const feedback = event.detail;
            autoCompleteJS.input.blur();
            // Prepare User's Selected Value
            const selection = feedback.selection.value[feedback.selection.key];
            // Render selected choice to selection div
            // Replace Input value with the selected value
            autoCompleteJS.input.value = selection;
            // Console log autoComplete data feedback
            console.log(selection);
            log(feedback);

            warn('Final Result :');
        });

    };
}]);