// routes related to individual essays
var mongoose = require('mongoose');
var Essay = mongoose.model('Essay');

var passportConf = require('../config/passport');
var essayController = require('../controllers/essays');

// PARAMS
var essayParam = function(req, res, next, id) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          // Yes, it's a valid ObjectId, proceed with `findById` call.
          return next('route');
    }
    Essay.findOne({_id: id}, function(err, essay) {
        if (err) {
            return next(err);
        }
        if (!essay) {
            return next('route');
        }
        req.essay = essay;
        next();
    });
};

module.exports = function(app) {

    // params
    app.param('essay', essayParam);

    app.route('/essays')
        .post(essayController.postCreateEssay)
        .get(passportConf.isAuthenticated, essayController.getEssays);

    app.route('/essays/:essay')
        .get(essayController.hasAuthorization, essayController.getEssay)
        .put(essayController.hasAuthorization, essayController.updateEssay)
        .delete(essayController.hasAuthorization, essayController.deleteEssay);

    app.route('/essays/:essay/edit')
        .get(essayController.hasAuthorization, essayController.getEditEssay);
};