var passport = require('passport');

/**
 * OAuth authentication routes. (Sign in)
 */
module.exports = function(app) {
    
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
      res.redirect(req.session.returnTo || '/');
    });
};
