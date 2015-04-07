var mongoose = require('mongoose');
var Essay = mongoose.model('Essay');

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

// GET an essay
exports.getEssay = function(req, res) {
    res.render('essays/view', {
        essay: req.essay
    });
};

// create an essay
exports.postCreateEssay = function(req, res) {
    var essay = new Essay(req.body);
    if (req.isAuthenticated()) {
        essay.author = req.user;
    }

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

// TODO: apply metrics on an essay
exports.updateEssayMetrics = function(req, res) {
    return res.json(req.essay);
};