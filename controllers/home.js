/**
 * GET /
 * Home page.
 */



exports.index = function(req, res) {

	var openNLP = require("opennlp");
	var sentence = 'Pierre Vinken , 61 years old , will join the board as a nonexecutive director Nov. 29 .';
	var process = require('./process');
	process.objectiveHeuristics(0, sentence, function(result) {
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

	

  res.render('home', {
    title: 'Home',
    test: 'hello'
  });
};

exports.about = function(req, res) {
	res.render('pages/about');
}