import gulp from "gulp";
import babel from "gulp-babel";
import jasmine from "gulp-jasmine";
import eslint from "gulp-eslint";
import del from "del";


gulp.task('clean', () => del(['lib/']));

gulp.task('lint', () => {
    return gulp.src('src/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('build', ['clean'], () => {
    return gulp.src('src/**.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});

gulp.task('build:test', ['build'], () => {
    return gulp.src('src/spec/**.js')
        .pipe(babel())
        .pipe(gulp.dest('lib/spec'));
});

gulp.task('test', ['build:test'], () => {
    return gulp.src('lib/spec/*_spec.js')
        .pipe(jasmine());
});

gulp.task('watch', () => {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('default', ['lint', 'test']);