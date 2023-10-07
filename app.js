//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate  from 'mongoose-findorcreate';


const saltRounds = 10;

const app = express();


app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:false}));

app.use(session({
    secret:"Our little secret",
    resave:false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");


const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);


passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        // const profile_id = profile.id;
      return cb(err, user);
    });
  }
));


app.get("/",(req,res)=>{
    res.render("home.ejs")
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})
app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.get("/secrets",async(req,res)=>{
    const allsecrets = await User.find({"secret":{$ne:null}}).exec();
    res.render("secrets.ejs",{secretList:allsecrets});
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit.ejs");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit",async(req,res)=>{
    const secretToSubmit = req.body.secret;
    // console.log(req.user)
    const foundUser = await User.findById(req.user.id).exec();
    if(foundUser){
        foundUser.secret = secretToSubmit;
        foundUser.save().then(()=>{
            res.redirect("/secrets");
        })
    }
});

app.post("/register",(req,res)=>{
   User.register({username:req.body.username},req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            });
        }
   });
    
});

app.post("/login",async(req,res)=>{
    const user = new User({
        username:req.body.username,
        passport:req.body.passport
    }); 
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/logout",(req,res)=>{
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    })
})

app.listen(process.env.PORT, (req,res)=>{
    console.log(`port is running on ${process.env.PORT}`);
})