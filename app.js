//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from 'bcrypt';


const saltRounds = 10;

const app = express();


app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:false}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

const User = new mongoose.model("User",userSchema);


app.get("/",(req,res)=>{
    res.render("home.ejs")
});
app.get("/register",(req,res)=>{
    res.render("register.ejs");
})
app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        console.log(hash);
        const userdata = new User({
            email:req.body.username,
            password:hash
        });
        userdata.save().then(val=>{
            res.render("secrets.ejs");
        });
    });    
    
});

app.post("/login",async(req,res)=>{
    const email = req.body.username
    const password = req.body.password;
    const founduser = await User.findOne({ email: email}).exec();
    if(founduser){
        bcrypt.compare(password, founduser.password, function(err, result) {
            if(result==true){
                res.render("secrets.ejs");
            }else{
                res.json({message:"wrong credential"})
            }
        });
    }else{
        console.log("not found");
    }
})

app.listen(process.env.PORT, (req,res)=>{
    console.log(`port is running on ${process.env.PORT}`);
})