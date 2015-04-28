var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');


var walk = require('./utils/walk');
var async = require('async');

// Add in models from the folder
var modelsPath = __dirname+'/models';
var mongoose = require('mongoose');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');

/**
 * Connect to MongoDB.
 */

var mongodb = secrets.db;

console.log(argv);
if (argv.mongo) {
  if (argv.f) {
    mongodb = fs.readFileSync(argv.mongo).toString().split('\n')[0];
  }
  else {
    mongodb = argv.mongo;
  }
}


mongoose.connect(mongodb);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

walk(modelsPath, '', function(path) {
  require(path);
});

var WordModel = mongoose.model('Word');

var hasBeenReset = 0;

async.waterfall([
  function(callback){

    WordModel.remove({}, function(err) { 
      console.log("NOTICE: deleted all Words to reset the database -- remove this line if you don't want this");
      hasBeenReset = 1;

      //  seed the etymology data if not done already
      var array = fs.readFileSync('etymologies.txt').toString().split("\n");

      console.log("Seeding database with existing words");
      // do some stuff ...
      callback(null, array);
    });
  },
  function(array, outerCB){
    // console.log(array);
    async.each(array, function(pair, callback) {

      //console.log("looking at line: " + array[i]);
      var wordData = pair.split(",");
      var queryWord = WordModel.findOne({ 'content': wordData[0] }, function(err, word) {
        if (word != null) {            
          var origin = word.etymologies[0]; 
          console.log("word already exists, origin is " + origin + ", adding new origin " + wordData[1]);
          word.etymologies.push(wordData[1]);

        }
        else {
          WordModel.create({ content: wordData[0], etymologies: [wordData[1]] }, function(err) {
            // console.log('Added ' + wordData[0] + ' with origin ' + wordData[1]);
            callback();
          });
          
        }
      });
    }, function(err){
        // if any of the file processing produced an error, err would equal that error
        if( err ) {
          // One of the iterations produced an error.
          // All processing will now stop.
          console.log('A word failed to process');
          outerCB(err);
        } else {
          console.log('All words processed successfully');
          outerCB(null);
        }
    });
  },
  function(callback) {
    console.log("Seeding complete (probably).");

    var seedCount = 0;
    console.log('Calculating number of words in database...');
    WordModel.count({}, function( err, count){
        console.log('Number of existing words is ' + count);
        seedCount = count;
        callback(null);
    });

  }
  
],
// optional callback
function(err, results){
    return;
});
