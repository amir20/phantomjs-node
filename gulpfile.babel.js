import gulp from "gulp";
import babel from "gulp-babel";
import jasmine from "gulp-jasmine";
import rimraf from "rimraf";


gulp.task('clean', done => rimraf('lib/', done));

gulp.task('build', () => {
    return gulp.src('src/**.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('build:test', () => {
    return gulp.src('src/spec/**.js')
        .pipe(babel())
        .pipe(gulp.dest('lib/spec'));
});

gulp.task('test', ['build', 'build:test'], () => {
    return gulp.src('lib/spec/*_spec.js')
        .pipe(jasmine());
});

gulp.task('default', ['clean', 'build']);