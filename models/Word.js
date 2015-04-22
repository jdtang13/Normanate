
var mongoose = require('mongoose');

var wordSchema = new mongoose.Schema({
  created: {
      type: Date,
      default: Date.now
  },
  content: String,
  etymologies: [String]

});

// Duplicate the ID field.
wordSchema.virtual('id').get(function(){
    return this._id.toHexString();
});


// Ensure virtual fields are serialised.
wordSchema.set('toJSON', {
    virtuals: true
});


module.exports = mongoose.model('Word', wordSchema);
