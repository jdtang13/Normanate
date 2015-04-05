var request = require('supertest');
var app = require('../app.js');
var chai = require('chai');
var should = chai.should();
var User = require('../models/User');
var Essay = require('../models/Essay');

var cheerio = require('cheerio');

var agent = request.agent(app);

var user;
var essay;

function extractCsrfToken (res) {
    var $ = cheerio.load(res.text);
    var meta = $('meta')
    var meta = $('meta')
    var keys = Object.keys(meta)

    var csrfToken;

    keys.forEach(function(key){
      if (  meta[key].attribs
         && meta[key].attribs.name
         && meta[key].attribs.name === 'csrf-token') {
        csrfToken = meta[key].attribs.content;
      }
    });

    return csrfToken;
}

function loginUser() {
    return function(done) {
        
        function onResponse(err, res) {
            if (err){
                return done(err);
            }
            return done();
        }

        agent
            .get('/login')
            .end(function(err, res){
              var csrf = extractCsrfToken(res);
              agent
                .post('/login')
                .send({ email: 'test@test.com', password: 'password', _csrf: csrf })
                .expect(302)
                .expect('Location', '/')
                .end(onResponse);
            });
    };
}

describe('Users API: Not Authenticated:', function() {
    beforeEach(function(done) {
        user = new User({
            email: 'test@test.com',
            password: 'password'
        });


        user.save(function() {
            done();
        });

    });

    describe('Essays API', function(){
        it ('should be able to post an essay', function(done){
          agent
            .get('/')
            .end(function(err, res){
              var csrf = extractCsrfToken(res);
              console.log(csrf);
                  
              agent
                .post('/essays')
                .send({ title: 'Test', content: 'Lorem ipsum', _csrf: csrf })
                .expect(200, done);
            });
          
        });

    });


    describe('Users API', function(){
        it ('should not have a session to begin with', function(done){
            agent
                .get('/account')
                .expect('Location', '/login')
                .expect(302, done);
        });

        it('should login', loginUser());

    });


    afterEach(function(done) {
        user.remove();
        done();
    });

    after(function(done) {
        User.remove().exec();
        done();
    });
});
