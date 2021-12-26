//jshint esversion:6
require("dotenv").config()
const bodyParser = require("body-parser")
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const { config } = require("dotenv")
const bcrypt = require("bcrypt")
const saltRounds = 10

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema( {
    email:String,
    password:String
})




const User = mongoose.model("User",userSchema)

const app = express()

app.use(express.static("public"));
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended:true}))

app.get("/",function(req,res){
    res.render("home")
})
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email:req.body.username,
            password:hash
        })
        newUser.save(function(err){
            if(err){
                console.log(err)
            }else{
                res.render("secrets")
            }
        })
    });
    
    
})

//Simple Login Check - L1
app.post("/login",function(req,res){
    const username = req.body.username
    const password = req.body.password

    User.findOne({email:username},function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result == true){
                        res.render("secrets")
                    }
                });   
            }
        }
    })
})



app.listen(3000,function(){
    console.log("Server is running on port 3000!!!")
})