var training = require("../controllers/training");
var mongoose = require("mongoose");
var WordModel = mongoose.model('Word');
var WordCadenceModel = mongoose.model('WordCadence');
var indico = require('indico.io');
var async = require('async');
indico.apiKey = "f3292eb312b6b9baef4895bc8d919604";

var chi = require("chi-squared");
var expectedHeuristics = training.getExpectedHeuristics();
var readingTime = require('reading-time');
var compendium = require('compendium-js');


// Helper function that returns the prestige of a word, given the etymology
// All etymology terms are defined from the Online Etymology Dictionary
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

// Helper function to identify a "blacklisted word": A word so common
// that it might not be worth processing
function blacklistedWord(word) {
	if (!word) {
		return false;
	}
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

// Helper function to identify a linking verb
function linkingVerb(word) {
	if (!word) {
		return false;
	}
	var hash = {'be':true,'is':true,
	'are':true,'were':true,'was':true,'veen':true,'appear':true,'appears':true,'appeared':true,
	'seem':true,'seems':true,'seemed':true,'am':true,'look':true,'looks':true,'looked':true,
	'feel':true,'felt':true,'feels':true };
	if (hash[word.toLowerCase()] != null) {
		return true;
	}
	return false;
}

//Helper function that prunes result data so that punctuation 
//is not included. 
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


// In the functions below, i have methods for calculating objective and subjecitve heuristics. They
// will return two parts of a "result dictionary" that will have the schema shown below: 
// Basic structure of a result object. This should apply to both objective and subjective heuristics.
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



// Calculate objective heuristics - word count, sentence length,
// sentence variance, linking verbs, verb/noun/adjective/adverb count.
// These are all heuristics that can evaluated easily on an 
// objective level. 
function objectiveHeuristics(id, text, callback) {

	async.parallel([
		// calculate various word-level statistics
		function(aCB) {
			var openNLP = require("opennlp");
			var tokenizer = new openNLP().tokenizer;
			var freqTable = {};
			var resultDict = {};
			tokenizer.tokenize(text, function(err, results) {

				if (results == null || results.length == 0) {
					resultDict["error"] = {"message": "Write more words! We can't process your essay like this."};
					aCB(null, resultDict);
					return;
				}

				results = pruneResults(results);

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
				var min = Math.min(n, keys.length);
				while(i < min) {
					if (freqTable[keys[i]] / results.length < 0.02) {
						break;
					}
					if (blacklistedWord(keys[i])) {
						i++;
						continue;
					}
					resultDict["overused_words"].push(keys[i]);
					i++;
				}
				tokenizer = null;
				aCB(null, resultDict);
			});
		},
		// calculate various sentence-level statistics
		function(aCB) {
			console.log("Calculating sentence statistics");
			var openNLP = require("opennlp");
			var sentenceDetector = new openNLP().sentenceDetector;
			var resultDict = {};
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
				sentenceDetector = null;
				aCB(null, resultDict);
			});
		},
		// calculate various part of speech -level statistics
		function(aCB) {
			console.log("calculating POS statistics");

			var resultDict = {};
			try {
				var analysis = compendium.analyse(text);
			}
			catch (e) {
				resultDict["error"] = {"message": "Write more words! We can't process your essay like this."};
				aCB(null, resultDict);
				return;
			}
			var results = [];
			for (var i in analysis) {
				var chunk = analysis[i];
				results = results.concat(chunk["tags"]);
			}

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
					result == "PRP" || result == "PP$" || 
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
			aCB(null, resultDict);
		}
	], function(err, results) {
		//load everything in result dictionary
		resultDict = {};
		for(i in results) {
			result = results[i];
			for (key in result) {
				resultDict[key] = result[key];
			}
		}
		console.log("objective heuristics: %j", resultDict);
		callback(null, resultDict);
	});

}


// Calculate subjective heuristics: the syllable cadence, the etymology ratio,
// the part of speech flow, the sentiment, and the reading time. These are all
// heuristics that carry a large degree of subjectivity; we evaluate them
// through the creation of our own models and external APIs. 
function subjectiveHeuristics(id, text, callback) {

	console.log("calculating subjective heuristics");

	async.parallel([
		// tokenize essay and calculate 1) etymology score, and 2) cadence gap
		function(aCB) {
			var openNLP = require("opennlp");
			var tokenizer = new openNLP().tokenizer;
			resultDict = {};
			tokenizer.tokenize(text, function(err, results) {
				// need some way to fetch from database 
				// get the etymology associated with the word
				// calculate prestige value
				results = pruneResults(results);
				if (results == null || results.length == 0) {
					resultDict["error"] = {"message": "Write more words! We can't process your essay like this."};
					aCB(null, resultDict);
					return;
				}
				// take a running average of all words for etymology
				// calculate syllable cadence by taking the avg of all the gaps
				var avg = 0;
				var count = 0;
				var curGap = 0;
				var avgGap = 0;
				var numGaps = 0;
				var count2 = 0;

				async.each(results, function(result, resultCB) {
					var queryWord = WordModel.findOne({'content':result});
					var queryWordCadence = WordCadenceModel.findOne({'content':result});
					async.parallel([
						// query database for etymology
						function(qCB) {
							queryWord.exec(function(err, word) {
								if (word != null) {
									var titleOrigin = word.etymology;
									if (titleOrigin != "none") {
										var prestige = prestigeOf(titleOrigin);
										avg += prestige;
									}
								}
								queryWord = null;
								qCB(null, result);
							});
						},
						// query database for cadence gap
						function(qCB) {
							queryWordCadence.exec(function(err, word) {
								if (word != null) {
									//syllable cadence
									var cadence = word.cadence; 
									if (cadence != null) {
										var index = cadence.indexOf("1");
										if (index == -1) {
											curGap += cadence.length;
										}
										else {
											curGap += index;
											numGaps++;
											avgGap += curGap;
											curGap = cadence.length - index - 1;
										}
									}
								}
								queryWordCadence = null;
								qCB(null, result);
							});
						}
					],function(err, results) {
						resultCB();
					});
				}, function(err) {
					avg /= results.length;
					if (numGaps !== 0) {
						avgGap /= numGaps;
					}
					resultDict["etymology_score"] = avg;
					resultDict["cadence_gap"] = avgGap;
					console.log("done processing etymology, cadence");
					tokenizer = null;
					results = null;
					aCB(null, resultDict);
				});
			});

		},
		// calculate sentiment using Indico's API
		function(aCB) {
			console.log("calculating sentiment");
			resultDict = {};
			indico.sentiment(text).then(function(res){
				resultDict["sentiment"] = res;
				aCB(null, resultDict);
			})
			.catch(function(err) {
				console.log("Indico error -- suppressed");
			})
		},
		//calculate POS frequencies
		function(aCB) {
			console.log("calculating POS frequencies");
			resultDict = {};
			calculatePOSFreqs(text, function(err, posPairDict, 
				posTotalFreqs, totalWords) {
				resultDict["pos_match_info"] = {};
				resultDict["pos_match_info"]["pairFreqs"] = posPairDict;
				resultDict["pos_match_info"]["totalFreqs"] = posTotalFreqs;
				posPairDict = null;
				posTotalFreqs = null;
				aCB(null, resultDict);
			}); 
		},
		// calculate reading time
		function(aCB) {
			console.log("calculating reading time");
			resultDict = {};
			var stats = readingTime(text);
			if (stats != null) {
				resultDict["reading_time"] = stats["text"];
			}
			else {
				resultDict["reading_time"] = "0 min read";
			}
			aCB(null, resultDict);
		}
	],
	function(err, results) {
		//load everything in result dictionary
		resultDict = {};
		for(i in results) {
			result = results[i];
			for (key in result) {
				resultDict[key] = result[key];
			}
		}
		callback(null, resultDict);
	});
}


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

// Function returns a mapping dictionary that maps 
// Penn Treebank POS Tags (which are what NLP libraries use for POS tagging)
// to a more limited set of POS tags that we've identified above. 
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

// Given a Penn Treebank POS tag, function identifies the corresponding mapping
// for our purposes. If the tag doesn't exist in the mapping, return null.
function identifyPOS(posTag) {
	var posMapping = getPosMapping();
	var posTags = getPosTags();
	if (posTag in posMapping) {
		return posTags[posMapping[posTag]];
	}
	return null;
}
// Helper function to calculate the frequency table for the POS match 
// callback parameters: err, posPairDict, posTotalFreqs, totalWords
function calculatePOSFreqs(text, callback) {
	// store frequencies in a hash table, mapping from one POS -> next POS
	try {
		var analysis = compendium.analyse(text);
	}
	catch (e) {
		resultDict["error"] = {"message": "Write more words! We can't process your essay like this."};
		callback(0, {}, {}, 0);
		return;
	}
	var results = [];
	for (var i in analysis) {
		var chunk = analysis[i];
		results = results.concat(chunk["tags"]);
	}
	var posPairDict = new Object(); //2-d dict
	var posTotalFreqs = new Object();

	// initialize the dictionaries
	var posTags = getPosTags();
	for(var i in posTags) {
		posPairDict[posTags[i]] = {};
		for(var j in posTags) {
			posPairDict[posTags[i]][posTags[j]] = 1;
		}
		posTotalFreqs[posTags[i]] = 1;
	}

	for(var i = results.length - 1; i >= 0; i--) {
		if (identifyPOS(results[i]) == null) {
			results.splice(i, 1);
		}
	}
	var totalWords = 0;
	for(var i = 0; i < results.length - 1; i++) {
		var pos = identifyPOS(results[i]);
		var pos2 = identifyPOS(results[i+1]);

		posPairDict[pos][pos2] += 1;
		posTotalFreqs[pos] += 1;
		totalWords++;
	}
	posTagger = null;
	results = null;
	callback(0, posPairDict, posTotalFreqs, 0);
}

// calculate POS match - DON'T USE FOR TRAINING DATA. The idea is that
// this function takes the frequency tables from both training and test data,
// and performs a chi-squared goodness of fit test.
// Returns the p-value as the POS match statistic. 
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
			chiSquaredValue += temp;
		}
		chiSquaredDict[key] = chiSquaredValue;
		finalChiSquared += (chiSquaredValue) * (posTotalFreqs[key]) / totalWords;
	}

	// 5) Now that we have the final chi-squared static, calculate the probability
	var prob = 1 - chi.cdf(finalChiSquared, Object.keys(posTotalFreqs).length * 5);
	return prob;
}

// Helper function, deformats into a 1-d array for storage in Mongo
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

// Helper function, deformats into a 1-d array for storage in Mongo
function deformatTotalFreqs(totalFreqs) {
	var posTags = getPosTags();
	var results = [];
	for(var i in posTags) {
		results.push(totalFreqs[posTags[i]]);
	}
	return results;
}

// Helper function, formats from a 1-d array into a 2-d dictionary
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
// Helper function, formats from a 1-d array into a 1-d dictionary
function formatTotalFreqs(totalFreqsArr) {
	var posTags = getPosTags();
	var results = {};
	for(var i in posTags) {
		results[posTags[i]] = totalFreqsArr[i];
	}
	return results;
}

// Exportable functions that can be called from other js files. 
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
