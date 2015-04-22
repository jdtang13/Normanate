/**
 * GET /
 * Home page.
 */



exports.index = function(req, res) {

	var openNLP = require("opennlp");
	var sentence = 'Pierre Vinken , 61 years old , will join the board as a nonexecutive director Nov. 29. In Moulmein, in lower Burma, I was hated by large numbers of people – the only time in my life that I have been important enough for this to happen to me. I was sub-divisional police officer of the town, and in an aimless, petty kind of way anti-European feeling was very bitter. No one had the guts to raise a riot, but if a European woman went through the bazaars alone somebody would probably spit betel juice over her dress. As a police officer I was an obvious target and was baited whenever it seemed safe to do so. When a nimble Burman tripped me up on the football field and the referee (another Burman) looked the other way, the crowd yelled with hideous laughter. This happened more than once. In the end the sneering yellow faces of young men that met me everywhere, the insults hooted after me when I was at a safe distance, got badly on my nerves. The young Buddhist priests were the worst of all. There were several thousands of them in the town and none of them seemed to have anything to do except stand on street corners and jeer at Europeans.';
	var process = require('./process');
	process.objectiveHeuristics(0, sentence, function(err, result) {
		console.log(result);
	});


	// var tokenizer = new openNLP().tokenizer;
	// tokenizer.tokenize(sentence, function(err, results) {
	// 		console.log("hello world1");
	//     console.log(results)
	//     console.log("hello world1");
	// });
	// var nameFinder = new openNLP().nameFinder;
	// nameFinder.find(sentence, function(err, results) {
	// 		console.log("hello world2");
	//     console.log(results)
	// });
	// var posTagger = new openNLP().posTagger;
	// posTagger.tag(sentence, function(err, results) {
	// 				console.log("hello world3");
	//     console.log(results)
	// });
	// var sentenceDetector = new openNLP().sentenceDetector;
	// sentenceDetector.sentDetect(sentence, function(err, results) {
	// 				console.log("hello world4");
	//     console.log(results)
	// });
	// var posTagger = new openNLP().posTagger;
	// var chunker = new openNLP().chunker;
	// posTagger.tag(sentence, function(err, tokens) {
	//     chunker.chunk(sentence, tokens, function(err, results) {
	//         console.log(results)
	//     });
	// });

	if (req.isAuthenticated()) {
		return res.redirect('/essays');
	}
	

  res.render('home', {
    title: 'Home',
    test: 'hello'
  });
};

exports.about = function(req, res) {
	res.render('pages/about');
}