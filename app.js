//jshint esversion:6
require("dotenv").config()
const bodyParser = require("body-parser")
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
const findOrCreate = require("mongoose-findorcreate")

const app = express()
app.use(express.static("public"));
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended:true}))
// Set up session package
app.use(session({
    secret:"ourlittlesecret",
    resave:false,
    saveUninitialized:false
}))
//Initialise passport
app.use(passport.initialize())
//Use passport to manage sessions
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB")
const userSchema = new mongoose.Schema( {
    email:String,
    password:String,
    googleId:String,
    secretf:String
})

// Hash n salt our passwords and to save our users in mongoose...it is enabling it.
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
const User = mongoose.model("User",userSchema)

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    // console.log('serializeUser: ' + user._isd)
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user){
        // console.log(user)
        if(!err) done(null, user);
        else done(err, null)  
    })
});


passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl:"https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback   : true
  },
  function(req,accessToken, refreshToken, profile, done) {
      console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));
app.get('/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get("/login",function(req,res){
    res.render("login")
})
app.get("/register",function(req,res){
    res.render("register")
})

app.get("/secrets",function(req,res){
    // if(req.isAuthenticated()){
    //     res.render("secrets")
    // }else{
    //     res.redirect("/login")
    // }
    User.find({"secretf": {$ne:null}},function(err,foundUsers){
        if(err){
            console.log(err)
        }else{
            if(foundUsers){
                res.render("secrets",{usersWithSecrets:foundUsers})
            }
        }
    })

})

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
})
app.post("/submit",function(req,res){
    submittedSecret = req.body.secret
    console.log(req.user.id)
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secretf = submittedSecret
                foundUser.save(function(){
                    res.redirect('/secrets')
                })
            }
        }
    })
})

app.get("/logout",function(req,res){
    req.logout()
    res.redirect("/")
})

app.post("/register",function(req,res){
  
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})

app.post("/login",function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})



app.listen(3000,function(){
    console.log("Server is running on port 3000!!!")
})