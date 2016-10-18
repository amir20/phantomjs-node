import gulp from "gulp";
import babel from "gulp-babel";
import newer from "gulp-newer";
import eslint from "gulp-eslint";
import del from "del";
import {spawn} from "child_process";


gulp.task('clean', () => del(['lib/']));

gulp.task('lint', () => {
    return gulp.src('src/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('build', () => {
    const lib = 'lib';
    return gulp.src('src/**/*.js')
        .pipe(newer(lib))
        .pipe(babel())
        .pipe(gulp.dest(lib));
});

gulp.task('test', ['build'], done => {
    const cmd = spawn('jest', {stdio: 'inherit'});
    cmd.on('close', code => done(code));
});

gulp.task('watch', ['build'], () => {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('default', ['lint', 'test']);
