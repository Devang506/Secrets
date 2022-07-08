
require('dotenv').config();
var encrypt = require("mongoose-encryption");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");


let alert = require('alert');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email : String,
  password: String
});


// only  encrypting certain fields
userSchema.plugin(encrypt, { secret:process.env.SECRET ,encryptedFields:["password"]});


const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
})

app.get("/login",function(req,res){
  res.render("login");
})

app.get("/register",function(req,res){
  res.render("register");
})

app.post("/register", function(req,res){
  const username = req.body.username;
  const password = req.body.password;
  const newUser = new User({
    email : username,
    password : password
  })
  User.findOne({email:username}, function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
         alert("username already exist!");
         res.redirect("/register");
      }else{
        newUser.save(function(err){
          if(!err){
            res.render("secrets");
          }else{
            console.log(err);
          }
        });
      }
    }
  })


})
app.post("/login", function(req,res){
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({email:username}, function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        if(foundUser.password===password){
          res.render("secrets");
        }
        else{
          alert("The password you enterd is not correct !");
          res.redirect("/login");
        }
      }else{
        alert("User does not exist !");
        res.redirect("/login");
      }
    }
  })
})







app.listen(process.env.PORT||3000, function() {
  console.log("Server started on port 3000");
});
