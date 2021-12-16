const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
    .post('/api/threads/testThread')
    .send({text: "My test", delete_password: 'delete'})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
    .get('/api/threads/testThread')
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
    chai.request(server)
    .delete('/api/threads/testThread')
    .send({thread_id: "61bacb32dca83cbd6afab712", delete_password: 'delete'})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
    chai.request(server)
    .delete('/api/threads/testThread')
    .send({thread_id: "61bacb32dca83cbd6afab712", delete_password: '1234'})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
    .put('/api/threads/fgh')
    .send({thread_id: "61bacc09f7682d25cdcd417c"})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
    .post('/api/replies/fgh')
    .send({text: "My test", delete_password: 'delete', thread_id:"61bacc09f7682d25cdcd417c"})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
    .get('/api/replies/fgh?thread_id=61bacfd115fb17da220431f6')
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
    chai.request(server)
    .delete('/api/replies/fgh')
    .send({reply_id:"61baddd310d96f980df36032", thread_id: "61bacfd115fb17da220431f6", delete_password: 'delfsete'})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
    chai.request(server)
    .delete('/api/replies/fgh')
    .send({reply_id:"61badddd10d96f980df36054", thread_id: "61bacfd115fb17da220431f6", delete_password: '1234'})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
    .put('/api/threads/fgh')
    .send({reply_id:"61baddd310d96f980df36032", thread_id: "61bacfd115fb17da220431f6"})
    .end(function(err, res){
      assert.equal(res.status, 200);
    });
  });
});
