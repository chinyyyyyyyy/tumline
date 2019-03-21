var createError           = require('http-errors'),
    express               = require('express'),
    path                  = require('path'), 
    cookieParser          = require('cookie-parser'),
    logger                = require('morgan'),
    indexRouter           = require('./routes/index'),
    passport              = require('passport'),
    LocalStrategy         = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    User                  = require('./routes/users');
var app = express();

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

var db = require('mongoose');
db.connect('mongodb+srv://tumline:kiki@cluster0-2as3g.mongodb.net/TumLine?retryWrites=true',{ useNewUrlParser: true });
var Chat = new db.Schema({
  User: String,
  Text: String,
});

var grouplist = new db.Schema({
  group_name: String,
  group_member: [String],
  group_chat: [{
    User: String,
    Text: String,
  }]
});

var Userdb = new db.Schema({
  username: String,
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
  req.db = db;
  req.chat = db.model('chat',Chat);
  req.userdb = db.model('users',Userdb);
  req.grouplist = db.model('grouplist',grouplist);
  next();
}); 
 
app.use(function(req,res,next){
  res.locals.currentUser = req.user;
  next();
});

app.use('/', indexRouter);
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// app.listen(3000, function(){
//   console.log('app listening on port 3000 for project 1 !');
// });

app.listen(3001, function(){
  console.log('app listening on port 3001 for project 2 !');
});

module.exports = app;
