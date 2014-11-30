module.exports = {
    apps: {
        appname: {
            main: 'app.js',
            path: './spa/dj-app/appname/',
            bundle: 'appname.min.js',
            dest: './dj-app/static/dj-app/js/',
            watch: ['./spa/dj-app/appname/**/*.js']
        }
    }
}
