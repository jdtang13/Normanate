
//calculate expected heuristics and insert into the database
//note: this is for training purposes
exports.setExpectedHeuristics = function(text) {
	// use process.js functions to calculate a resulting dictionary, and insert into database
}

// return expected heuristics, stored in the database,
// to the use rin a dictionary(let's assume they're hardcoded)
// "pos_distr" ==> a 2-d hash table mapping a consecutive POS pair to the expected frequency
exports.getExpectedHeuristics = function() {
	var result = new Object();
	result["pos_distr"] = new Object();
}
