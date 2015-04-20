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
    console.log(req.essay);
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

    //  generate heuristic data and save it

    //h = process.processText(essay);
    //essay.heuristics[0] = h;

    essay.save(function(err) {
        if (err) {
            console.log(err);
            return res.send('users/signup', {
                errors: err.errors,
                piece: piece
            });
        } else {
            return res.json(essay);
        }
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