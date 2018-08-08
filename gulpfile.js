#!/usr/bin/env node
var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var browserSync = require('browser-sync').create();
var argv = require('yargs').argv;

var $ = gulpLoadPlugins();

var SOURCES = {
	select: 'content',
	content: {
		js:  [
			'blocks/mdlcomponentHandler.js',
			'blocks/textfield/textfield.js',
			'blocks/tooltip/tooltip.js',
			'blocks/utils/utils.js',
			'blocks/app/app.js'
		],
		sass: 'blocks/style-content.scss'
	},
	popup: {
		js: [
			'blocks/mdlcomponentHandler.js',
			'blocks/switch/switch.js',
			'blocks/button/button.js',
			'blocks/popup/popup.js',
			'blocks/radio/radio.js',
			'blocks/selectfield/selectfield.js',
			'blocks/snackbar/snackbar.js',
			'blocks/spinner/spinner.js',
			'blocks/textfield/textfield.js',
			'blocks/tooltip/tooltip.js',
			'blocks/utils/utils.js'
		],
		sass: 'blocks/style-popup.scss'
	},
	donate: {
		js: [
			'blocks/mdlcomponentHandler.js',
			'blocks/button/button.js',
			'blocks/ripple/ripple.js',
			'blocks/slider/slider.js',
			'blocks/selectfield/selectfield.js',
			'blocks/spinner/spinner.js',
			'blocks/donate/donate.js'
		],
		sass: ['blocks/style-donate.scss']
	},
	index: {
		js: [],
		sass: ['blocks/style-index.scss']
	}
}
SOURCES.select = argv.select || SOURCES.select;

var	files = SOURCES[SOURCES.select];
var	prefix = '.'+SOURCES.select;

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];


// ***** Production build tasks ****** //


// Concatenate And Minify JavaScript
gulp.task('js', function() {
	return gulp.src(files.js)
		.pipe($.plumber({errorHandler: $.notify.onError("Error: <%= error.message %>")}))
		.pipe($.babel({
			presets: ['env']
		}))
		.pipe($.sourcemaps.init())
		// Concatenate Scripts
		.pipe($.concat('bundle' + prefix + '.js'))
		.pipe(gulp.dest('bundle'))
		// Minify Scripts
		.pipe($.uglifyEs.default({
			sourceMap: {
				root: '.',
				includeSources: true
			}
		}))
		.pipe($.rename('bundle' + prefix + '.min.js'))
		// Write Source Maps
		.pipe($.sourcemaps.write('maps'))
		.pipe(gulp.dest('bundle'))
		.pipe($.size({title: 'js'}))
		.pipe($.notify('Task js completed!'))
});


// Compile sass files
// Concatenate And Minify Stylesheets
gulp.task('sass', function () {
	return gulp.src(files.sass)
		.pipe($.plumber({errorHandler: $.notify.onError("Error: <%= error.message %>")}))
		.pipe($.sourcemaps.init())
		.pipe($.sass({
			 outputStyle: 'expanded',
		 }).on('error', $.sass.logError))
		.pipe($.rename('bundle' + prefix + '.css'))
		.pipe($.autoprefixer({
			browsers: AUTOPREFIXER_BROWSERS,
			cascade: false
		 }))
		.pipe($.csscomb())
		.pipe(gulp.dest('bundle'))
		// Minify Stylesheets
		.pipe($.cleanCss({compatibility: 'ie8'}))
		.pipe($.rename('bundle' + prefix + '.min.css'))
		// Write Source Maps
		.pipe($.sourcemaps.write('maps'))
		.pipe(gulp.dest('bundle'))
		.pipe($.notify('Task sass completed!'))
		.pipe(browserSync.stream());
});


// Generate svg sprite
gulp.task('svg', function () {

	const config = {
		shape: {
			align: 'img/test.yaml',
			spacing: {
			padding: 10
		},
	},
		mode: {
			css: {
				render: {
					css: true
				}
			}
		}
	};

	return gulp.src('img/*.svg')
		.pipe($.svgSprite(config))
		.pipe(gulp.dest('img/svg-out'))
		.pipe($.notify('Task svg completed!'));
});


// Archive the project
gulp.task('zip', function () {
	return gulp.src([
		'**',
		'!node_modules', '!node_modules/**',
		'!dist', '!dist/**',
		'!blocks', '!blocks/**',
		'!.gitignore',
		'!.csslintrc',
		'!.jshintrc',
		'!gulpfile.js',
		'!package.json',
		'!todo.todo',
		'!*.psd',
		'!*.txt',
		'!bundle/maps', '!bundle/maps/**',
		'!bundle/bundle.content.css',
		'!bundle/bundle.donate.css',
		'!bundle/bundle.index.css',
		'!bundle/bundle.popup.css',
		'!bundle/bundle.content.js',
		'!bundle/bundle.donate.js',
		'!bundle/bundle.index.js',
		'!bundle/bundle.popup.js'
	], {base: '.'})
		.pipe($.zip('fullscreensearch.zip'))
		.pipe(gulp.dest('.'))
		.pipe($.notify('Task zip completed!'));
});


// ***** Development tasks ****** //


// Create bem block from module
gulp.task('mod-copy', function() {
	var modules = 'node_modules/',
		mod = argv.mod ? modules + argv.mod : modules + 'material-design-lite/src/',
		blocks = (typeof argv.block === 'string') ? [argv.block] :
					 (argv.block === undefined) ?	[''] :
					 argv.block,
		ext = argv.ext ? '/*.' + argv.ext  : '/*.@(js|scss)',
		blocks_tmp = [],
		i;

	for (i = 0; i < blocks.length; i++) {
		blocks_tmp.push(mod + blocks[i] + ext);

		gulp.src(blocks_tmp[i])
			.pipe(gulp.dest((argv.out || 'blocks/') + blocks[i]));
	}
	console.log(argv);
});


// Reaload extension
gulp.task('uri', function(){
	gulp.src(__filename)
		.pipe($.open({uri: "http://reload.extensions"}));
});

// Defines the list of resources to watch for changes.
var watch = function() {
	var js = SOURCES.select === 'content' ?
			['js', 'uri', browserSync.reload] :
			['js', browserSync.reload];

	gulp.watch('blocks/**/*.scss', ['sass']);
	gulp.watch('blocks/**/*.js', js);

};

// Serves app
gulp.task('serve', [argv.task || 'sass'], function() {

	browserSync.init({
		server: {
			baseDir: "./"
		}
	});

	watch();
});

gulp.task('default', ['serve']);