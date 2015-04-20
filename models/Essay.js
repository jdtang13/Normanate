
var mongoose = require('mongoose');

//  heuristics subdocument
// http://mongoosejs.com/docs/subdocs.html
var heuristicSchema = new mongoose.Schema( 
{
    values: [Number] //  values associated with particular words
} 
);
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

  //  use the subdocument
  //  allow for multiple heuristic schema -- perhaps heuristics[0] is a certain heuristic, heuristics[1], etc.?
  heuristics: [heuristicSchema]

});

// Duplicate the ID field.
essaySchema.virtual('id').get(function(){
    return this._id.toHexString();
});


// Ensure virtual fields are serialised.
essaySchema.set('toJSON', {
    virtuals: true
});


module.exports = mongoose.model('Heuristic', heuristicSchema);
module.exports = mongoose.model('Essay', essaySchema);
