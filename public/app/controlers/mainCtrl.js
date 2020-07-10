angular.module('mainController', ['authServices', 'userServices'])

.controller('mainCtrl', function (Auth , $timeout,$location, $rootScope, $window, $interval, $route, User,  AuthToken) {
    var app = this;
    app.loadMe = false;
    app.checkSession = function(){
        if (Auth.isLoggedIn()){
            app.checkingSession = true;
            var interval = $interval(function () {
                var token=  $window.localStorage.getItem('token');
                if (token == null){
                    $interval.cancel(interval);
                }else {
                    self.parseJwt = function(token) {
                        var base64Url = token.split('.')[1];
                        var base64 = base64Url.replace('-', '+').replace('_', '/');
                        return JSON.parse($window.atob(base64));
                    };
                    var expireTime = self.parseJwt(token);
                    var timeStamp = Math.floor(Date.now() / 1000);
                    // console.log(expireTime.exp);
                    // console.log(timeStamp);
                    var timeCheck = expireTime.exp - timeStamp;
                    // console.log('timechek: '+ timeCheck);
                    if (timeCheck <= 25){
                        // console.log('token has expire ');
                        showModal(1);
                        $interval.cancel(interval);
                    }else {
                        // console.log('token not yet expire');
                    }
                }
            },2000);
        }

    };
    app.checkSession();

    var showModal = function(option){
        app.choiceMade = false;
        app.modalHeader= undefined;
        app.modalBody =undefined;
        app.hideButton = false;


        if (option==1){
            app.modalHeader= 'Timeout warning';
            app.modalBody = 'Your sesseion will expired in 5 minute, would you like to renew session?';
            $("#myModal").modal({backdrop: "static"});

        }else if (option == 2) {
            app.hideButton = true;
            app.modalHeader = 'Logging out!';
            $("#myModal").modal({backdrop: "static"});
            $timeout(function () {
                Auth.logout();
                $location.path('/');
                hideModal();


            },2000);

        }

            $timeout(function () {
                if (!app.choiceMade){

                    hideModal();
                }
            }, 4000);





    };

    app.renewSession = function(){
        app.choiceMade = true;

        User.renewSession(app.username).then(function (data) {

            if (data.data.success){
                AuthToken.setToken(data.data.token);
                app.checkSession();
            }else {
                app.modalBody = data.data.message;
            }
        });
        hideModal();


    };
    app.endSession = function(){
        app.choiceMade = true;
        $timeout(function () {
            showModal(2);
        },1000);
        hideModal();


    }

    var hideModal = function(){
        $("#myModal").modal('hide');

    }


    $rootScope.$on('$routeChangeStart', function () {
        if (!app.checkingSession) app.checkSession();

        if (Auth.isLoggedIn()) {

            app.isLoggedIn = true;
            Auth.getUser().then(function (data) {

                app.username = data.data.username;
                app.useremail = data.data.email;

                User.getPermission().then(function (data) {
                    if (data.data.permission === 'admin' || data.data.permission === 'moderator'){
                        app.authorized = true;
                        app.loadMe = true;
                    }else {
                        app.loadMe = true;
                    }
                })


            });
        } else {

            app.isLoggedIn = false;
            app.username = '';
            app.loadMe = true;

        }
        if ($location.hash() == '_=_') $location.hash(null);
    });

    this.facebook = function () {
        // console.log($window.location.host);
        // console.log($window.location.protocol);
        app.disabled = true;
        $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/facebook';
    };
     this.google = function () {
            // console.log($window.location.host);
            // console.log($window.location.protocol);
         app.disabled= true;
            $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/google';
        };



    this.doLogin = function (loginData) {
        app.loading=true;
        app.errorMsg= false;
        app.expired =false;
        app.disabled = true;
        Auth.login(app.loginData).then(function (data) {
            if (data.data.success){
                app.loading=false;
                app.successMsg = data.data.message ;
                $timeout(function () {
                    $location.path('/about');
                    app.loginData= '';
                    app.successMsg='';
                    app.checkSession();
                },2000);

            }else {
                if (data.data.expired){
                    app.expired =true;
                    app.loading= false;
                    app.errorMsg = data.data.message;
                }else {
                    app.disabled = false;
                    app.loading= false;
                    app.errorMsg = data.data.message;
                }

            }
        });
    };

    app.logout= function () {
        showModal(2);
    }
});






