var mongoose = require('mongoose');
var Essay = mongoose.model('Essay');
var _ = require('lodash');

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
    res.render('essays/view', {
        essay: req.essay
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
    //  TODO: this needs to be made async
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
    //  TODO -- is this correct? probably not
    var dict;
    process.objectiveHeuristics(-1, essay.content, 
        function (err, resultDict) {
        if (!err) {
            console.log("successfully calculated objective heuristics!");
            dict = resultDict;
            console.log("content of dict is: %j", dict);

              var oh = new ObjectiveModel( 
                {
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
    }
    );


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