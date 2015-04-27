var openNLP = require("opennlp");
var training = require("../controllers/training");
var mongoose = require("mongoose");
var WordModel = mongoose.model('Word');
var indico = require('indico.io');
indico.apiKey = "f3292eb312b6b9baef4895bc8d919604";

var chi = require("chi-squared");

var expectedHeuristics = training.getExpectedHeuristics();

function prestigeOf(etymology) {

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

function blacklistedWord(word) {
	if (!word.match(/^([A-Za-z0-9]|[-])+$/)) {
		return true;
	}
	var hash = {'the':true,'be':true,'and':true, 'of':true, 'a':true, 'an':true, 'in':true, 'to':true, 
	'have':true,'it':true,'I':true,'that':true,'for':true,'you':true,'he':true,'with':true,'on':true,'do':true,
	'say':true,'this':true,'they':true,'at':true,'but':true,'we':true,'his':true,'from':true,'not':true,'by':true,
	'she':true,'or':true,'as':true,'what':true,'go':true,'their':true,'can':true,'who':true,'get':true,'if':true,
	'would':true,'her':true,'all':true,'my':true};
	if (hash[word.toLowerCase()] != null) {
		return true;
	}
	return false;
}

function linkingVerb(word) {
	var hash = {'be':true,'is':true,
	'are':true,'were':true,'was':true,'veen':true,'appear':true,'appears':true,'appeared':true,
	'seem':true,'seems':true,'seemed':true,'am':true,'look':true,'looks':true,'looked':true,
	'feel':true,'felt':true,'feels':true };
	if (hash[word.toLowerCase()] != null) {
		return true;
	}
	return false;
}

/* calculate objective heuristics */

/* 
Ideal schema:


*/

function checkCallback(counter, callback, resultDict) {
	counter--;
	if (counter == 0) {
		callback(0, resultDict);
	}
	return counter;
}

// basic structure of a result object. This should apply to both objective and subjective heuristics.
	// {
	//  id:
	//	num_words:
	// 	num_chars:
	// 	linking_verbs:
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
	//	pos_match_info:
	// 		pairFreqs: (2-d table)
	// 		totalFreqs (1-d table)
	//		
	//	
	// }

function objectiveHeuristics(id, text, callback) {

	var tokenizer = new openNLP().tokenizer;
	var sentenceDetector = new openNLP().sentenceDetector;
	var posTagger = new openNLP().posTagger;

	var freqTable = {};
	var posArray = [];
	var resultDict = {};

	var counter = 3;

	// FETCH FROM DATABASE HERE
	// calculate word statistics
	tokenizer.tokenize(text, function(err, results) {
		console.log(results);
		var charCount = 0;
		for (var i in results) {
			var result = results[i];
			charCount += result.length;
			if (result in freqTable) {
				freqTable[result]++;
			}
			else {
				freqTable[result] = 1;
			}
		}

		var keys = Object.keys(freqTable);
		keys.sort(function(a,b) {
			if (blacklistedWord(a) && !blacklistedWord(b)) {
				return 1;
			}
			else if (!blacklistedWord(a) && blacklistedWord(b)) {
				return -1;
			}
			if (linkingVerb(a) && !linkingVerb(b)) {
				return 1;
			}
			else if (!linkingVerb(a) && linkingVerb(b)) {
				return -1;
			}
			return freqTable[b] - freqTable[a];
		});

		//calculate linking verbs - TO DO
		var linkingVerbs = 0;
		for(var i in results) {
			var result = results[i];
			if (linkingVerb(result)) {
				linkingVerbs++;
			}
		}
		if (resultDict['pos_info'] == null) {
			resultDict['pos_info'] = {};
		}
		resultDict['linking_verbs'] = linkingVerbs;

		// store number of words, characters, and also
		// top 5 most used words
		resultDict["num_words"] = results.length;
		resultDict["num_chars"] = charCount;

		resultDict["overused_words"] = [];
		var n = 5;
		var i = 0;
		while(i < n) {
			if (freqTable[keys[i]] / results.length < 0.02) {
				break;
			}
			resultDict["overused_words"].push(keys[i]);
			console.log(keys[i] + " " + freqTable[keys[i]]);
			i++;
		}

		counter = checkCallback(counter, callback, resultDict);
	});
	// calculate sentence length variation 
	sentenceDetector.sentDetect(text, function(err, results) {
		var mean = 0;
		var variance = 0;
		for (var i in results) {
			var result = results[i];
			var numWords = result.split(" ").length;
			mean += numWords;
		}
		mean /= results.length;

		for (var i in results) {
			var result = results[i];
			var numWords = result.split(" ").length;
			variance += Math.pow(mean - numWords,2);
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
		for(var i in results) {
			var result = results[i];
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
		if (resultDict['pos_info'] == null) {
			resultDict['pos_info'] = {};
		}
		resultDict["pos_info"]["adj_count"] = adjectiveCount;
		resultDict["pos_info"]["adv_count"] = adverbCount;
		resultDict["pos_info"]["noun_count"] = nounCount;
		resultDict["pos_info"]["verb_count"] = verbCount;
		counter = checkCallback(counter, callback, resultDict);
	});

}

/* Wordnik: http://videlais.com/2015/03/25/starting-with-the-wordnik-api-in-node-js/ */
/* API Key: 8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27 */

function subjectiveHeuristics(id, text, callback) {

	var APIKEY = '8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27';
	/*var Wordnik = require('wordnik-bb').init(APIKEY);
	 
	var randomWordPromise = Wordnik.getRandomWordModel({
	    includePartOfSpeech: "verb-transitive",
	    minCorpusCount: 10000
	  }
	);
	randomWordPromise.done(function(wordModel) {
	  console.log("Random word: ", wordModel.attributes.word); });*/

	resultDict = {};
	var counter = 2;

	//calculate the prestige values of text
	var tokenizer = new openNLP().tokenizer;
	tokenizer.tokenize(text, function(err, results) {
		// need some way to fetch from database 
		// get the etymology associated with the word
		// calculate prestige value
		console.log("results: " + results);
		if (results.length == 0) {
			counter = checkCallback(counter, callback, resultDict);
		}
		var avg = 0;
		var count = 0;
		// take a running average of all words
		for(var i in results) {
			var result = results[i];
			var queryWord = WordModel.findOne({'content':result});
			queryWord.exec(function(err, word) {
				if (word != null) {
					var titleOrigin = word.etymology;
					if (titleOrigin != "none") {
						var prestige = prestigeOf(titleOrigin);
						avg += prestige;
					}
				}
				count++;
				if (count == results.length) {
					avg /= results.length;
					resultDict["etymology_score"] = avg;
					counter = checkCallback(counter, callback, resultDict);
				}
			});
		}
	});

	// calculate sentiment using Indico's API
	indico.sentiment(text)
	.then(function(res){
		console.log("SENTIMENT: " + res);
		resultDict["sentiment"] = res;
		counter = checkCallback(counter, callback, resultDict);
	})
	.catch(function(err) {

	})

	/* TODO -- uncomment and debug

	// calculate POS frequencies
	calculatePOSFreqs(text, function(err, posPairDict, 
		posTotalFreqs, totalWords) {
		resultDict["pos_match_info"] = {};
		resultDict["pos_match_info"]["pairFreqs"] = posPairDict;
		resultDict["pos_match_info"]["totalFreqs"] = posTotalFreqs;
		counter = checkCallback(counter, callback, resultDict);
	}) 
*/
}

/* todo -- uncomment and debug

// helper function to calculate the frequency table for the POS match 
// callback parameters: err, posPairDict, posTotalFreqs, totalWords
function calculatePOSFreqs(text, callback) {
	// store frequencies in a hash table, mapping from one POS -> next POS
	var posTagger = new openNLP().posTagger;
	var posPairDict = new Object(); //2-d dict
	var posTotalFreqs = new Object();

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
		callback(0, posPairDict, posTotalFreqs, totalWords);
	});
}

// calculate POS match - DON'T USE FOR TRAINING DATA, shouldn't really be in process.js
// callback: pass prob as the parameter
function calculatePOSMatch(text, callback) {
	var chiSquaredDict = new Object();
	var finalChiSquared = 0.0;
	// 1) first return the frequencies in a hash table
	calculatePOSFreqs(text, function(err, posPairDict, posTotalFreqs, totalWords) {
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
		callback(0, prob);
	});
} */

function deformatPairFreqs(pairFreqs) {

}

function deformatTotalFreqs(totalFreqs) {

}

function formatPairFreqs(pairFreqsArr) {

}
function formatTotalFreqs(totalFreqsArr) {

}

module.exports = {
	prestigeOf: prestigeOf,
	objectiveHeuristics: objectiveHeuristics,
	subjectiveHeuristics: subjectiveHeuristics,
}
