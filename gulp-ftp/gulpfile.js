// ******************************
// File includes 'gulp deploy' function
// for pushing style and other file changes
// to HubSpot's Design Manager via FTP access
// ******************************

// npm install --save-dev gulp browserify babel babel-cli babel-preset-es2015 babelify del vinyl-source-stream gulp-uglify gulp-sass gulp-autoprefixer gulp-cssnano gulp-concat browser-sync breakpoint-sass

var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var uglify = require('gulp-uglify');
var del = require('del');
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat');

var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

// User added
var ftp = require('vinyl-ftp');
var prompt = require('gulp-prompt');
var gutil = require('gulp-util');

var $USERHOME = process.env.HOME;

var paths = {
    src: {
        sass: ['./src/sass/**/*.sass'],
        js: ['./src/js/**/*.js'],
        appJs: ['./src/js/index.js'],
        html: ['./*.html']
    },
    dest: {
        dist: './',
        css: './build/css',
        js: './build/js'
    },
    hubspotPublicAssetsRoot: $USERHOME + '/github/hubspot_public_assets',
    breakpointStylesheets: './node_modules/breakpoint-sass/stylesheets'

};

gulp.task('clean:css', function(done) {
    return del(['./build/css/**/*.css'], done);
});

gulp.task('clean:js', function(done) {
    return del(['./build/js/**/*.js'], done);
});

gulp.task('sass', ['clean:css'], function() {
    return gulp.src(paths.src.sass)
        .pipe(sass({
            includePaths: [
                paths.hubspotPublicAssetsRoot,
                paths.breakpointStylesheets
            ]
        })).on('error', sass.logError)
        .pipe(autoprefixer())
        .pipe(cssnano())
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(paths.dest.css))
        .pipe(browserSync.stream());
});

gulp.task('js', ['clean:js'], function() {
    return browserify({
        entries: paths.src.appJs,
        extensions: ['.js'],
        debug: true
    })
    .transform(babelify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(paths.dest.js))
        .on('end', reload);
});

// Reload html file when changes are saved
gulp.task('html', function() {
    return gulp.src(paths.src.html)
        .on('end', reload);
});

gulp.task('serve', function() {
    browserSync.init({
        server: "./"
    });

    gulp.watch(paths.src.sass, ['sass']);
    gulp.watch(paths.src.js, ['js']);
    gulp.watch(paths.src.html, ['html']);
});

// ADDED BY PATRICK
// ****************

var ftp = require('vinyl-ftp');
var prompt = require('gulp-prompt');
var gutil = require('gulp-util');

gulp.task('deploy', function() {
    return gulp.src(paths.dest.css + '/styles.css')
        .pipe(prompt.prompt({
            type: 'password',
            name: 'pass',
            message: 'Enter your HubSpot password',
        }, function(res) {
            var conn = ftp.create({
                host: 'ftp.hubapi.com',
                user: process.env.USER + '@hubspot.com',
                password: res.pass,
                port: 3200,
                secure: true
            });

            // gulp.src(['build/css/**'], { buffer: false })
                // .pipe(conn.dest('/portals/53-hubspot/content/templates/custom/page/css'));
        }));
});
// ****************

// The default task (called when we run `gulp` from cli)
gulp.task('default', ['js', 'sass'], function() {
    gulp.run('serve');
});