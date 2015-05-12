/**
 * GET /
 * Home page.
 */


// render the index
exports.index = function(req, res) {
	if (req.isAuthenticated()) {
		return res.redirect('/essays');
	}
	

  res.render('home', {
    title: 'Home',
    test: 'hello'
  });
};

// static pages
exports.about = function(req, res) {
	res.render('pages/about');
}

exports.privacy = function(req, res) {
	res.render('pages/privacy');
}