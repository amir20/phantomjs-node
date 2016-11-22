import gulp from "gulp";
import babel from "gulp-babel";
import copy from "gulp-copy";
import newer from "gulp-newer";
import del from "del";
import {spawn} from "child_process";

const lib = 'lib';

gulp.task('clean', () => del(['lib/']));

gulp.task('build', () => {
    return gulp.src('src/**/*.js')
        .pipe(newer(lib))
        .pipe(babel())
        .pipe(gulp.dest(lib));
});

gulp.task('copy-snapshots', () => {
  return gulp.src('src/**/*.snap')
        .pipe(newer(lib))
        .pipe(copy(lib, {prefix: 1}));
});

gulp.task('build:test', ['build', 'copy-snapshots']);

gulp.task('watch', ['build'], () => {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('default', ['watch']);
