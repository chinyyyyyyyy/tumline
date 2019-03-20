var express               = require('express'),
    router                = express.Router(),
    passport              = require('passport'),
    LocalStrategy         = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    User                  = require('./users');

/*===================================== Authentication Page ================================================ */

router.get('/',function(req,res,next){
  res.render('login');
});

router.get('/login',function(req,res,next){
  res.render('login');
});

router.post('/login',passport.authenticate("local",{
      successRedirect: "/chat",
      failureRedirect: "/login"
}),function(req,res,next){
});

router.get('/register',function(req,res,next){
  res.render('register');
});
router.post('/regis',function(req,res){
  User.register(new User({username: req.body.username}), req.body.password, function(err,user){
    if(err){
        console.log(err);
        return res.redirect('/register');
    }
    passport.authenticate("local")(req,res,function(){
        res.redirect('/login');
    });
  });
});

router.post('/sendMessage',function(req,res){
  var grouplist = req.grouplist;
  var chatlog = req.chat;
  var transaction = new chatlog({User:req.user.username,Text:req.body.message});
  console.log(transaction)
  grouplist.findOneAndUpdate(
    { _id:req.body.chatroomid}, 
    { $push: { group_chat: transaction } },
   function (error, success) {
         if (error) {
             console.log(error);
         } else {
             console.log(success);
         }
    });
  res.redirect('/chatroom/'+req.body.chatroomid);

});

router.get('/logout',function(req,res){
  req.logout();
  res.redirect('login');
});

/*===================================== Chat ================================================ */
router.get('/chat',function(req,res){
  var grouplist = req.grouplist;
  grouplist.find({ group_member:req.user.username}, function (e, docs) {
    res.render('chat',{"roomlist":docs});
  });
});

router.post('/addgroup',function(req,res){
  var grouplist = req.grouplist;
  grouplist.findOne({group_name:req.body.groupname}, function (e,docs){
    if(docs != null){
      console.log('Groupname is already used');
    } else if (req.body.groupname==''){
      console.log('Blank Input');
    } else {
      console.log('Creating Group');
      var newgroup = new grouplist({
        group_name: req.body.groupname,
        group_member: [req.user.username],
        group_chat: {}
      });
      newgroup.save(function (err) {
        if (err) return console.error(err);
      });
    }
  });
  res.redirect('/chat');
});

router.post('/join',function(req,res){
  var grouplist = req.grouplist;
  grouplist.findOne({ group_name:req.body.findgroupname}, function (e, docs) {
    console.log(docs.group_member.includes(req.user.username));
    if(docs == null){
      console.log('no group available');
    }else if (!(docs.group_member.includes(req.user.username))) {
      grouplist.findOneAndUpdate(
        { group_name:req.body.findgroupname }, 
        { $push: { group_member: req.user.username  } },
       function (error, success) {
             if (error) {
                 console.log(error);
             } else {
                 console.log(success);
             }
        });
    }
  });
  res.redirect('/chat');
});

router.get('/chatroom/:id',function(req,res){
  var grouplist = req.grouplist;
  grouplist.find({ group_member:req.user.username}, function (e, docs) {
    for(var i in docs){
      if(docs[i]._id == req.params.id){
        var thischat = docs[i];
        console.log(thischat);
      }
    }
    res.render('chatroom',{"roomlist":docs,"thischat":thischat});
  });
})

router.post('/destroy',function(req,res){
  var grouplsit = req.grouplist;
  grouplsit.findOneAndDelete({_id:req.body.chatroomid},function (err,docs){
    if (!err) {
      console.log('notification!');
    }
    else {
      console.log(err);
    }
  res.redirect('/chat');
  });
});

router.post('/leaves',function(req,res){
  var grouplist = req.grouplist;
  grouplist.findOneAndUpdate(
    { _id:req.body.chatroomid }, 
    { $pull: { group_member: req.user.username  } },
   function (error, success) {
         if (error) {
             console.log(error);
         } else {
             console.log("success");
         }
    });
  res.redirect('/chat');
});

module.exports = router;
