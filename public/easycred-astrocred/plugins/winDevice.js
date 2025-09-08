(function(window, undefined) {

    var isAuto = false;
    var devType = undefined;
    var device = {};

    function winDevice(appName, inject) {
        try {
            if (window.angular) {
                isAuto = true;
                if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 || window.cordova) {
                    devType = true;
                    device = { platform: 'cordova' };
                    document.addEventListener("deviceready", function() {
                        console.warn('Running on Cordova');
                        angular.bootstrap(document, [appName]);
                        //  $.getScript('https://maps.googleapis.com/maps/api/js?libraries=places&key=AIzaSyAiC98SnMtJTpFFTj5MrkTGmbfIE1n2neY');

                    }, false);
                } else {
                    console.warn('Running on Browser');
                    device = { platform: 'browser' };
                    devType = false;
                    document.addEventListener("DOMContentLoaded", function() {
                        angular.bootstrap(document, [appName]);
                        // $.getScript('https://maps.googleapis.com/maps/api/js?libraries=places&key=AIzaSyAiC98SnMtJTpFFTj5MrkTGmbfIE1n2neY');
                    });
                }


                var infoType = {};
                this.enable = function(flag) {
                    infoType.log = flag;
                    if (flag) {
                        log = console.log.bind(console);
                        error = console.error.bind(console);
                        warn = console.warn.bind(console);
                    }
                    if (!flag) {
                        log = function() {};
                        error = function() {};
                        warn = function() {};
                        console.log = function() {};
                        console.error = function() {};
                        console.warn = function() {};
                    }
                    return this;
                }
                this.device = function() {
                    if (window.angular) {
                        return angular.module(appName, inject);
                        return this;
                    } else {
                        console.error("Angularjs Not Found");
                    }
                };
                this.info = function() {
                    return this;
                }
                this.getOS = function() {
                    var userAgent = window.navigator.userAgent,
                        platform = window.navigator.platform,
                        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
                        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
                        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
                        os = null;

                    if (macosPlatforms.indexOf(platform) !== -1) {
                        os = 'Mac OS';
                    } else if (iosPlatforms.indexOf(platform) !== -1) {
                        os = 'iOS';
                    } else if (windowsPlatforms.indexOf(platform) !== -1) {
                        os = 'Windows';
                    } else if (/Android/.test(userAgent)) {
                        os = 'Android';
                    } else if (!os && /Linux/.test(platform)) {
                        os = 'Linux';
                    }

                    return os;
                }
                this.getOSAdvance = function(window) {
                    {
                        var unknown = '-';

                        // screen
                        var screenSize = '';
                        if (screen.width) {
                            width = (screen.width) ? screen.width : '';
                            height = (screen.height) ? screen.height : '';
                            screenSize += '' + width + " x " + height;
                        }

                        // browser
                        var nVer = navigator.appVersion;
                        var nAgt = navigator.userAgent;
                        var browser = navigator.appName;
                        var version = '' + parseFloat(navigator.appVersion);
                        var majorVersion = parseInt(navigator.appVersion, 10);
                        var nameOffset, verOffset, ix;

                        // Opera
                        if ((verOffset = nAgt.indexOf('Opera')) != -1) {
                            browser = 'Opera';
                            version = nAgt.substring(verOffset + 6);
                            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                                version = nAgt.substring(verOffset + 8);
                            }
                        }
                        // Opera Next
                        if ((verOffset = nAgt.indexOf('OPR')) != -1) {
                            browser = 'Opera';
                            version = nAgt.substring(verOffset + 4);
                        }
                        // Legacy Edge
                        else if ((verOffset = nAgt.indexOf('Edge')) != -1) {
                            browser = 'Microsoft Legacy Edge';
                            version = nAgt.substring(verOffset + 5);
                        }
                        // Edge (Chromium)
                        else if ((verOffset = nAgt.indexOf('Edg')) != -1) {
                            browser = 'Microsoft Edge';
                            version = nAgt.substring(verOffset + 4);
                        }
                        // MSIE
                        else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
                            browser = 'Microsoft Internet Explorer';
                            version = nAgt.substring(verOffset + 5);
                        }
                        // Chrome
                        else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
                            browser = 'Chrome';
                            version = nAgt.substring(verOffset + 7);
                        }
                        // Safari
                        else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
                            browser = 'Safari';
                            version = nAgt.substring(verOffset + 7);
                            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                                version = nAgt.substring(verOffset + 8);
                            }
                        }
                        // Firefox
                        else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
                            browser = 'Firefox';
                            version = nAgt.substring(verOffset + 8);
                        }
                        // MSIE 11+
                        else if (nAgt.indexOf('Trident/') != -1) {
                            browser = 'Microsoft Internet Explorer';
                            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
                        }
                        // Other browsers
                        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
                            browser = nAgt.substring(nameOffset, verOffset);
                            version = nAgt.substring(verOffset + 1);
                            if (browser.toLowerCase() == browser.toUpperCase()) {
                                browser = navigator.appName;
                            }
                        }
                        // trim the version string
                        if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
                        if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
                        if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

                        majorVersion = parseInt('' + version, 10);
                        if (isNaN(majorVersion)) {
                            version = '' + parseFloat(navigator.appVersion);
                            majorVersion = parseInt(navigator.appVersion, 10);
                        }

                        // mobile version
                        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

                        // cookie
                        var cookieEnabled = (navigator.cookieEnabled) ? true : false;

                        if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
                            document.cookie = 'testcookie';
                            cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
                        }

                        // system
                        var os = unknown;
                        var clientStrings = [
                            { s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/ },
                            { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/ },
                            { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/ },
                            { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/ },
                            { s: 'Windows Vista', r: /Windows NT 6.0/ },
                            { s: 'Windows Server 2003', r: /Windows NT 5.2/ },
                            { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/ },
                            { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/ },
                            { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/ },
                            { s: 'Windows 98', r: /(Windows 98|Win98)/ },
                            { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/ },
                            { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
                            { s: 'Windows CE', r: /Windows CE/ },
                            { s: 'Windows 3.11', r: /Win16/ },
                            { s: 'Android', r: /Android/ },
                            { s: 'Open BSD', r: /OpenBSD/ },
                            { s: 'Sun OS', r: /SunOS/ },
                            { s: 'Chrome OS', r: /CrOS/ },
                            { s: 'Linux', r: /(Linux|X11(?!.*CrOS))/ },
                            { s: 'iOS', r: /(iPhone|iPad|iPod)/ },
                            { s: 'Mac OS X', r: /Mac OS X/ },
                            { s: 'Mac OS', r: /(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
                            { s: 'QNX', r: /QNX/ },
                            { s: 'UNIX', r: /UNIX/ },
                            { s: 'BeOS', r: /BeOS/ },
                            { s: 'OS/2', r: /OS\/2/ },
                            { s: 'Search Bot', r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/ }
                        ];
                        for (var id in clientStrings) {
                            var cs = clientStrings[id];
                            if (cs.r.test(nAgt)) {
                                os = cs.s;
                                break;
                            }
                        }

                        var osVersion = unknown;

                        if (/Windows/.test(os)) {
                            osVersion = /Windows (.*)/.exec(os)[1];
                            os = 'Windows';
                        }

                        switch (os) {
                            case 'Mac OS':
                            case 'Mac OS X':
                            case 'Android':
                                osVersion = /(?:Android|Mac OS|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh) ([\.\_\d]+)/.exec(nAgt)[1];
                                break;

                            case 'iOS':
                                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                                break;
                        }

                        // flash (you'll need to include swfobject)
                        /* script src="//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" */
                        var flashVersion = 'no check';
                        if (typeof swfobject != 'undefined') {
                            var fv = swfobject.getFlashPlayerVersion();
                            if (fv.major > 0) {
                                flashVersion = fv.major + '.' + fv.minor + ' r' + fv.release;
                            } else {
                                flashVersion = unknown;
                            }
                        }
                    }

                    
                    var platformType = {
                        screen: screenSize,
                        browser: browser,
                        browserVersion: version,
                        browserMajorVersion: majorVersion,
                        mobile: mobile,
                        os: os,
                        osVersion: osVersion,
                        cookies: cookieEnabled,
                        flashVersion: flashVersion
                    };
                    return platformType;
                }
                this.deviceType = function() {
                    if (device.platform == 'browser') {
                        var ua = navigator.userAgent,
                            tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
                        if (/trident/i.test(M[1])) {
                            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                            return { name: 'IE', version: (tem[1] || '') };
                        }
                        if (M[1] === 'Chrome') {
                            tem = ua.match(/\bOPR|Edge\/(\d+)/)
                            if (tem != null) { return { name: 'Opera', version: tem[1] }; }
                        }
                        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
                        if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
                        return {
                            device: 'browser',
                            name: M[0],
                            version: M[1]
                        };
                    } else {
                        return {
                            device: 'cordova',
                            name: 'cordova',
                            version: 'cordova',
                        };
                    }
                }

            } else {
                console.error("Angular Not Found");
            }
        } catch (e) {
            //Error
            return e;
        }
    }
    window.winDevice = winDevice;
})(window)