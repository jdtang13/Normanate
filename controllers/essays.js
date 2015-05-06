var mongoose = require('mongoose');
var Essay = mongoose.model('Essay');
var _ = require('lodash');
var training = require('./training');
var async = require('async');
var stats = require('./stats');

var suggest = require('./suggestions');


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

    console.log(req.essay);
    var suggestions = suggest.getSuggestions(req.essay);
    
    var MasterObjective = require('mongoose').model('MasterObjectiveHeuristic');
    async.series([
        function(callback) {
            var query = MasterObjective.findOne({ type: "avg"});
            query.exec(function(err, result){
                callback(null, result);
            });
        },
        function(callback) {
            var query = MasterObjective.findOne({ type: "var"});
            query.exec(function(err, result) {
                callback(null, result);
            });
        },
    ], function(err, results) {
        console.log("master results: %j", results);
        var avgObjective = results[0];
        var varObjective = results[1];
        if (avgObjective != null && varObjective != null) {
            var normals = calculateNormals(req.essay, avgObjective, varObjective);

            var posPairFreqs = process.formatPairFreqs(
                req.essay.objectives[0].pos_match_pairFreqs);
            var posTotalFreqs = process.formatTotalFreqs(
                req.essay.objectives[0].pos_match_totalFreqs);

            var expectedPairFreqs = process.formatPairFreqs(
                avgObjective.pos_match_pairFreqs);
            var expectedTotalFreqs = process.formatTotalFreqs(
                avgObjective.pos_match_totalFreqs);
            var posTags = process.getPosTags();
            for(var i in posTags) {
                for(var j in posTags) {
                    expectedPairFreqs[posTags[i]][posTags[j]] *= req.essay.objectives[0].num_words;
                    if (expectedPairFreqs[posTags[i]][posTags[j]] == 0) {
                        expectedPairFreqs[posTags[i]][posTags[j]] = 1;
                    }
                }
                expectedTotalFreqs[posTags[i]] *= req.essay.objectives[0].num_words;
                if (expectedTotalFreqs[posTags[i]] == 0) {
                    expectedTotalFreqs[posTags[i]] = 1;
                }
            }

            console.log("sample pairfreqs: %j", posPairFreqs);
            console.log("expected pairfreqs: %j", expectedPairFreqs);

            var posProb = process.calculatePOSMatch(posPairFreqs,posTotalFreqs,
                expectedPairFreqs, expectedTotalFreqs);
            console.log("normals: %j", normals);
            console.log("pos prob: %j", posProb);
            console.log("master objective found!");
            res.render('essays/view', {
                essay: req.essay,
                suggestions: suggestions,
                masterObjective: avgObjective,
                normals: normals,
                posProb: posProb,
            });
        }
        else {
            console.log(" ERROR : master objective not found, please run 'node train' and try again.");
            res.render('essays/view', {
                essay: req.essay,
                suggestions: suggestions
            });
        }
    });
};

exports.getEssays = function(req, res) {

    Essay.find({ author:req.user.id }).sort('-modified').exec(function(err, essays) {
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

// calculate normal distribution given essay object and masterObjective object
// return dictionary with the following format:
// sentence_var:
// sentence_mean:
// linking_verbs:
// etymology_score:
function calculateNormals(essay, master_avg, master_var) {

    console.log("master obj heuristics: %j", master_avg);
    var s_sentenceVar = essay.objectives[0].sentence_var;
    var e_sentenceVar = master_avg.sentence_var;
    var v_sentenceVar = master_var.sentence_var;
    var p_sentenceVar = stats.calculatePValue(s_sentenceVar, e_sentenceVar, v_sentenceVar);

    var s_sentenceMean = essay.objectives[0].sentence_mean;
    var e_sentenceMean = master_avg.sentence_mean;
    var v_sentenceMean = master_var.sentence_mean;
    var p_sentenceMean = stats.calculatePValue(s_sentenceMean, e_sentenceMean, v_sentenceMean);

    var s_linkingVerbs = (essay.objectives[0].linking_verbs / essay.objectives[0].num_words);
    var e_linkingVerbs = master_avg.linking_verbs_ratio;
    var v_linkingVerbs = master_var.linking_verbs_ratio;
    var p_linkingVerbs = stats.calculatePValue(s_linkingVerbs, e_linkingVerbs, v_linkingVerbs);

    var s_verbRatio = (essay.objectives[0].verb_count / essay.objectives[0].num_words );
    var e_verbRatio = master_avg.verb_ratio;
    var v_verbRatio = master_var.verb_ratio;
    var p_verbRatio = stats.calculatePValue(s_verbRatio, e_verbRatio, v_verbRatio);

    var s_nounRatio = (essay.objectives[0].noun_count / essay.objectives[0].num_words );
    var e_nounRatio = master_avg.noun_ratio;
    var v_nounRatio = master_var.noun_ratio;
    var p_nounRatio = stats.calculatePValue(s_nounRatio, e_nounRatio, v_nounRatio);

    var s_adjRatio = (essay.objectives[0].adj_count / essay.objectives[0].num_words );
    var e_adjRatio = master_avg.adj_ratio;
    var v_adjRatio = master_var.adj_ratio;
    var p_adjRatio = stats.calculatePValue(s_adjRatio, e_adjRatio, v_adjRatio);

    var s_advRatio = (essay.objectives[0].adv_count / essay.objectives[0].num_words );
    var e_advRatio = master_avg.adv_ratio;
    var v_advRatio = master_var.adv_ratio;
    var p_advRatio = stats.calculatePValue(s_advRatio, e_advRatio, v_advRatio);

    var s_etymologyScore = essay.objectives[0].etymology_score;
    var e_etymologyScore = master_avg.etymology_score;
    var v_etymologyScore = master_var.etymology_score;
    var p_etymologyScore = stats.calculatePValue(s_etymologyScore, e_etymologyScore, v_etymologyScore);

    var s_cadenceGap = essay.objectives[0].cadence_gap;
    var e_cadenceGap = master_avg.cadence_gap;
    var v_cadenceGap = master_var.cadence_gap;
    var p_cadenceGap = stats.calculatePValue(s_cadenceGap, e_cadenceGap, v_cadenceGap);

    var s_sentiment = essay.objectives[0].sentiment;
    var e_sentiment = master_avg.sentiment;
    var v_sentiment = master_var.sentiment;
    var p_sentiment = stats.calculatePValue(s_sentiment, e_sentiment, v_sentiment);

    var normalDict = {};
    normalDict["sentence_var"] = p_sentenceVar;
    normalDict["sentence_mean"] = p_sentenceMean;
    normalDict["linking_verbs"] = p_linkingVerbs;
    normalDict["etymology_score"] = p_etymologyScore;
    normalDict["cadence_gap"] = p_cadenceGap;
    normalDict["sentiment"] = p_sentiment; 
    normalDict["verb_ratio"] = p_verbRatio;
    normalDict["noun_ratio"] = p_nounRatio;
    normalDict["adj_ratio"] = p_adjRatio;
    normalDict["adv_ratio"] = p_advRatio;
    return normalDict; 
}

// create an essay
exports.postCreateEssay = function(req, res) {
    var essay = new Essay(req.body);
    if (req.isAuthenticated()) {
        essay.author = req.user;
    }

    updateEssayMetrics(essay, req, res, function(error, e) {
        if (error) {
            return res.status(400).json(error);
        }
        e.save(function(err) {
            if (err) {
                console.log(err);
                return res.status(400).json(err.errors);
            } else {
                console.log("essay saved!");
                return res.json(e);
            }
        });
    });
    
};

// update an essay
exports.updateEssay = function(req, res) {
    var essay = req.essay;
    essay = _.extend(essay, req.body);
    essay.updated = Date.now();

    updateEssayMetrics(essay, req, res, function(error, e) {
        if (error) {
            return res.status(400).json(error);
        }
        e.save(function(err) {
            if (err) {
                console.log(err);
                return res.status(400).json(err.errors);
            } else {
                console.log("essay saved!");
                console.log(e);
                return res.json(e);
            }
        });
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
var updateEssayMetrics = function(essay, req, res, cb) {

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
        console.log("RESULTS: %j", results);
        var resultDict = results[0];
        var resultDict2 = results[1];

        if (resultDict["error"] != null || resultDict2["error"] != null) {

        }
        //convert pos_match_info into 1-d arrays for 
        //insertion into Mongo
        // var posPairFreqs = dict["pos_match_info"]["pairFreqs"];
        // var posTotalFreqs = dict["pos_match_info"]["totalFreqs"];

        var posPairArr = process.deformatPairFreqs(resultDict2["pos_match_info"]["pairFreqs"]);
        var posTotalArr = process.deformatTotalFreqs(resultDict2["pos_match_info"]["totalFreqs"]);

        var oh = new ObjectiveModel( 
        {
            num_words: resultDict["num_words"],
            num_chars: resultDict["num_chars"],
            linking_verbs: resultDict["linking_verbs"],
            etymology_score: resultDict2["etymology_score"],
            cadence_gap: resultDict2["cadence_gap"],
            overused_words: resultDict["overused_words"],
            sentence_mean: resultDict["sentence_info"]["mean"],
            sentence_var: resultDict["sentence_info"]["var"],
            sentence_num: resultDict["sentence_info"]["num"],
            adj_count: resultDict["pos_info"]["adj_count"],
            adv_count: resultDict["pos_info"]["adv_count"],
            noun_count: resultDict["pos_info"]["noun_count"],
            verb_count: resultDict["pos_info"]["verb_count"],
            sentiment: resultDict2["sentiment"],
            reading_time: resultDict2["reading_time"],
            pos_match_pairFreqs: posPairArr,
            pos_match_totalFreqs: posTotalArr,

        });
        oh.save(function (err) {
            if (err) {
                console.log("error while saving oh!");
                console.log(err);
                cb(err);
            }
            else {
                // we only use element 0 for now, since subdocuments
                // cannot be embedded without an array.
                essay.objectives = [];
                essay.objectives.unshift(oh);
                console.log("successfully saved the objective heuristics!");
                cb(null, essay);
            }
            // saved!
        });
    });
};