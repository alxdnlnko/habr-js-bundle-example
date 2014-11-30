var gulp = require('gulp'),
    gutil = require('gulp-util'),
    gulpif = require('gulp-if'),
    rename = require('gulp-rename'),
    streamify = require('gulp-streamify'),
    uglify = require('gulp-uglify')

var browserify = require('browserify'),
    through = require('through2')

var path = require('path'),
    _ = require('lodash'),
    async = require('async'),
    minimist = require('minimist')

var config = require('./config-spa')


function printArgumentsErrorAndExit() {
    gutil.log(gutil.colors.red('You must specify the app or'), gutil.colors.yellow('--all'))
    gutil.log(gutil.colors.red('Available apps:'))
    _.each(config.apps, function(item, i) {
        gutil.log(gutil.colors.yellow('  --app ' + i))
    })

    // break the task on error
    process.exit()
}

var argv = {parsed: false}
gulp.task('parseArgs', function() {
    // prevent multiple parsing when watching
    if (argv.parsed) return true

    // check the process arguments
    var options = minimist(process.argv)
    if (_.size(options) === 1) {
        printArgumentsErrorAndExit()
    }

    var apps = []
    if (options.app && config.apps[options.app]) {
        apps.push(options.app)
    } else if (options.all) {
        apps = _.keys(config.apps)
    }

    if (!apps.length) printArgumentsErrorAndExit()
    argv.apps = apps

    if (options.dev) argv.dev = true

    argv.parsed = true
})


function bundle() {
    return through.obj(function(file, enc, cb) {
        var b = browserify({entries: file.path})

        file.contents = b.bundle()
        this.push(file)
        cb()
    })
}


gulp.task('build', ['parseArgs'], function(cb) {
    var prefix = gutil.colors.yellow('  ->')
    async.each(argv.apps,
        function(app, cb) {
            gutil.log(prefix, 'Building', gutil.colors.cyan(app), '...')
            var conf = config.apps[app]
            if (!conf) return cb(new Error('No conf for app ' + app))

            gulp.src(path.join(conf.path, conf.main))
                .pipe(bundle())
                .pipe(gulpif(!argv.dev, streamify(uglify())))
                .pipe(rename(conf.bundle))
                .pipe(gulp.dest(conf.dest))
                .on('end', function() { cb() })
        },
        function(err) {
            cb(err)
        }
    )
})


gulp.task('watch', ['build'], function() {
    var targets = []
    _.each(argv.apps, function(app) {
        var conf = config.apps[app]
        if (!conf) return

        if (conf.watch) {
            if (_.isArray(conf.watch)) {
                targets = _.union(targets, conf.watch)
            } else {
                targets.push(conf.watch)
            }
        }
    })
    targets = _.uniq(targets)

    // handle Ctrl+C and build a minified version on exit
    process.on('SIGINT', function() {
        if (!argv.dev) process.exit()

        argv.dev = false

        console.log()
        gutil.log(gutil.colors.yellow('Building a minified version...'))

        gulp.stop()
        gulp.start('build', function() {
            process.exit()
        })
    })

    // start watching files
    gulp.watch(targets, ['build'])
})


gulp.task('default', function() {
    console.log()
    console.log('Available tasks:')
    console.log('  ', gutil.colors.cyan('build'), '  ', 'build applications')
    console.log('  ', gutil.colors.cyan('watch'), '  ', 'watch files and rebuild on changes')

    console.log()
    console.log('Parameters:')
    console.log('  ', gutil.colors.cyan('--app [app name]'), '  ', 'build only a specified application')
    console.log('  ', gutil.colors.cyan('--all'), '  ', 'build all applications')
    console.log('  ', gutil.colors.cyan('--dev'), '  ', 'don\'t uglify a bundle')

    console.log()
})

