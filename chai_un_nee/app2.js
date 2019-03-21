var express               = require('express'),
    path                  = require('path'), 
    passport              = require('passport'),
    LocalStrategy         = require('passport-local'),
    bodyParser = require('body-parser'),
    User                  = require('./users');
var app = express();
var port = 3001;

/*================================ Session =====================================*/
app.use(require('express-session')({
    secret: "Hi",
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

/*================================ Database ===================================*/ 
var db = require('mongoose');
db.connect('mongodb+srv://tumline:kiki@cluster0-2as3g.mongodb.net/TumLine?retryWrites=true',{ useNewUrlParser: true });
var ChatSchema = new db.Schema({
    User: String,
    Text: String,
  });
var Chat = db.model('chats',ChatSchema)
  
var grouplistSchema = new db.Schema({
    group_name: String,
    group_member: [String],
    group_chat: [{
      User: String,
      Text: String,
    }]
});
var grouplist = db.model('grouplist',grouplistSchema)

/*================================ app set ===================================*/ 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); 
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

/*================================ Routing ===================================*/ 


//Authenticate
app.get('/socket', function(req, res) {
    Chat.find({},function(err,docs){
        console.log(docs);
        res.render('index',{'inichat':docs});
    });
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
      return next();
    } else {
      res.redirect("/login");
    }
}
  
app.get(['/','login'],function(req,res,next){
    res.render('login');
});

app.post('/login',passport.authenticate("local",{
    successRedirect: "/chatroom/home",
    failureRedirect: "/login"
}),function(req,res,next){
});

app.get('/register',function(req,res,next){
    res.render('register');
});

app.post('/regis',function(req,res){
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

app.post('/sendMessage',function(req,res){
    var transaction = new Chat({User:req.user.username,Text:req.body.message});
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

app.get('/logout',function(req,res){
    req.logout();
    res.redirect('login');
});

/*===================================== Chat ================================================ */

app.post('/addgroup',function(req,res){
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
    res.redirect('/chatroom/home');
});

app.post('/join',function(req,res){
    grouplist.findOne({ group_name:req.body.findgroupname}, function (e, docs) {
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
    res.redirect('/chatroom/home');
});

app.get('/chatroom/:id',isLoggedIn,function(req,res){
    grouplist.find({ group_member:req.user.username}, function (e, docs) {
        if (req.params.id=="home"){
            res.render('chat',{"roomlist":docs});
        } else {
            for(var i in docs){
                if(docs[i]._id == req.params.id){
                var thischat = docs[i];
                console.log(thischat);
                }
            }
            res.render('chatroom',{"roomlist":docs,"thischat":thischat});
        }
    });
})

app.post('/destroy',function(req,res){
    grouplist.findOneAndDelete({_id:req.body.chatroomid},function (err,docs){
        if (!err) {
        console.log('notification!');
        }
        else {
        console.log(err);
        }
    res.redirect('/chatroom/home');
    });
});

app.post('/leaves',function(req,res){
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
    res.redirect('/chatroom/home');
});

/*================================ SOCKET.IO ===================================*/ 
var server = app.listen(port, function() {
    console.log('Listening on port: ' + port);
});
var io = require('socket.io').listen(server);

io.on('connection', function(socket) {
    socket.on('chat', function(data) {
        var name = data.username;
        var message = data.message;
        var transaction = new Chat({User: name, Text: message});
        transaction.save(function(){
            io.emit('chat',data);
        });
    });
});

