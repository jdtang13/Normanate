var mongoose = require('mongoose');
var Essay = mongoose.model('Essay');
var _ = require('lodash');
var training = require('./training');
var async = require('async');
var stats = require('./stats');

var count = require('../utils/count');
var escape = require('escape-html');

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
    req.essay.content = escape(req.essay.content);
    req.essay.title = escape(req.essay.title);

    res.render('essays/edit', {
        essay: req.essay
    });
};

// GET an essay
exports.getEssay = function(req, res) {

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
            var finalScore = calculateFinal(normals, posProb);

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
                finalScore: finalScore,
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

function calculateFinal(normalDict, posProb) {
    var w_linkingVerbs = 15;
    var w_etymologyScore = 50;
    var w_cadenceGap = 5;
    var w_sentiment = 3;
    var w_verbRatio = 1;
    var w_nounRatio = 1;
    var w_adjRatio = 1;
    var w_advRatio = 5;
    var w_posProb = 1;

    var p_sentenceVar = normalDict["sentence_var"];
    var p_sentenceMean = normalDict["sentence_mean"];
    var p_linkingVerbs = normalDict["linking_verbs"];
    var p_etymologyScore = normalDict["etymology_score"];
    var p_cadenceGap = normalDict["cadence_gap"];
    var p_sentiment = normalDict["sentiment"]; 
    var p_verbRatio = normalDict["verb_ratio"];
    var p_nounRatio = normalDict["noun_ratio"];
    var p_adjRatio = normalDict["adj_ratio"];
    var p_advRatio = normalDict["adv_ratio"];

    var totalScore = (w_linkingVerbs * p_linkingVerbs) + 
        (w_etymologyScore * p_etymologyScore) +
        (w_cadenceGap * p_cadenceGap) + 
        (w_sentiment * p_sentiment) + 
        (w_verbRatio * p_verbRatio) + 
        (w_nounRatio * p_nounRatio) + 
        (w_adjRatio * p_adjRatio) +
        (w_advRatio * p_advRatio);
    var totalWeights = (w_linkingVerbs + w_etymologyScore +
        w_cadenceGap + w_sentiment + 
        w_verbRatio + w_nounRatio + 
        w_adjRatio + w_advRatio + 
        w_posProb);
    return totalScore / totalWeights;
}

// create an essay
exports.postCreateEssay = function(req, res) {
    var essay = new Essay(req.body);
    if (req.isAuthenticated()) {
        essay.author = req.user;
    }

    var limits = require('../config/limits');

    var essayCount = count(essay.content);
    if (limits.characters > 0 && essayCount.characters > limits.characters) {
        var error = {"message": "Reached maximum character limit of " + limits.characters + " characters"};
        return res.status(400).json(error);
    }

    if (limits.words > 0 && essayCount.words > limits.words) {
        var error = {"message": "Reached maximum word limit of " + limits.words + " words"};
        return res.status(400).json(error);
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
    var limits = require('../config/limits');

    var essayCount = count(essay.content);
    if (limits.characters > 0 && essayCount.characters > limits.characters) {
        var error = {"message": "Reached maximum character limit of " + limits.characters + " characters"};
        return res.status(400).json(error);
    }

    if (limits.words > 0 && essayCount.words > limits.words) {
        var error = {"message": "Reached maximum word limit of " + limits.words + " words"};
        return res.status(400).json(error);
    }

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
            //callback(null, {});
        },
        function(callback) {
            console.log("hello world2");
            process.subjectiveHeuristics(-1, essay.content, callback);
        },
    ], function(err, results) {
        console.log("RESULTS: %j", results);
        var resultDict = results[0];
        var resultDict2 = results[1];

        console.log("error: " + resultDict["error"]);
        if ("error" in resultDict) {
            cb(resultDict["error"]);
            return;
        }
        if ("error" in resultDict2) {
            cb(resultDict2["error"]);
            return;
        }

        //convert pos_match_info into 1-d arrays for 
        //insertion into Mongo
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
            resultDict = null;
            resultDict2 = null; 
            oh = null;
        });
    });
};