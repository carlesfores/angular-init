const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const watchify = require('watchify');
const babel = require('babelify');
const copy = require('gulp-copy');
const jslint = require('gulp-jslint');
const eslint = require('gulp-eslint');
const jasmine = require('gulp-jasmine');
const Server = require('karma').Server;

const sass = require('gulp-sass');
const serve = require('gulp-serve');
const sourceFiles = ['./src/**/*.*', '!./src/**/*.es', '!./src/**/*.pug'];

// define functions
function compile () {
    'use strict';
    let bundler = watchify(browserify('./src/index.js', {debug: true}).transform(babel.configure({
        presets: ['es2015']
    })));
    function rebundle () {
        return bundler.bundle()
            .on('error', function (err) {
                console.error(err);
                this.emit('end');
            })
            .pipe(source('build.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./build'));
    }
    return rebundle();
}

function copyStatics () {
    'use strict';
    return gulp.src(sourceFiles)
        .pipe(copy('build', {prefix: 1}));
}

function sassTask() {
    return gulp.src('./src/styles/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./build/styles'));
}

function templates() {
    'use strict';
    gulp.src('./src/**/*.html')
        .pipe(gulp.dest('./build/'))
}

function assets() {
    'use strict';
    gulp.src('./src/assets/*.*')
        .pipe(gulp.dest('./build/assets'))
}

function esLint () {
    return gulp.src(['./src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

// define gup task
gulp.task('serve', serve('build'));

gulp.task('td', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js'
    }, done).start();
});

gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('buildSimple', ['esLint'],() => {
    return compile();
});

gulp.task('copyStatics', () => {
    return copyStatics();
});

gulp.task('templates', () => {
    return templates();
});

gulp.task('sass', function () {
    return sassTask();
});

gulp.task('assets', function () {
    return assets();
});

gulp.task('esLint', function () {
    return esLint();
});

gulp.task('watch', function () {
    gulp.watch('./src/**/*.js', ['buildSimple']);
    gulp.watch('./src/styles/**/*.scss', ['sass']);
    gulp.watch('./src/**/*.html', ['templates']);
});

gulp.task('default', ['buildSimple', 'assets', 'copyStatics', 'templates', 'sass', 'serve', 'watch']);

gulp.task('build', ['buildSimple', 'copyStatics', 'templates', 'sass']);
