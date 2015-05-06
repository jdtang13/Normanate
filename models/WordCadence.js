
var mongoose = require('mongoose');

var wordCadenceSchema = new mongoose.Schema({
  created: {
      type: Date,
      default: Date.now
  },
  content: String,
  cadence: String,

});

// Duplicate the ID field.
wordCadenceSchema.virtual('id').get(function(){
    return this._id.toHexString();
});


// Ensure virtual fields are serialised.
wordCadenceSchema.set('toJSON', {
    virtuals: true
});


module.exports = mongoose.model('WordCadence', wordCadenceSchema);