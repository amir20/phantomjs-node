var gulp = require('gulp');
var del = require('del');
var babel = require('gulp-babel');
var jasmine = require('gulp-jasmine');


gulp.task('clean', function () {
    return del(['lib/']);
});

gulp.task('build', function () {
    return gulp.src('src/**.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('build:test', function () {
    return gulp.src('src/spec/**.js')
        .pipe(babel())
        .pipe(gulp.dest('lib/spec'));
});

gulp.task('test', ['build', 'build:test'], function () {
    return gulp.src('lib/spec/*_spec.js')
        .pipe(jasmine());
});

gulp.task('default', ['clean', 'build']);