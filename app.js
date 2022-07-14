
require('dotenv').config();
// var encrypt = require("mongoose-encryption");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const {body, checkSchema, validationResult} = require("express-validator");



let alert = require('alert');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret : "Our little secret.",
  resave : false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB");

// registeration schema is for express validator.
const registrationSchema = {
  password: {
       isStrongPassword: {
           minLength: 8,
           minLowercase: 1,
           minUppercase: 1,
           minNumbers: 1
       },
       errorMessage: "Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, and one number",
   }
}
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
       type: String

   }
});
userSchema.plugin(passportLocalMongoose);


// only  encrypting certain fields (Level-2 Security)
// userSchema.plugin(encrypt, { secret:process.env.SECRET ,encryptedFields:["password"]});


const User = new mongoose.model("User",userSchema);

const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("home");
})

app.get("/login",function(req,res){
  res.render("login");
})

app.get("/register",function(req,res){
  res.render("register");
})
app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
})
app.get("/logout",function(req,res,next){
  req.logout(function(err) {
     if (err) { return next(err); }
       res.redirect("/login");
   });

})


app.post("/register", checkSchema(registrationSchema),function(req,res){
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       alert("Password must be greater than 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.");
       res.redirect("/register");
   }else{
     const user = new User({
       username : req.body.username,
       email:req.body.email
     });
     User.register(user,req.body.password,function(err,user){
       if(err){

         alert("A user with given username or Email already exist");
         res.redirect("/register");
       }else{

         passport.authenticate("local")(req,res,function(){
                   res.redirect("/secrets");
         })

       }
     })
   }                  // comes from passportLocalMongoose
});


app.post("/login", function(req,res){

  if(!req.body.username){
           alert( "Username was not given");
          res.redirect("/login");
  }else{
    if(!req.body.password){
           alert( "Password was not given");
           res.redirect("/login");
        }
        else{
        passport.authenticate("local", (err, user, info) => {
        if (err) throw err;
        if (!user) {

         alert("The username and/or password you specified are not correct.")
         res.redirect("/login");
        }
       else {
       req.logIn(user, (err) => {
       if (err) console.log(err);
       res.redirect("/secrets");
  });
}
})(req, res);

    }
      }
    });


app.listen(process.env.PORT||3000, function() {
  console.log("Server started on port 3000");
});
