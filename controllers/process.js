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

/* Wordnik: http://videlais.com/2015/03/25/starting-with-the-wordnik-api-in-node-js/ */
/* API Key: 8f7a98ece2c502050b0070ea7420d05f07b7e17ec1aca1b27 */

exports.getWordnik = function(word) {

}

/*

exports.getEtymologyOrg = function(word) {
 	var url = 'http://www.etymonline.com/index.php?search=';
 	var full_url = url.concat(word);

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html

    request(url, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request

        if(!error){
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            //var $ = cheerio.load(html);

            // Finally, we'll define the variables we're going to capture

            //var title, release, rating;
            //var json = { title : "", release : "", rating : ""};
        }
    })
}/*/

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