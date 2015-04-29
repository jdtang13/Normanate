var gaussian = require('gaussian');

// given a sample dataset, calculate the variance
exports.calculateVariance = function(arr) {
	var mean = 0;
	for(var i in arr) {
		mean += arr[i];
	}
	mean /= arr.length;

	var result = 0;
	for(var i in arr) {
	    var temp = (arr[i] - mean) * (arr[i] - mean);
	    temp /= mean;
	    result += temp;
	}
	return result;
}

// helper function calculate P value given a sample, mean, and variance
exports.calculatePValue = function(sample, mean, variance) {
    var distr = gaussian(mean, variance);
    var result = 0;
    if (sample < mean) {
        result = 2 * distr.cdf(sample);
    }
    else if (sample > mean) {
        result = 2 * (1 - distr.cdf(sample));
    }
    return result;
}