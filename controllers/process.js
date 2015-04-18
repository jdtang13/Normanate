var openNLP = require("opennlp");

exports.processText = function(text) {
	/* do text processing and calculate heuristics */
}

/* calculate objective heuristics */
exports.objectiveHeuristics = function(text) {
	var tokenizer = new openNLP().tokenizer;
	var sentenceDetector = new openNLP().sentenceDetector;
	var posTagger = new openNLP().posTagger;
	var freqTable = {};
	var lenArray = [];
	var posArray = [];

	/* calculate word frequencies */
	tokenizer.tokenize(text, function(err, results)) {
		for (var result in results) {
			if (result in freqTable) {
				freqTable[result]++;
			}
			else {
				freqTable[result] = 1;
			}
		}
	});
	/* calculate sentence length variation */
	sentenceDetector.sentDetect(text, function(err, results)) {
		for (var result in results) {
			lenArray.push(result.length);
		}
	}

	/* get part of speech - use it to measure literary cadence */
	posTagger.tag(sentence, function(err, results)) {
		for (var result in results) {
			posArray.push(result);
		}
	}
}

/* Wordnik: http://videlais.com/2015/03/25/starting-with-the-wordnik-api-in-node-js/ */
/* API Key: 8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27 */

exports.subjectiveHeuristics = function(text) {

	var APIKEY = '8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27';
	var Wordnik = require('wordnik-bb').init(APIKEY);
	 
	var randomWordPromise = Wordnik.getRandomWordModel({
	    includePartOfSpeech: "verb-transitive",
	    minCorpusCount: 10000
	  }
	);
	randomWordPromise.done(function(wordModel) {
	  console.log("Random word: ", wordModel.attributes.word);
});
	
}