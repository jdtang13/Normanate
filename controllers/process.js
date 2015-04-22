var openNLP = require("opennlp");
var training = require("../controllers/training");
var mongoose = require("mongoose");
var WordModel = mongoose.model('Word');

var chi = require("chi-squared");

var expectedHeuristics = training.expectedHeuristics();

exports.processText = function(text) {
	/* do text processing and calculate heuristics */
}

exports.prestigeOf = function(etymology) {

    var etymologies = ["Abnaki", "Afrikaans", "Akkadian", "Algonquian", "American English", 
    "American Spanish", "Anglican", "Anglo-French", "Anglo-Latin", "Anglo-Norm", "Arabic", "Aramaic", "Arawakan", "Armenian", "Assyrian",
    "Attic", "Basque", "Breton", "Cantonese", "Carib", "Catalan", "Cherokee", "Chinook", "Church Latin", "Coptic", "Cornish",
    "Croatian", "Czech", "Danish", "Dravidian", "Dutch", "Ecclesiastical Greek", "East Frisian", "Egypt", "English", "Estonian", "Etruscan",
    "Finnish", "Flemish", "Frankish", "French", "Frisian", "Fulani", "Gallo-Romance", "Gaelic", "Gaulish", "German", "Gothic", "Greek", "Germanic",
    "Guarani", "Hawaiian", "Hebrew", "Hung", "Ibo", "Indo-European", "Irish", "Iran", "Iroquoian", "Italian", "Kentish", "Japanese", "Kurdish", "Kwa",
    "Latin", "Lithuanian", "Late Latin", "Low German", "Malay", "Mandarin", "Mandingo", "Middle Dutch", "Middle English", "Mercian", "Mexican Spanish",
    "Micmac", "Middle French", "Middle High German", "Middle Irish", "Medieval Latin", "Middle Low German", "Mod.Eng.", "Modern Greek", "Modern Latin", 
    "Muskogean", "Nahuatl", "N.E", "North Germanic", "North Sea Germanic", "Northumbrian", "O.Celt.", "O.Fr.", "Ojibwa", "Old Church Slavonic",
    "Old Danish", "Old Dutch", "Old English", "Old Frisian", "Old High German", "Old Irish", "Old Italian", "Old Low German", "Old Norse", 
    "Old North French", "Old Persian", "Old Provencal", "Old Prussian", "Old Saxon", "O.Slav.", "O.Sp.", "Old Swedish", "Pashto", "Pennsylvania Dutch",
    "Persian", "P.Gmc.", "Phoenician", "Phrygian", "Piman", "Polish", "Portuguese", "Proto-Italic", "Provencal", "Quechua", "Russian", "Sanskrit", "Scand",
    "Scot.", "Serbo-Croatian", "Semitic", "Serb.", "Sinhalese", "Siouan", "Slav.", "Slovak", "Spanish","Sumerican", "Swedish", "Tamil","Telugu",
    "Thai", "Tibetan", "Tupi", "Turk", "Turkic", "Twi", "Ukrainian", "Urdu", "Uto-Aztecan", "Vulgar Latin", "W.Afr.", "West Frisian", "West Germanic",
    "Wolof", "West Saxon", "Xhosa", "Yoruba", "none"];

    // 1 is high prestige, 0 is low prestige
	   // general rules:
    // high prestige -- latin, french
    // mid prestige -- greek, semitic languages, spanish, slavic, scandinavian germanic, other exotic languages
    // low prestige -- germanic, celtic, native american languages, siberian/mongol/uralic languages
    var prestige = [ 0, 0, 0.5, 0, 0,
    0.5, 0, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5,
    0.5, 0.5, 0, 0, 0, 1, 0, 0, 1, 0.5, 0,
    0.5, 0.5, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0.5,
    0, 0, 0, 1, 0, 0.5, 1, 0, 1, 0, 0, 0.5, 0,
    0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0.5, 0, 1, 0, 0.5, 0.5, 0.5,
    1, 0.5, 1, 0, 0.5, 0.5, 0.5, 0, 0, 0.5, 0,
    0, 1, 0, 0, 1, 0, 0, 0.5, 1, 
    0.5, 0.5, 0.5, 0, 0, 0, 0, 1, 0.5, 0.5,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 
    1, 0.5, 1, 0, 0, 0.5, 1, 0, 0.5, 0,
    0.5, 0, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 0, 0.5, 0.5, 0,
    0, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5,
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0, 0,
    0.5, 0, 0.5, 0.5, 0.5];

    var index = etymologies.indexOf(etymology);
    if (index == -1) { 
    	return 0.5;
	}

    return prestige[index];

}

/* calculate objective heuristics */

/* 
Ideal schema:


*/

function checkCallback(counter, callback, resultDict) {
	counter--;
	if (counter == 0) {
		callback(resultDict);
	}
	return counter;
}

// basic structure of a result object. This should apply to both objective and subjective heuristics.
	// {
	//  id:
	//	num_words:
	// 	num_chars:
	// 	etymology_score: 
	// 	overused_words:
	//		word:
	//	sentence_info:
	// 		mean:
	//		var:
	//		num:
	// 	pos_info:
	// 		adj_count:
	//		adv_count:
	// 		noun_count:
	//		verb_count:
	//		goodness_of_fit: (subjective)
	//	
	// }

exports.objectiveHeuristics = function(id, text, callback) {

	var tokenizer = new openNLP().tokenizer;
	var sentenceDetector = new openNLP().sentenceDetector;
	var posTagger = new openNLP().posTagger;

	var freqTable = {};
	var lenArray = [];
	var posArray = [];
	var resultDict = {};

	var counter = 3;

	// FETCH FROM DATABASE HERE

	// calculate word statistics
	tokenizer.tokenize(text, function(err, results) {
		var charCount = 0;
		for (var result in results) {
			charCount += result.length;
			if (result in freqTable) {
				freqTable[result]++;
			}
			else {
				freqTable[result] = 1;
			}
		}
		results.sort(function(a,b) {
			return freqTable[b] - freqTable[a];
		});

		//calculate linking verbs - TO DO

		// store number of words, characters, and also
		// top 5 most used words
		resultDict["num_words"] = results.length;
		resultDict["num_chars"] = charCount;

		resultDict["overused_words"] = [];
		var n = Math.min(5, results.length);
		for(var i = 0; i < n; i++) {
			resultDict["overused_words"].push(result[i]);
		}

		counter = checkCallback(counter, callback, resultDict);
	});
	// calculate sentence length variation 
	sentenceDetector.sentDetect(text, function(err, results) {
		var mean = 0;
		var variance = 0;
		for (var result in results) {
			mean += result.length;
			lenArray.push(result.length);
		}
		mean /= results.length;

		for (var result in results) {
			variance += Math.pow(mean - result.length,2);
		}
		variance /= results.length;

		resultDict["sentence_info"] = {};
		resultDict["sentence_info"]["mean"] = mean;
		resultDict["sentence_info"]["var"] = variance;
		resultDict["sentence_info"]["num"] = results.length;

		counter = checkCallback(counter, callback, resultDict);	
	});

	// get num paragraphs - TO DO

	posTagger.tag(text, function(err, results) {
		var adjectiveCount = 0;
		var adverbCount = 0;
		var nounCount = 0;
		var verbCount = 0;
		for(var result in results) {
			if (result == "JJ" || result == "JJR" || result == "JJS") {
				adjectiveCount++;
			}
			else if (result == "RB" || result == "RBR" 
				|| result == "RBS" || result == "WRB") {
				adverbCount++;
			}
			else if (result == "NN" || result == "NNS" || 
				result == "NNP" || result == "NNPS" || 
				result == "PRP" || result == "PRP$" || 
				result == "WP" || result == "WP$") {
				nounCount++;
			}
			else if (result == "VB" || result == "VBD" ||
				result == "VBG" || result == "VBN" || 
				result == "VBP" || result == "VBZ") {
				verbCount++;
			}
		}
		resultDict["pos_info"] = {};
		resultDict["pos_info"]["adj_count"] = adjectiveCount;
		resultDict["pos_info"]["adv_count"] = adverbCount;
		resultDict["pos_info"]["noun_count"] = nounCount;
		resultDict["pos_info"]["verb_count"] = verbCount;
		counter = checkCallback(counter, callback, resultDict);
	});
	// get part of speech statistics 
	// posTagger.tag(sentence, function(err, results) {
	// 	for (var result in results) {
	// 		posArray.push(result);
	// 	}
	// 	counter = checkCallback(counter, callback, resultDict);
	// });

}

/* Wordnik: http://videlais.com/2015/03/25/starting-with-the-wordnik-api-in-node-js/ */
/* API Key: 8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27 */

exports.subjectiveHeuristics = function(id, text, callback) {

	var APIKEY = '8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27';
	var Wordnik = require('wordnik-bb').init(APIKEY);
	 
	var randomWordPromise = Wordnik.getRandomWordModel({
	    includePartOfSpeech: "verb-transitive",
	    minCorpusCount: 10000
	  }
	);
	randomWordPromise.done(function(wordModel) {
	  console.log("Random word: ", wordModel.attributes.word);


	resultDict = {};
	var counter = 1;

	//calculate the prestige values of text
	var tokenizer = new OpenNLP().tokenizer;
	tokenizer.tokenize(text, function(err, results) {
		// need some way to fetch from database 
		// get the etymology associated with the word
		// calculate prestige value
		var avg = 0;
		var count = 0;
		// take a running average of all words
		calculatePrestige = function(prestige) {
			avg += prestige;
			count++;
			if (count == results.length) {
				avg /= results.length;
				resultDict["etymology_score"] = avg;
				counter = checkCallback(counter, callback, resultDict);
			}
		}
		for(var result in results) {
			var queryWord = WordModel.findOne({'content':result});
			queryWord.exec(function(err, word) {
				if (word != null) {
					var titleOrigin = word.etymology;
					if (titleOrigin != "none") {
						var prestige = self.prestigeOf(titleOrigin);
						calculatePrestige(prestige);
					}
				}
			});
		}

	});
	// calculate POS distribution match 
	// var prob = calculatePOSMatch(text);
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