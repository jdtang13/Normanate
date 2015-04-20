var openNLP = require("opennlp");
var training = require("../controllers/training");

var chi = require("chi-squared");

var expectedHeuristics = training.expectedHeuristics();

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
	tokenizer.tokenize(text, function(err, results) {
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
	sentenceDetector.sentDetect(text, function(err, results) {
		for (var result in results) {
			lenArray.push(result.length);
		}
	});

	/* get part of speech - use it to measure literary cadence */
	posTagger.tag(sentence, function(err, results) {
		for (var result in results) {
			posArray.push(result);
		}
	});

}

/* Wordnik: http://videlais.com/2015/03/25/starting-with-the-wordnik-api-in-node-js/ */
/* API Key: 8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27 */


exports.subjectiveHeuristics = function(text, callback) {

	var APIKEY = '8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27';
	var Wordnik = require('wordnik-bb').init(APIKEY);
	 
	var randomWordPromise = Wordnik.getRandomWordModel({
	    includePartOfSpeech: "verb-transitive",
	    minCorpusCount: 10000
	  }
	);
	randomWordPromise.done(function(wordModel) {
	  console.log("Random word: ", wordModel.attributes.word);

	// calculate POS distribution match 
	//var prob = calculatePOSMatch(text);
});

}


// helper function to calculate the degree of POS match in the text
exports.calculatePOSMatch = function (text, callback) {
	//1) first store frequencies in a hash table, mapping from one POS -> next POS
	var posTagger = new openNLP().posTagger;
	var posPairDict = new Object(); //2-d dict
	var posTotalFreqs = new Object();
	var chiSquaredDict = new Object();
	var totalWords = 0;
	var finalChiSquared = 0.0;

	posTagger.tag(text, function(err, results) {
		for(var i = 0; i < results.length - 1; i++) {
			if (posPairDict[results[i]] == null) {
				posPairDict[results[i]] = new Object();
				posTotalFreqs[results[i]] = new Object();
			}
			if (posPairDict[results[i]][results[i+1]] == null) {
				posPairDict[results[i]][results[i+1]] = 0;
			}
			posPairDict[results[i]][results[i+1]] += 1;
			posTotalFreqs[results[i]] += 1;
			totalWords++;
		}
		// 2) then compute expected frequencies 
		var expectedPairDict = expectedHeuristics["pos_distr"];
		for (var key in expectedPairDict) {
			var posFreqs = expectedPairDict[key];
			for (var key2 in posFreqs) {
				expectedPairDict[key][key2] *= posFreqs[key];
			}
		}

		// 3) using observed and expected frequencies, run a chi-squared test (for each POS) 
		// 4) We can weight each chi-squared test by the frequency of each POS
		for (var key in expectedPairDict) {
			var expectedPosFreqs = expectedPairDict[key];
			var chiSquaredValue = 0;
			for(var key2 in expectedPosFreqs) {
				var temp = Math.pow(expectedPosFreqs[key][key2] - observedPosFreqs[key][key2], 2);
				temp /= expectedPosFreqs[key][key2];
				chiSquaredValue += temp;
			}
			chiSquaredDict[key] = chiSquaredValue;
			finalChiSquared += (chiSquaredValue) * (posTotalFreqs[key]) / totalWords;
		}

		// 5) Now that we have the final chi-squared static, calculate the probability
		
		var prob = chi.cdf(finalChiSquared, Object.keys(posTotalFreqs).length);

		callback(prob);
	});

}