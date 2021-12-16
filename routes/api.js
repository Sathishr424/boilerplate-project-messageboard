'use strict';

const mongoose = require('mongoose');
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true});

const replySchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  reported: Boolean,
  delete_password: String,
});

const threadSchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [replySchema],
  replycount: Number
});

const boardSchema = new mongoose.Schema({
  board: String,
  threads: [threadSchema],
});

let Board = new mongoose.model("Board", boardSchema);

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get(function(req,res){
    var board = req.params.board;
    Board.findOne({board:board}, (err,data)=>{
      if (err) {console.log('No board found'); res.send("No board found");}
      else if(data){
        console.log(data);
        data.threads = data.threads.sort((a,b)=>{
          if (a.bumped_on.getTime() > b.bumped_on.getTime()) return 1;
          else if (a.bumped_on.getTime() < b.bumped_on.getTime()) return -1;
          else return 0;
        });
        data.threads = data.threads.splice(0,10);
        var ret = [];
        // console.log(data);
        for (var i in data.threads){
          data.threads[i].replies  = data.threads[i].replies.sort((a,b)=>{
              if (a.created_on.getTime() > b.created_on.getTime()) return 1;
              else if (a.created_on.getTime() < b.created_on.getTime()) return -1;
              else return 0;
          }).splice(0,3);
        }
        for (var i=0; i<data.threads.length; i++){
          ret.push({
            _id: data.threads[i]._id,
            text: data.threads[i].text,
            created_on: data.threads[i].created_on,
            bumped_on: data.threads[i].bumped_on,
            replies: data.threads[i].replies,
            replycount: data.threads[i].replycount
          });
        }res.send(ret);
      }else res.send("ERROR");
    });
  })
  .post(function(req,res){
    var board = req.params.board;
    var text = req.body.text;
    var pass = req.body.delete_password;
    console.log(board, text, pass);
    Board.findOne({board:board}, (err,data)=>{
      if (data){
        data.threads.push({
          text: text,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          delete_password: pass,
          replies: [],
          replycount: 0
        });
        data.markModified('threads');
        data.save((e,d)=>{
          if (e) console.log("Failed to save thread in board " + board);
          else {console.log("Saved"); res.redirect("/b/" + board + "/")};
        });
      }else{
        Board.create({board: board, threads: [{
          text: text,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          delete_password: pass,
          replies: [],
          replycount: 0
        }]}, (e,d)=>{
          if (e) console.log("Failed to create board " + board);
          else res.redirect("/b/" + board + "/");
        });
      }
    })
  })
  .delete(function(req,res){
    var board = req.params.board;
    var id = req.body.thread_id;
    var pass = req.body.delete_password;
    Board.findOne({board:board}, (err,data)=>{
      if (err) {console.log("No board found!")}
      else{
        var found = false;
        for (var i in data.threads){
          if (data.threads[i]._id == id){
            if (data.threads[i].delete_password == pass){
              data.threads.splice(i,1);
              found = true;
            }
            break;
          }
        }if (found){
          data.save((e,d)=>{
              if (e) console.log("Enable to delete");
              else {res.send("success")}
          });
        }else {res.send('incorrect password');}
      }
    });
  })
  .put(function(req,res){
    var board = req.params.board;
    var id = req.body.thread_id;
    Board.findOne({board:board}, (err,data)=>{
      if (err) {console.log("No board found!")}
      else{
        for (var i in data.threads){
          if (data.threads[i]._id == id){
            found = true;
            data.threads[i].reported = true;
            break;
          }
        }if (found) res.send('success');
        else res.send('No thread found on the board ' + board);
      }
    });
  });

  app.route('/api/replies/:board')
  .get(function(req,res){
    var board = req.params.board;
    var id = req.query.thread_id;
    Board.findOne({board:board}, (err,data)=>{
      if (err) {console.log("No board found!")}
      else{
        var found = false;
        for (var i in data.threads){
          if (data.threads[i]._id == id){
            found = true;
            res.send({
              _id: data.threads[i]._id,
              text: data.threads[i].text,
              created_on: data.threads[i].created_on,
              bumped_on: data.threads[i].bumped_on,
              replies: data.threads[i].replies,
              replycount: data.threads[i].replycount
            });break;
          }
        }if (!found) res.send("No thread found on the board " + board);
      }
    });
  })
  .post(function(req,res){
    var board = req.params.board;
    var text = req.body.text;
    var pass = req.body.delete_password;
    var id = req.body.thread_id;
    Board.findOne({board:board}, (err,data)=>{
      if (err) {console.log("No board found!")}
      else{
        var found = false;
        for (var i in data.threads){
          if (data.threads[i]._id == id){
            found = true;
            data.threads[i].bumped_on = new Date();
            data.threads[i].replies.push({
              text: text,
              created_on: new Date(),
              reported: false,
              delete_password: pass
            });
            data.threads[i].replycount += 1;
            data.markModified('threads');
            break;
          }
        }if (found) {
          data.save((e,d)=>{
            if (e) res.send("Failed to save reply on the board " + board);
            else res.redirect("/b/" + board + "/" + id);
          });
        }else res.send('No thread found on the board ' + board);
      }
    });
  })
  .delete(function(req,res){
    var board = req.params.board;
    var thread_id = req.body.thread_id;
    var reply_id = req.body.reply_id;
    var pass = req.body.delete_password;
    Board.findOne({board:board}, (err,data)=>{
      if (err) {console.log("No board found!")}
      else{
        var found = [false,false];
        for (var i in data.threads){
          if (data.threads[i]._id == thread_id){
            found[0] = true;
            for (var j in data.threads[i].replies){
              if (data.threads[i].replies[j]._id == reply_id && data.threads[i].replies[j].delete_password == pass){
                found[1] = true;
                data.threads[i].replies[j].text = "[deleted]";
                break;
              }
            }break;
          }
        }if (found[0] && found[1]){
          data.markModified('threads');
          data.save((e,d)=>{
            if (e) res.send("Unable to delete reply.")
            else res.send('success');
          });
        }else res.send("incorrect password");
      }
    });
  })
  .put(function(req,res){
    var board = req.params.board;
    var thread_id = req.body.thread_id;
    var reply_id = req.body.reply_id;
    Board.findOne({board:board}, (err,data)=>{
      if (err) {console.log("No board found!")}
      else{
        var found = [false,false];
        for (var i in data.threads){
          if (data.threads[i]._id == thread_id){
            found[0] = true;
            for (var j in data.threads[i].replies){
              if (data.threads[i].replies[j]._id == reply_id){
                found[1] = true;
                data.threads[i].replies[j].reported = true;
                break;
              }
            }break;
          }
        }if (found[0] && found[1]){
          data.markModified('threads');
          data.save((e,d)=>{
            if (e) res.send("Unable to report reply.")
            else res.send('success');
          });
        }else res.send("no reply found for given ids");
      }
    });
  });
};
