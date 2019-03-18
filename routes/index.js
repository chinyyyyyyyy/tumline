var express               = require('express'),
    router                = express.Router(),
    passport              = require('passport'),
    LocalStrategy         = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    User                  = require('./users');
/*===================================== Authentication Page ================================================ */

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
  console.log(req.user);
  var Chat = req.chat;
  var transaction = new Chat({User:req.user.username,Text:req.body.message});
  transaction.save(function (err, fluffy) {
    if (err) return console.error(err);
  });
  res.redirect('/chat');

});

router.get('/logout',function(req,res){
  req.logout();
  res.redirect('login');
});


router.get('/chat',function(req,res){
  var Chat = req.chat;
  Chat.find({}, function (e, docs) {
    res.render('chat', { "chatlog": docs });
  });
});

module.exports = router;
