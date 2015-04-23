
// Train the application using files in the train/ directory
// run using "node train.js"


//  TODO -- for each file in the train/ directory, open it up and start training using process.js existing code
//  TODO -- output an averaged heuristic object and save that somewhere

//  TODO -- train on unpunctuated, non-capitalized words (does process.js already handle this?)

//  TODO -- never train if training data already exists in mongo
//  TODO -- use some sort of namespace or global variable in mongo to store the One True Heuristic Set

//  TODO -- display errors relative to heuristics graphically (and highlight the words individually?)

var walk = require('./utils/walk');
var async = require('async');

// Add in models from the folder
var modelsPath = __dirname+'/models';
var mongoose = require('mongoose');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');

//  require the process.js file
var process = require('../controllers/process');

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

walk(modelsPath, '', function(path) {
  require(path);
});

var WordModel = mongoose.model('Word');
var ObjectiveModel = require('mongoose').model('ObjectiveHeuristic');

var hasBeenTrained = 0;

async.waterfall([
  function(callback){

    var dir = './train/';
    var fs = require('fs');

    var averageDict;
    var numFiles = 0;

    fs.readdir(dir, function(err, files) {

        if (err) throw err;

        var trainCount = 0;

        files.forEach(function(file) {

            trainCount++;
            numFiles++;

            fs.readFile(dir + file, 'utf-8', function(err, html){

                if (err) throw err;
                //  data[file] = html;

                var trainingData = html.toString();

                //  TODO -- current as of 4/22 -- update this based on essay.js
                //  TODO -- watch out for numerical overflow from large data sets
                //  TODO -- training data should be weighted according to the number of words? or number of sentences?

                //  process the training set
                //  generate heuristic data and save it
                var dict;
                process.objectiveHeuristics(-1, essay.content, 
                    function (err, resultDict) {
                    if (!err) {
                        console.log("successfully calculated objective heuristics from training set!");
                        dict = resultDict;
                        console.log("content of training dict is: %j", dict);

                        //  TODO -- add dict results to an ongoing average
                        //  TODO -- pass in the variable through callback

                    }
                }

                if (0 === --trainCount) {
                    console.log("finished reading all training data"); 
                }

            });
        });

    });

  },
  function(err){
        // if any of the file processing produced an error, err would equal that error
        if( err ) {
          // One of the iterations produced an error.
          // All processing will now stop.
          console.log('A word failed to process');
          outerCB(err);
        } else {
          console.log('All words processed successfully');

          //  TODO -- save the averaged data into the objective model

          var oh = new ObjectiveModel( 
          { 
              is_master: true, // IMPORTANT! designates this model as the One True Heuristic set

              num_words: resultDict["num_words"],
              num_chars: resultDict["num_chars"],
              overused_words: [resultDict["overused_words"]],
              sentence_mean: resultDict["sentence_info"]["mean"],
              sentence_var: resultDict["sentence_info"]["var"],
              sentence_num: resultDict["sentence_info"]["num"],
              adj_count: resultDict["pos_info"]["adj_count"],
              adv_count: resultDict["pos_info"]["adv_count"],
              noun_count: resultDict["pos_info"]["noun_count"],
              verb_count: resultDict["pos_info"]["verb_count"]
          }
          );
          oh.save(function (err) {
            if (err) {
              console.log("error while saving oh!");
              return handleError(err);
          }
            else {
              essay.objectives.push(oh);
              console.log("successfully saved the objective heuristics!");

                  essay.save(function(err) {
                      if (err) {
                          console.log(err);
                          return res.send('users/signup', {
                              errors: err.errors,
                              piece: piece
                          });
                      } else {
                          console.log("essay saved!");
                          return res.json(essay);
                      }
                  });

            }
            // saved!
          });

        }
    });
  
],
// optional callback
function(err, results){
    return;
});
