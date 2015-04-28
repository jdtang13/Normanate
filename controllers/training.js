
//calculate expected heuristics and insert into the database
//note: this is for training purposes
exports.setExpectedHeuristics = function(text) {
	// use process.js functions to calculate a resulting dictionary, and insert into database
	
}

// return expected heuristics, stored in the database,
// in the form of a dictionary(let's assume they're hardcoded)
// "pos_distr" ==> a 2-d hash table mapping a consecutive POS pair to the expected frequency
// return all expected data (the "means" of the heuristics) in the form of:
// 	etymology_score: 
//	sentence_var:
// 	linking_verbs:
//	pos_match_info:
// 		pairFreqs: (2-d table)
// 		totalFreqs (1-d table)
// also return the corresponding variances of every heuristics BUT the 
// pos_match_info in a variance object.
// Therefore callback will have two parameters (meanDict, varDict).
exports.getExpectedHeuristics = function(callback) {
	var result = new Object();
	result["pos_distr"] = new Object();
}
