
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

//  require the process.js file
var process = require('./controllers/process');

var WordModel = mongoose.model('Word');
var ObjectiveModel = require('mongoose').model('ObjectiveHeuristic');

var hasBeenTrained = 0;

async.waterfall([
  function(callback){

    var dir = './train/';
    var fs = require('fs');

    fs.readdir(dir, function(err, files) {

        if (err) throw err;

        var trainCount = 0;
        var averageDict = {};

        averageDict["num_words"] = 0;
        averageDict["num_chars"] = 0;
        averageDict["sentence_mean"] = 0;
        averageDict["sentence_var"] = 0;
        averageDict["sentence_num"] = 0;
        averageDict["adj_count"] = 0;
        averageDict["adv_count"] = 0;
        averageDict["noun_count"] = 0;
        averageDict["verb_count"] = 0;
        //  NOTE! counting overused_words num rather than the words themselves
        averageDict["overused_words_num"] = 0;

        var numFiles = 0;

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
                process.objectiveHeuristics(-1, trainingData, 
                    function (err, resultDict) {
                    if (!err) {
                        console.log("successfully calculated objective heuristics from training set!");
                        dict = resultDict;
                        console.log("content of training dict is: %j", dict);

                        //  add dict results to an ongoing average
                        averageDict["num_words"] += resultDict["num_words"];
                        averageDict["num_chars"] += resultDict["num_chars"];
                        averageDict["overused_words_num"] += resultDict["overused_words"].length;
                        averageDict["sentence_mean"] += resultDict["sentence_info"]["mean"];
                        averageDict["sentence_var"] += resultDict["sentence_info"]["var"];
                        averageDict["sentence_num"] += resultDict["sentence_info"]["num"];
                        averageDict["adj_count"] += resultDict["pos_info"]["adj_count"];
                        averageDict["adv_count"] += resultDict["pos_info"]["adv_count"];
                        averageDict["noun_count"] += resultDict["pos_info"]["noun_count"];
                        averageDict["verb_count"] += resultDict["pos_info"]["verb_count"];

                        console.log("content of updated averagedict is: %j", averageDict);

                    }
                });

                if (0 == --trainCount) {
                    console.log("finished reading all training data"); 

                //  save the averaged data into the objective model

                var MasterObjectiveModel = require('mongoose').model('MasterObjectiveHeuristic');

                var oh = new MasterObjectiveModel( 
                { 
                    num_words: averageDict["num_words"],
                    num_chars: averageDict["num_chars"],
                    overused_words_num: averageDict["overused_words_num"],
                    sentence_mean: averageDict["mean"],
                    sentence_var: averageDict["var"],
                    sentence_num: averageDict["num"],
                    adj_count: averageDict["adj_count"],
                    adv_count: averageDict["adv_count"],
                    noun_count: averageDict["noun_count"],
                    verb_count: averageDict["verb_count"]
                }
                );
                oh.save(function (err) {
                  if (err) {
                    console.log("error while saving oh!");
                    return handleError(err);
                }
                  else {

                    console.log("successfully saved the master of the objective heuristics!");

                  }
                  // saved!
                });

                }



            });
        });

    });

  }
  
],
// optional callback
function(err, results){
    return;
});
