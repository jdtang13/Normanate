
var mongoose = require('mongoose');

//  heuristics subdocument

// var wordSchema = require('mongoose').model('Word');

///  the central master data that the training data feeds into
var masterObjectiveSchema = new mongoose.Schema( 
{

  //  ALL OF THESE ARE AVERAGES

    //overused_words: [wordSchema],
    overused_words_num: Number,
    sentence_mean: Number,
    sentence_var: Number,
    sentence_num: Number,

    adj_ratio: Number,
    adv_ratio: Number,
    noun_ratio: Number,
    verb_ratio: Number,

    goodness_of_fit: Number
});

// Ensure virtual fields are serialised.
masterObjectiveSchema.set('toJSON', {
    virtuals: true
});

//  CURRENT as of 4/21 -- please update this if things change
// basic structure of a result object. This should apply to both objective and subjective heuristics.
  // {
  //  id:
  //  num_words:
  //  num_chars:
  //  overused_words:
  //    word:
  //  sentence_info:
  //    mean:
  //    var:
  //    num:
  //  pos_info:
  //    adj_count:
  //    adv_count:
  //    noun_count:
  //    verb_count:
  //    goodness_of_fit: (subjective)
  // }

var objectiveHeuristicSchema = new mongoose.Schema( 
{

    //is_master: { type: Boolean, required: true, default: false}, //  is this the master set derived from training data?

    num_words: Number,
    num_chars: Number,
    //overused_words: [wordSchema],
    overused_words: [String],

    sentence_mean: Number,
    sentence_var: Number,
    sentence_num: Number,

    adj_count: Number,
    adv_count: Number,
    noun_count: Number,
    verb_count: Number,
    
    goodness_of_fit: Number
});

// Ensure virtual fields are serialised.
objectiveHeuristicSchema.set('toJSON', {
    virtuals: true
});

// TODO -- remove heuristicSchema if it's unnecessary
var heuristicSchema = new mongoose.Schema( 
{
    values: [Number] //  values associated with particular words
});

// Ensure virtual fields are serialised.
heuristicSchema.set('toJSON', {
    virtuals: true
});

var essaySchema = new mongoose.Schema({
  created: {
      type: Date,
      default: Date.now
  },
  modified: {
      type: Date,
      default: Date.now
  },
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },

  objectives: [objectiveHeuristicSchema], /// objective heuristics

  //  use the subdocument
  //  allow for multiple heuristic schema -- perhaps heuristics[0] is a certain heuristic, heuristics[1], etc.?
  heuristics: [heuristicSchema],

  miscValues: [Number] //  use this for random values that you want to use as output

});

// Duplicate the ID field.
essaySchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
essaySchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('MasterObjectiveHeuristic', masterObjectiveSchema);
module.exports = mongoose.model('ObjectiveHeuristic', objectiveHeuristicSchema);
module.exports = mongoose.model('Heuristic', heuristicSchema);
module.exports = mongoose.model('Essay', essaySchema);
