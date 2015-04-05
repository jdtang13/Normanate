var chai = require('chai');
var should = chai.should();
var User = require('../models/User');
var Essay = require('../models/Essay');

describe('User Model', function() {
  it('should create a new user', function(done) {
    var user = new User({
      email: 'test@gmail.com',
      password: 'password'
    });
    user.save(function(err) {
      if (err) return done(err);
      done();
    })
  });

  it('should not create a user with the unique email', function(done) {
    var user = new User({
      email: 'test@gmail.com',
      password: 'password'
    });
    user.save(function(err) {
      if (err) err.code.should.equal(11000);
      done();
    });
  });

  it('should find user by email', function(done) {
    User.findOne({ email: 'test@gmail.com' }, function(err, user) {
      if (err) return done(err);
      user.email.should.equal('test@gmail.com');
      done();
    });
  });

  it('should delete a user', function(done) {
    User.remove({ email: 'test@gmail.com' }, function(err) {
      if (err) return done(err);
      done();
    });
  });
});

describe('Essay Model', function() {
  it('should create a new essay', function(done) {
    var essay = new Essay({
      title: 'Test',
      content: 'The quick brown fox jumps over the lazy dog.'
    });
    essay.save(function(err) {
      if (err) return done(err);
      done();
    })
  });

  it('should delete an essay', function(done) {
    Essay.remove({ title: 'Test' }, function(err) {
      if (err) return done(err);
      done();
    });
  });
});
