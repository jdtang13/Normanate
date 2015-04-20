
var mongoose = require('mongoose');

//  heuristics subdocument
// http://mongoosejs.com/docs/subdocs.html
var heuristicSchema = new mongoose.Schema( 
{
    words: [String],
    ratings: [Number]
} 
);

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
  //  should i use brackets? i'm thinking i don't need an array here
  //  error:  Did you try nesting Schemas? You can only nest using refs or arrays.
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


module.exports = mongoose.model('Essay', essaySchema);
