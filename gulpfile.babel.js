import gulp from "gulp";
import del from "del";
import babel from "gulp-babel";
import jasmine from "gulp-jasmine";


gulp.task('clean', () => del(['lib/']));

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