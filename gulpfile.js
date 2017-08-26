const gulp = require('gulp');
const babel = require('gulp-babel');
const copy = require('gulp-copy');
const newer = require('gulp-newer');
const del = require('del');

const lib = 'lib';

gulp.task('clean', () => del(['lib/']));

gulp.task('build', () => gulp.src('src/**/*.js').pipe(newer(lib)).pipe(babel()).pipe(gulp.dest(lib)));

gulp.task('copy-snapshots', () => gulp.src('src/**/*.snap').pipe(newer(lib)).pipe(copy(lib, { prefix: 1 })));

gulp.task('build:test', ['build', 'copy-snapshots']);

gulp.task('watch', ['build'], () => {
  gulp.watch('src/**/*.js', ['build']);
});

gulp.task('default', ['watch']);
