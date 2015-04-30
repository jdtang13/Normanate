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
	'have':true,'it':true,'i':true,'that':true,'for':true,'you':true,'he':true,'with':true,'on':true,'do':true,
	'say':true,'this':true,'they':true,'at':true,'but':true,'we':true,'his':true, 'him':true,'from':true,'not':true,'by':true,
	'she':true,'or':true,'as':true,'what':true,'go':true,'their':true,'can':true,'who':true,'get':true,'if':true,
	'would':true,'her':true,'all':true,'my':true, 'me':true};
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
function pruneResults(results) {
	var temp = [];
	for(var i in results) {
		var result = results[i];
		if (result.match(/^([A-Za-z0-9]|[-])+$/)) {
			temp.push(result);
		}
	}
	return temp;
}

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

		results = pruneResults(results);

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
			if (blacklistedWord(keys[i])) {
				console.log("BLACKLISTED word:");
				i++;
				continue;
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
	var counter = 3;

	//calculate the prestige values of text
	var tokenizer = new openNLP().tokenizer;
	tokenizer.tokenize(text, function(err, results) {
		// need some way to fetch from database 
		// get the etymology associated with the word
		// calculate prestige value
		results = pruneResults(results);
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
	indico.sentiment(text).then(function(res){
		console.log("SENTIMENT: " + res);
		resultDict["sentiment"] = res;
		counter = checkCallback(counter, callback, resultDict);
	})
	.catch(function(err) {
		console.log("Indico error -- suppressed");
	})

	// TODO -- uncomment and debug

	// calculate POS frequencies
	calculatePOSFreqs(text, function(err, posPairDict, 
		posTotalFreqs, totalWords) {
		resultDict["pos_match_info"] = {};
		resultDict["pos_match_info"]["pairFreqs"] = posPairDict;
		resultDict["pos_match_info"]["totalFreqs"] = posTotalFreqs;
		console.log("posPairDict: %j", posPairDict);
		console.log("posTotalFreqs: %j", posTotalFreqs);
		counter = checkCallback(counter, callback, resultDict);
	}); 
}

/* todo -- uncomment and debug */

// helper function to calculate the frequency table for the POS match 
// callback parameters: err, posPairDict, posTotalFreqs, totalWords
// return values:
// NOU - noun
// PRO - pronoun
// ADJ - adjective
// VER - verb
// ADV - adverb
// PRE - preposition
// CON - conjunction
// INT - interjection
// DET - determinant
// NUL - null

function getPosTags() {
	var posTags = ["NOU","PRO","ADJ","VER","ADV","PRE","CON","INT","DET","NUL"];
	return posTags;
}

function getPosMapping() {
	var NOU = 0;
	var PRO = 1;
	var ADJ = 2;
	var VER = 3;
	var ADV = 4;
	var PRE = 5;
	var CON = 6;
	var INT = 7;
	var DET = 8;
	var NUL = 9;
	var posDict = {"CC":CON, "CD": NUL, "DT": DET, "EX": NUL, "FW": NUL,
					"IN": PRE, "JJ": ADJ, "JJR": ADJ, "JJS":ADJ,"LS":NUL,
					"MD":NUL, "NN":NOU, "NNS":NOU, "NNP":NOU,"NNPS":NOU,"PDT":NUL,"POS":NUL,"PRP":PRO,
					"PRP$":PRO,"RB":ADV,"RBR":ADV,"RBS":ADV,"RP":PRE,"SYM":NUL,"TO":PRE,"UH":INT,
					"VB":VER,"VBD":VER,"VBG":VER,"VBN":VER,"VBP":VER,"VBZ":VER,"WDT":DET,"WP":PRE,
					"WP$":PRE,"WRB":ADV};
	return posDict;
}

function identifyPOS(posTag) {
	var posMapping = getPosMapping();
	var posTags = getPosTags();
	if (posTag in posMapping) {
		return posTags[posMapping[posTag]];
	}
	return posTags[9]; //NUL tag
	
}

function calculatePOSFreqs(text, callback) {
	// store frequencies in a hash table, mapping from one POS -> next POS
	var posTagger = new openNLP().posTagger;
	var posPairDict = new Object(); //2-d dict
	var posTotalFreqs = new Object();

	console.log("Calculating POS frequencies");

	// initialize the dictionaries
	var posTags = getPosTags();
	for(var i in posTags) {
		posPairDict[posTags[i]] = {};
		for(var j in posTags) {
			posPairDict[posTags[i]][posTags[j]] = 1;
		}
		posTotalFreqs[posTags[i]] = 1;
	}

	posTagger.tag(text, function(err, results) {
		var totalWords = 0;
		for(var i = 0; i < results.length - 1; i++) {
			var pos = identifyPOS(results[i]);
			var pos2 = identifyPOS(results[i+1]);

			posPairDict[pos][pos2] += 1;
			posTotalFreqs[pos] += 1;
			totalWords++;
		}
		callback(0, posPairDict, posTotalFreqs, totalWords);
	});
}

// calculate POS match - DON'T USE FOR TRAINING DATA, shouldn't really be in process.js
// callback: pass prob as the parameter
function calculatePOSMatch(posPairDict, posTotalFreqs,
	expectedPairFreqs,expectedTotalFreqs) {
	var chiSquaredDict = new Object();
	var finalChiSquared = 0.0;

	var totalWords = 0;
	for (var key in posTotalFreqs) {
		totalWords += posTotalFreqs[key];
	}

	// 3) using observed and expected frequencies, run a chi-squared test (for each POS) 
	// 4) We can weight each chi-squared test by the frequency of each POS
	for (var key in expectedPairFreqs) {
		var expectedPosFreqs = expectedPairFreqs[key];
		var chiSquaredValue = 0;
		for(var key2 in expectedPosFreqs) {
			var temp = Math.pow(expectedPosFreqs[key2] - posPairDict[key][key2], 2);
			temp /= expectedPosFreqs[key2];
			console.log("temp: " + temp);
			chiSquaredValue += temp;
		}
		chiSquaredDict[key] = chiSquaredValue;
		console.log("chi squared value: " + chiSquaredValue);
		finalChiSquared += (chiSquaredValue) * (posTotalFreqs[key]) / totalWords;
	}

	console.log("final chi squared: " + finalChiSquared);

	// 5) Now that we have the final chi-squared static, calculate the probability
	var prob = chi.cdf(finalChiSquared, Object.keys(posTotalFreqs).length);
	return prob;
}

/* deformats into a 1-d array for storage in Mongo */
function deformatPairFreqs(pairFreqs) {
	var posTags = getPosTags();
	var results = [];
	for(var i in posTags) {
		for(var j in posTags) {
			results.push(pairFreqs[posTags[i]][posTags[j]]);
		}
	}
	return results;
}

function deformatTotalFreqs(totalFreqs) {
	var posTags = getPosTags();
	var results = [];
	for(var i in posTags) {
		results.push(totalFreqs[posTags[i]]);
	}
	return results;
}

/* formats from a 1-d array into a 2-d dictionary */
function formatPairFreqs(pairFreqsArr) {
	var posTags = getPosTags();
	var results = {};
	var count = 0;
	for(var i in posTags) {
		results[posTags[i]] = {};
		for(var j in posTags) {
			results[posTags[i]][posTags[j]] = pairFreqsArr[count];
			count++;
		}
	}
	return results;
}
function formatTotalFreqs(totalFreqsArr) {
	var posTags = getPosTags();
	var results = {};
	for(var i in posTags) {
		results[posTags[i]] = totalFreqsArr[i];
	}
	return results;
}

module.exports = {
	prestigeOf: prestigeOf,
	objectiveHeuristics: objectiveHeuristics,
	subjectiveHeuristics: subjectiveHeuristics,
	getPosTags: getPosTags,
	calculatePOSFreqs: calculatePOSFreqs,
	calculatePOSMatch: calculatePOSMatch,
	deformatPairFreqs: deformatPairFreqs,
	deformatTotalFreqs: deformatTotalFreqs,
	formatPairFreqs: formatPairFreqs,
	formatTotalFreqs: formatTotalFreqs,
}
