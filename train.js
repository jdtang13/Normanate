
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
var stats = require('./controllers/stats');

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

        // this is the dictionary for averages
        var averageDict = {};
        averageDict["num_words"] = 0;
        averageDict["num_chars"] = 0;
        averageDict["sentence_mean"] = 0;
        averageDict["sentence_var"] = 0;
        averageDict["sentence_num"] = 0;
        averageDict["linking_verbs"] = 0;
        averageDict["etymology_score"] = 0;
        averageDict["adj_count"] = 0;
        averageDict["adv_count"] = 0;
        averageDict["noun_count"] = 0;
        averageDict["verb_count"] = 0;
        averageDict["sentiment"] = 0;
        //  NOTE! counting overused_words num rather than the words themselves
        averageDict["overused_words_num"] = 0;

        averageDict["pos_match_pairFreqs"] = {};
        averageDict["pos_match_totalFreqs"] = {};
        var posTags = process.getPosTags();
        for(var i in posTags) {
            averageDict["pos_match_pairFreqs"][posTags[i]] = {};
            for(var j in posTags) {
                averageDict["pos_match_pairFreqs"][posTags[i]][posTags[j]] = 0;
            }
            averageDict["pos_match_totalFreqs"][posTags[i]] = 0;
        }

        // this is the dictionary for variances
        var varDict = {};
        varDict["overused_words_num"] = [];
        varDict["sentence_mean"] = [];
        varDict["sentence_var"] = [];
        varDict["sentence_num"] = [];
        varDict["linking_verbs"] = [];
        varDict["etymology_score"] = [];
        varDict["adj_count"] = [];
        varDict["adv_count"] = [];
        varDict["noun_count"] = [];
        varDict["verb_count"] = [];
        varDict["sentiment"] = [];

        var numFiles = 4;   ///  NOTE: HARD CODED
        var trainCount = numFiles;

          async.eachSeries(files, function(file, fileCallback) {

            fs.readFile(dir + file, 'utf-8', function(err, html) {

                if (err) throw err;
                //  data[file] = html;

                var trainingData = html.toString();

                //  TODO -- current as of 4/22 -- update this based on essay.js
                //  TODO -- watch out for numerical overflow from large data sets

                //  process the training set
                //  generate heuristic data and save it

                async.series([
                    function(callback) {
                        process.objectiveHeuristics(-1, trainingData, callback);  
                    },
                    function(callback) {
                        process.subjectiveHeuristics(-1, trainingData, callback);
                    }
                ], function(err, results) {
                    var resultDict = results[0];
                    var resultDict2 = results[1];

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
                        averageDict["linking_verbs"] += resultDict["linking_verbs"];
                        averageDict["etymology_score"] += resultDict2["etymology_score"];
                        averageDict["adj_count"] += resultDict["pos_info"]["adj_count"];
                        averageDict["adv_count"] += resultDict["pos_info"]["adv_count"];
                        averageDict["noun_count"] += resultDict["pos_info"]["noun_count"];
                        averageDict["verb_count"] += resultDict["pos_info"]["verb_count"];
                        averageDict["sentiment"] += resultDict2["sentiment"];

                        var posPairFreqs = resultDict2["pos_match_info"]["pairFreqs"];
                        var posTotalFreqs = resultDict2["pos_match_info"]["totalFreqs"];
                        for(var i in posTags) {
                            for(var j in posTags) {
                                averageDict["pos_match_pairFreqs"][posTags[i]][posTags[j]] += posPairFreqs[posTags[i]][posTags[j]];
                            }
                            averageDict["pos_match_totalFreqs"][posTags[i]] += posTotalFreqs[posTags[i]];
                        }

                        // merge pos stuff into this dictionary
                        if (resultDict["overused_words"] != null) {
                            varDict["overused_words_num"].push(resultDict["overused_words"].length);
                        }
                        else {
                            varDict["overused_words_num"].push(0);
                        }
                        
                        varDict["sentence_mean"].push(resultDict["sentence_info"]["mean"]);
                        varDict["sentence_var"].push(resultDict["sentence_info"]["var"]);
                        varDict["linking_verbs"].push(resultDict["linking_verbs"]);
                        varDict["etymology_score"].push(resultDict2["etymology_score"]);
                        varDict["adj_count"].push(resultDict["pos_info"]["adj_count"]);
                        varDict["adv_count"].push(resultDict["pos_info"]["adv_count"]);
                        varDict["noun_count"].push(resultDict["pos_info"]["noun_count"]);
                        varDict["verb_count"].push(resultDict["pos_info"]["verb_count"]);
                        varDict["sentiment"].push(resultDict2["sentiment"]);

                        console.log("content of updated averagedict is: %j", averageDict);

                        if (0 == trainCount) {
                            console.log("trainCount is zero; attempting to invoke callback with averageDict = %j",averageDict);
                            callback(null, averageDict, varDict, numFiles);
                        }
                    }
                    fileCallback();
                });

            });
        }

        );
    });
  },


  function(averageDict, varDict, numFiles) {
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
    var avg_etymology_score = (averageDict["etymology_score"] / numFiles);
    var avg_adj_count = averageDict["adj_count"] / num_words;
    var avg_adv_count = averageDict["adv_count"] / num_words;
    var avg_noun_count = averageDict["noun_count"] / num_words;
    var avg_verb_count = averageDict["verb_count"] / num_words;
    var avg_lv_ratio = averageDict["linking_verbs"] / num_words;
    var avg_sentiment = (averageDict["sentiment"] / numFiles);

    var pairFreqsArr = process.deformatPairFreqs(averageDict["pos_match_pairFreqs"]);
    var totalFreqsArr = process.deformatTotalFreqs(averageDict["pos_match_totalFreqs"]);

    console.log("avg_overused_words_num = " + avg_overused_words_num);
    console.log("avg_sentence_mean = " + avg_sentence_mean);
    console.log("avg_sentence_var = " + avg_sentence_var);
    console.log("avg_sentence_num = " + avg_sentence_num);
    console.log("avg_verb_count = " + avg_verb_count);
    console.log("avg_sentiment = " + avg_sentiment);

    var var_overused_words_num = stats.calculateVariance(varDict["overused_words_num"]);
    var var_sentence_mean = stats.calculateVariance(varDict["sentence_mean"]);
    var var_sentence_var = stats.calculateVariance(varDict["sentence_var"]);
    var var_etymology_score = stats.calculateVariance(varDict["etymology_score"]);
    var var_adj_count = stats.calculateVariance(varDict["adj_count"]);
    var var_adv_count = stats.calculateVariance(varDict["adv_count"]);
    var var_noun_count = stats.calculateVariance(varDict["noun_count"]);
    var var_verb_count = stats.calculateVariance(varDict["verb_count"]);
    var var_lv_ratio = stats.calculateVariance(varDict["linking_verbs"]);
    var_adj_count /= (num_words * num_words);
    var_adv_count /= (num_words * num_words);
    var_noun_count /= (num_words * num_words);
    var_verb_count /= (num_words * num_words);
    var var_sentiment = stats.calculateVariance(varDict["sentiment"]);

    console.log("var_overused_words_num = " + var_overused_words_num);
    console.log("var_sentence_mean = " + var_sentence_mean);
    console.log("var_etymology_score = " + var_etymology_score);

    var oh = new MasterObjectiveModel( 
    { 
        //  divide all by num_words to get an averge
        sentence_mean: avg_sentence_mean,
        sentence_var: avg_sentence_var,
        sentence_num: avg_sentence_num,

        etymology_score: avg_etymology_score,  
        adj_ratio: avg_adj_count,
        adv_ratio: avg_adv_count,
        noun_ratio: avg_noun_count,
        verb_ratio: avg_verb_count,
        linking_verbs_ratio: avg_lv_ratio,

        sentiment: avg_sentiment,
        pos_match_pairFreqs: pairFreqsArr,
        pos_match_totalFreqs: totalFreqsArr,
        type: "avg",
    });
    oh.save(function (err) {
        if (err) {
            console.log("error while saving oh!");
            //return handleError(err);
        }
        else {
            console.log("successfully saved the master of the objective heuristics!");
            console.log("master content is %j", oh);
        }
      // saved!
    });

    var oh_var = new MasterObjectiveModel(
    {
        overused_words_num: var_overused_words_num,
        sentence_mean: var_sentence_mean,
        sentence_var: var_sentence_var,
        etymology_score: var_etymology_score,
        adj_ratio: var_adj_count,
        adv_ratio: var_adv_count,
        noun_ratio: var_noun_count,
        verb_ratio: var_verb_count,
        linking_verbs_ratio: var_lv_ratio,
        sentiment: var_sentiment,
        type: "var",
    });
    oh_var.save(function(err) {
        if (err) {
            console.log("error while saving oh_var!");
            console.log(err);
            //return handleError(err);
        }
        else {
            console.log("successfully saved the variances of the heuristics!");
            console.log("variance content is %j", oh_var);
        }
    });

  });
}],
// optional callback
function(err, results){
    return;
});
