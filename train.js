
// Train the application using files in the train/ directory
// run using "node train.js"

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

        var numFiles = 4;   ///  NOTE: HARD CODED
        var trainCount = numFiles;

          async.each(files, function(file) {

            fs.readFile(dir + file, 'utf-8', function(err, html) {

                if (err) throw err;
                //  data[file] = html;

                var trainingData = html.toString();

                //  TODO -- current as of 4/22 -- update this based on essay.js
                //  TODO -- watch out for numerical overflow from large data sets

                //  process the training set
                //  generate heuristic data and save it
                var dict;
                process.objectiveHeuristics(-1, trainingData, 
                    function (err, resultDict) {
                    if (!err) {
                        console.log("successfully calculated objective heuristics from training set!");
                        trainCount--;
                        console.log("train count is now " + trainCount);

                        dict = resultDict;
                        console.log("content of training dict is: %j", dict);

                        var num_words = resultDict["num_words"];

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

                  if (0 == trainCount) {

                    console.log("trainCount is zero; attempting to invoke callback with averageDict = %j",averageDict);

                     callback(null, averageDict, numFiles);

                  }

                    }
                });

            });
        }

        );

    });


  },


  function(averageDict, numFiles) {
  //  save the averaged data into the objective model
  var MasterObjectiveModel = require('mongoose').model('MasterObjectiveHeuristic');
  MasterObjectiveModel.remove({}, function(err) { 
   
    console.log("NOTICE: deleted MasterObjective to reset the database -- remove this line if you don't want this");

    console.log("invoking final function with averageDict = %j", averageDict);
    console.log("number of files =  " + numFiles);

    var num_words = averageDict["num_words"];
    var num_chars = averageDict["num_chars"];

    console.log("num_words = " + num_words);

    var avg_overused_words_num = (averageDict["overused_words_num"] / numFiles);

    var avg_sentence_mean = (averageDict["sentence_mean"] / numFiles);
    var avg_sentence_var = (averageDict["sentence_var"] / numFiles);
    var avg_sentence_num = (averageDict["sentence_num"] / numFiles);

    var avg_adj_count = averageDict["adj_count"] / num_words;
    var avg_adv_count = averageDict["adv_count"] / num_words;
    var avg_noun_count = averageDict["noun_count"] / num_words;
    var avg_verb_count = averageDict["verb_count"] / num_words;

    console.log("avg_overused_words_num = " + avg_overused_words_num);

    console.log("avg_sentence_mean = " + avg_sentence_mean);
    console.log("avg_sentence_var = " + avg_sentence_var);
    console.log("avg_sentence_num = " + avg_sentence_num);

    console.log("avg_verb_count = " + avg_verb_count);

    var oh = new MasterObjectiveModel( 
    { 
        //  divide all by num_words to get an averge
        overused_words_num: avg_overused_words_num,

        sentence_mean: avg_sentence_mean,
        sentence_var: avg_sentence_var,
        sentence_num: avg_sentence_num,

        adj_ratio: avg_adj_count,
        adv_ratio: avg_adv_count,
        noun_ratio: avg_noun_count,
        verb_ratio: avg_verb_count
    }
    );
    oh.save(function (err) {
      if (err) {
        console.log("error while saving oh!");
        return handleError(err);
    }
      else {

        console.log("successfully saved the master of the objective heuristics!");
        console.log("master content is %j", oh);

      }
      // saved!
    });

  });

}

  
],
// optional callback
function(err, results){
    return;
});
