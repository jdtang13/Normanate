/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');
var multer  = require('multer');

var consolidate = require('consolidate');

var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');

var walk = require('./utils/walk');


/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');

/**
 * Create Express server.
 */
var app = express();


/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

// MODELS

// Add in models from the folder
var modelsPath = __dirname+'/models';

walk(modelsPath, '', function(path) {
  require(path);
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

// cache=memory or swig dies in NODE_ENV=production
app.locals.cache = 'memory';
app.engine('html', consolidate['swig']);
app.set('view engine', 'html');
app.use(compress());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ dest: path.join(__dirname, 'uploads') }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca({
  csrf: true,
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

// ROUTES

// Add in routes from the folder
var routesPath = __dirname+'/routes';

walk(routesPath, '', function(path) {
    require(path)(app);
});

// Assume 404 since no middleware responded
app.use(function(req, res) {
    res.status(404).render('error/404', {
        error: 'Not found'
    });
});

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

var WordModel = require('mongoose').model('Word');

var hasBeenReset = 1;

// TODO: Danger! resetting and reseeding the word db! Remove this block when you don't need it!
if (hasBeenReset == 0) {
  WordModel.remove({}, function(err) { 
     console.log("NOTICE: deleted all Words to reset the database -- remove this line if you don't want this");
     hasBeenReset = 1;

    //  seed the etymology data if not done already
      var fs = require('fs');
      var array = fs.readFileSync('etymologies.txt').toString().split("\n");

      console.log("Seeding database with existing words");

      //  word textfile format: "name,etymology" --> split the string by comma
      for(i = 0; i < array.length; i++) {
          
          //console.log("looking at line: " + array[i]);
          var wordData = array[i].split(",");
          var queryWord = WordModel.findOne({ 'content': wordData[0] });  

          //  TODO: add callback that passes down wordData array
          (function(wordData) {
          queryWord.exec(function (err, word) { 
            if (word != null) {            
              var origin = word.etymologies[0]; 
              console.log("word already exists, origin is " + origin + ", adding new origin " + wordData[1]);
              word.etymologies.push(wordData[1]);

              }
              else {
                WordModel.create({ content: wordData[0], etymologies: [wordData[1]] });
                console.log('Added ' + wordData[0] + ' with origin ' + wordData[1]);
              }
            });
          })(wordData);

      }

      console.log("Seeding complete (probably).");

  });
}

var seedCount = 0;
console.log('Calculating number of words in database...');
WordModel.count({}, function( err, count){
    console.log('Number of existing words is ' + count);
    seedCount = count;
});




