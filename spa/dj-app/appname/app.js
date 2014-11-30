;(function() {
    // import deps
    require('../../../bower_components/angular/angular')
    require('../../../bower_components/angular-animate/angular-animate')


    // create a module
    angular.module('AppName', [
        'ngAnimate'
    ])


    // init controllers, directives, etc
    require('./services')
    require('./models')
    require('./controllers')
    require('./directives')


    // configure modules
    angular.module('AppName')
        .config([
            '$animateProvider',
            function($animateProvider) {
                $animateProvider.classNameFilter(/.*my-animated.*/)
            }])
})()
