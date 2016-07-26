import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import plumber from 'gulp-plumber';
import plumberErrorHandler from 'gulp-plumber-error-handler';
import rename from 'gulp-rename';
import browserSync from 'browser-sync';

import postcss from 'gulp-postcss';
import cssnext from 'postcss-cssnext';
import easyImport from 'postcss-easy-import';
import objectFit from 'postcss-object-fit-images';
import csso from 'gulp-csso';

import webpack from 'webpack-stream';

const baseDir = './www';

const source = {
	css: `${baseDir}/source/css`,
	js: `${baseDir}/source/js`,
};

const build = {
	css: `${baseDir}/build/css`,
	js: `${baseDir}/build/js`,
};

const bsync = browserSync.create();

function errorHandler(taskName) {
	return {
		errorHandler: plumberErrorHandler(`Error in ${taskName} task`),
	};
}

function flatten(path) {
	path.dirname = '';
	return path;
};

gulp.task('compile-css', () => {
	return gulp
		.src(`${source.css}/main.css`)
		.pipe(plumber(errorHandler('compile-css')))
		.pipe(sourcemaps.init())
		.pipe(postcss([
			easyImport({
				glob: true,
			}),
			cssnext(),
			objectFit(),
		]))
		.pipe(csso())
		.pipe(sourcemaps.write('.'))
		.pipe(rename('bundle.css'))
		.pipe(gulp.dest(build.css));
});

gulp.task('compile-js', () => {
	return gulp
		.src(`${source.js}/index.js`)
		.pipe(plumber(errorHandler('compile-js')))
		.pipe(webpack(require('./webpack.config.js')))
		.pipe(gulp.dest(build.js));
});

gulp.task('build', ['compile-css', 'compile-js']);

gulp.task('default', ['build'],  () => {
	bsync.init({
		server: baseDir,
		port: 5000,
	});
	gulp.watch(`${source.css}/**/*.css`, ['compile-css']).on('change', bsync.reload);
	gulp.watch([`${source.js}/**/*.js`], ['compile-js']).on('change', bsync.reload);
});
