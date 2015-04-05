
var mongoose = require('mongoose');

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
  }
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
