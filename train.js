// Train the application using files in the train/ directory
// run using "node train.js"

//  TODO -- display errors relative to heuristics graphically (and highlight the words individually?)
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
var stats = require('./controllers/stats');

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

//  require the process.js file
var processing = require('./controllers/process');

var WordModel = mongoose.model('Word');
var ObjectiveModel = require('mongoose').model('ObjectiveHeuristic');

var hasBeenTrained = 0;
var dir = './train/';
var files = fs.readdirSync(dir);
var numFiles = files.length;

async.waterfall([
    function(callback){

        console.log("Begin training");
        
        console.log(files);

        // this is the dictionary for averages
        var averageDict = {};
        averageDict["num_words"] = 0;
        averageDict["num_chars"] = 0;
        averageDict["sentence_mean"] = 0;
        averageDict["sentence_var"] = 0;
        averageDict["sentence_num"] = 0;
        averageDict["linking_verbs"] = 0;
        averageDict["etymology_score"] = 0;
        averageDict["cadence_gap"] = 0;
        averageDict["adj_count"] = 0;
        averageDict["adv_count"] = 0;
        averageDict["noun_count"] = 0;
        averageDict["verb_count"] = 0;
        averageDict["sentiment"] = 0;
        //  NOTE! counting overused_words num rather than the words themselves
        averageDict["overused_words_num"] = 0;

        averageDict["pos_match_pairFreqs"] = {};
        averageDict["pos_match_totalFreqs"] = {};
        var posTags = processing.getPosTags();
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
        varDict["cadence_gap"] = [];
        varDict["adj_count"] = [];
        varDict["adv_count"] = [];
        varDict["noun_count"] = [];
        varDict["verb_count"] = [];
        varDict["sentiment"] = [];

        var trainCount = numFiles;

        async.eachSeries(files, function(file, fileCallback) {

            console.log("Starting to train "+ file);

            var html = fs.readFileSync(dir + file, 'utf-8');

                
            var trainingData = html.toString();

            //  TODO -- current as of 4/22 -- update this based on essay.js
            //  TODO -- watch out for numerical overflow from large data sets

            //  processing the training set
            //  generate heuristic data and save it

            async.series([
                function(callback) {
                    processing.objectiveHeuristics(-1, trainingData, callback);  
                },
                function(callback) {
                    processing.subjectiveHeuristics(-1, trainingData, callback);
                }
            ], function(err, results) {
                var resultDict = results[0];
                var resultDict2 = results[1];
                console.log("sentiment: " + resultDict2["sentiment"]);

                if (!err) {
                    console.log("successfully calculated objective heuristics from training set!");
                    trainCount--;
                   
                    dict = resultDict;
                    
                    var num_words = resultDict["num_words"];

                    console.log("cadence gap is " + resultDict2["cadence_gap"]);

                    //  add dict results to an ongoing average
                    averageDict["num_words"] += resultDict["num_words"];
                    averageDict["num_chars"] += resultDict["num_chars"];
                    averageDict["sentence_mean"] += resultDict["sentence_info"]["mean"];
                    averageDict["sentence_var"] += resultDict["sentence_info"]["var"];
                    averageDict["sentence_num"] += resultDict["sentence_info"]["num"];
                    averageDict["linking_verbs"] += resultDict["linking_verbs"];
                    averageDict["etymology_score"] += resultDict2["etymology_score"];
                    averageDict["cadence_gap"] += resultDict2["cadence_gap"];
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
                    varDict["cadence_gap"].push(resultDict2["cadence_gap"]);
                    varDict["adj_count"].push(resultDict["pos_info"]["adj_count"]);
                    varDict["adv_count"].push(resultDict["pos_info"]["adv_count"]);
                    varDict["noun_count"].push(resultDict["pos_info"]["noun_count"]);
                    varDict["verb_count"].push(resultDict["pos_info"]["verb_count"]);
                    varDict["sentiment"].push(resultDict2["sentiment"]);

                    if (0 == trainCount) {
                        console.log("trainCount is zero; attempting to invoke callback with averageDict = %j",averageDict);
                        callback(null, averageDict, varDict, numFiles);
                    }
                }
                fileCallback();
            
            });
        });
    },


    function(averageDict, varDict, numFiles, callback) {
    //  save the averaged data into the objective model
    var MasterObjectiveModel = require('mongoose').model('MasterObjectiveHeuristic');
    MasterObjectiveModel.remove({}, function(err) { 

        console.log("NOTICE: deleted MasterObjective to reset the database -- remove this line if you don't want this");

        console.log("number of files =  " + numFiles);

        var num_words = averageDict["num_words"];
        var num_chars = averageDict["num_chars"];

        
        var avg_overused_words_num = (averageDict["overused_words_num"] / numFiles);
        var avg_sentence_mean = (averageDict["sentence_mean"] / numFiles);
        var avg_sentence_var = (averageDict["sentence_var"] / numFiles);
        var avg_sentence_num = (averageDict["sentence_num"] / numFiles);
        var avg_etymology_score = (averageDict["etymology_score"] / numFiles);
        var avg_cadence_gap = (averageDict["cadence_gap"] / numFiles);
        var avg_adj_count = averageDict["adj_count"] / num_words;
        var avg_adv_count = averageDict["adv_count"] / num_words;
        var avg_noun_count = averageDict["noun_count"] / num_words;
        var avg_verb_count = averageDict["verb_count"] / num_words;
        var avg_lv_ratio = averageDict["linking_verbs"] / num_words;
        var avg_sentiment = (averageDict["sentiment"] / numFiles);

        var pairFreqsArr = processing.deformatPairFreqs(averageDict["pos_match_pairFreqs"]);
        var totalFreqsArr = processing.deformatTotalFreqs(averageDict["pos_match_totalFreqs"]);
        var posTags = processing.getPosTags();
        for(var i in pairFreqsArr) {
            pairFreqsArr[i] /= num_words;
        }
        for(var j in totalFreqsArr) {
            totalFreqsArr[j] /= num_words;
        }

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
        var var_cadence_gap = stats.calculateVariance(varDict["cadence_gap"]);
        for (var i in varDict["adj_count"]) {
            varDict["adj_count"][i] /= num_words;
        }
        var var_adj_count = stats.calculateVariance(varDict["adj_count"]);
        for (var i in varDict["adv_count"]) {
            varDict["adv_count"][i] /= num_words;
        }
        var var_adv_count = stats.calculateVariance(varDict["adv_count"]);
        for (var i in varDict["noun_count"]) {
            varDict["noun_count"][i] /= num_words;
        }
        var var_noun_count = stats.calculateVariance(varDict["noun_count"]);
        for (var i in varDict["verb_count"]) {
            varDict["verb_count"][i] /= num_words;
        }
        var var_verb_count = stats.calculateVariance(varDict["verb_count"]);
        for (var i in varDict["linking_verbs"]) {
            varDict["linking_verbs"][i] /= num_words;
        }
        var var_lv_ratio = stats.calculateVariance(varDict["linking_verbs"]);
        console.log("sentiments! " + varDict["sentiment"]);
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
            cadence_gap: avg_cadence_gap,
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
                console.log(err);
                callback(err);
                //return handleError(err);
            }
            else {
                console.log("successfully saved the master of the objective heuristics!");
                console.log("master content is %j", oh);


                var oh_var = new MasterObjectiveModel(
                {
                    overused_words_num: var_overused_words_num,
                    sentence_mean: var_sentence_mean,
                    sentence_var: var_sentence_var,
                    etymology_score: var_etymology_score,
                    cadence_gap: var_cadence_gap,
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
                        callback(err);
                        //return handleError(err);
                    }
                    else {
                        console.log("successfully saved the variances of the heuristics!");
                        console.log("variance content is %j", oh_var);
                        callback(null);
                    }
                });
            }
          // saved!
        });


    });
}],
// optional callback
function(err, results){
    if (err) {
        console.log(err);
    }
    process.exit();
});
