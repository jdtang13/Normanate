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

	sentenceDetector.sentDetect(text, function(err, results)) {
		for (var result in results) {
			lenArray.push(result.length);
		}
	}

	posTagger.tag(sentence, function(err, results)) {
		for (var result in results) {
			/* do something with the part of speech */
			
		}
	}
}