var mongoose = require('mongoose');
var Essay = mongoose.model('Essay');
var _ = require('lodash');
var training = require('./training');
var gaussian = require('gaussian');
var async = require('async');


//  require the process.js file
var process = require('../controllers/process');

// controller for views related to individual essays
var passportConf = require('../config/passport');

// Ensure that user is authorized to view this essay
// if the essay has an author, the logged in user needs to be the author
exports.hasAuthorization = function(req, res, next) {
    if (req.essay.author && !req.user) {
        return next('route');
    }
    if (req.essay.author && req.essay.author.toString() !== req.user.id.toString()) {
        return next('route');
    }
    next();
};

exports.getEditEssay = function(req, res) {
    res.render('essays/edit', {
        essay: req.essay
    });
};

// GET an essay
exports.getEssay = function(req, res) {

    var MasterObjective = require('mongoose').model('MasterObjectiveHeuristic');
    var query = MasterObjective.findOne({ });
    query.exec(function (err, masterObjective) {
        if (masterObjective != null) {
            var normals = calculateNormals(req.essay, masterObjective);
            console.log("normals: %j", normals)
            console.log("master objective found!");
            res.render('essays/view', {
                essay: req.essay,
                masterObjective: masterObjective,
                normals: normals
            });
        }
        else {
            console.log(" ERROR : master objective not found, please run 'node train' and try again.");
            res.render('essays/view', {
                essay: req.essay
            });
        }
    });

};

exports.getEssays = function(req, res) {

    Essay.find({ author:req.user.id }).sort('-updated').exec(function(err, essays) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.render('essays/list', {
                essays: essays
            });
        }
    });
};

// helper function calculate P value given a sample, mean, and variance
function calculatePValue(sample, mean, variance) {
    var distr = gaussian(mean, variance);
    var result = 0;
    if (sample < mean) {
        result = 2 * distr.cdf(sample);
    }
    else if (sample > mean) {
        result = 2 * (1 - distr.cdf(sample));
    }
    return result;
}

// calculate normal distribution given essay object and masterObjective object
// return dictionary with the following format:
// sentence_var:
// sentence_mean:
// linking_verbs:
// etymology_score:
function calculateNormals(essay, master) {

    var s_sentenceVar = essay.heuristics[0].sentence_var;
    calculatePValue(s_sentenceVar, e_sentenceVar);
    var e_sentenceVar = master.sentence_var;
    var p_sentenceVar = calculatePValue(s_sentenceVar, e_sentenceVar, 1);

    var s_sentenceMean = essay.heuristics[0].sentence_mean;
    var e_sentenceMean = master.sentence_mean;
    var p_sentenceMean = calculatePValue(s_sentenceMean, e_sentenceMean, 1);

    var s_linkingVerbs = (essay.heuristics[0].linking_verbs / essay.heuristics[0].num_words);
    var e_linkingVerbs = master.linking_verbs_ratio;
    var p_linkingVerbs = calculatePValue(s_linkingVerbs, e_linkingVerbs, 1);

    var s_etymologyScore = essay.heuristics[0].etymology_score;
    var e_etymologyScore = master.etymology_score;
    var p_etymologyScore = calculatePValue(s_etymologyScore, e_etymologyScore, 1);

    var s_sentiment = essay.heuristics[0].sentiment;
    var e_sentiment = master.sentiment;
    var p_sentiment = calculatePValue(s_sentiment, e_sentiment, 1);

    var normalDict = {};
    normalDict["sentence_var"] = p_sentenceVar;
    normalDict["sentence_mean"] = p_sentenceMean;
    normalDict["linking_verbs"] = p_linkingVerbs;
    normalDict["etymology_score"] = p_etymologyScore;
    normalDict["sentiment"] = p_sentiment; 
    return normalDict; 
}

// create an essay
exports.postCreateEssay = function(req, res) {
    var essay = new Essay(req.body);
    if (req.isAuthenticated()) {
        essay.author = req.user;
    }

    //  temporary heuristic -- the prestige of the essay's title
    var essayTitle = (essay.title).toLowerCase();
    var WordModel = require('mongoose').model('Word');

    var titleOrigin = "none";

    //  look up the title's etymology
    console.log("looking up word: " + essayTitle);
    var queryWord = WordModel.findOne({ 'content': essayTitle });

    queryWord.exec(function (err, word) {
        if (word != null) {
            titleOrigin = word.etymologies[0];
            console.log("word found! origin is " + titleOrigin);
        }
    });

    var HeuristicModel = require('mongoose').model('Heuristic');
    var ObjectiveModel = require('mongoose').model('ObjectiveHeuristic');

    //  check that etymology's origin
    //  TODO: this needs to be mae async
    var prestige = process.prestigeOf(titleOrigin);
    console.log("prestige of origin is " + prestige);

    var h = new HeuristicModel({ 
        values: [prestige]
        });
    h.save(function (err) {
      if (err) return handleError(err);
      else {
        if (essay.heuristics.length == 0) {
            essay.heuristics.push(h);
        }
        else {
            essay.heuristics[0] = h;
        }
      }
      // saved!
    });

    //  generate heuristic data and save it
    var dict = {};
    console.log("testing");
    async.series([
        function(callback) {
            console.log("hello world");
            process.objectiveHeuristics(-1, essay.content, callback);
        },
        function(callback) {
            console.log("hello world2");
            process.subjectiveHeuristics(-1, essay.content, callback);
        }
    ], function(err, results) {
        console.log("RESULTS: " + results);
        var resultDict = results[0];
        var resultDict2 = results[1];
        //convert pos_match_info into 1-d arrays for 
        //insertion into Mongo
        // var posPairFreqs = dict["pos_match_info"]["pairFreqs"];
        // var posTotalFreqs = dict["pos_match_info"]["totalFreqs"];

        var oh = new ObjectiveModel( 
        {
            num_words: resultDict["num_words"],
            num_chars: resultDict["num_chars"],
            linking_verbs: resultDict["linking_verbs"],
            etymology_score: resultDict2["etymology_score"],
            overused_words: [resultDict["overused_words"]],
            sentence_mean: resultDict["sentence_info"]["mean"],
            sentence_var: resultDict["sentence_info"]["var"],
            sentence_num: resultDict["sentence_info"]["num"],
            adj_count: resultDict["pos_info"]["adj_count"],
            adv_count: resultDict["pos_info"]["adv_count"],
            noun_count: resultDict["pos_info"]["noun_count"],
            verb_count: resultDict["pos_info"]["verb_count"],
            sentiment: resultDict["sentiment"]
        });
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
    });
};

// update an essay
exports.updateEssay = function(req, res) {
    var essay = req.essay;
    essay = _.extend(essay, req.body);
    essay.updated = Date.now();

    //process.processText(essay);

    essay.save(function(err) {
        if (err) {
            return res.status(400).json(err.errors);
        } else {
            res.json(essay);
        }
    });
}

exports.deleteEssay = function(req, res) {
    var essay = req.essay;

    essay.remove(function(err) {
        if (err) {
            return res.status(400).json(err.errors);
        } else {
            res.json(essay);
        }
    });
}

// TODO: apply metrics on an essay
exports.updateEssayMetrics = function(req, res) {
    return res.json(req.essay);
};