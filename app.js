//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
const port = 3000;

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:false}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = {
    email:String,
    password:String
}

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
    const userdata = new User({
        email:req.body.username,
        password:req.body.password
    });
    userdata.save().then(val=>{
        res.render("secrets.ejs");
    })
});

app.post("/login",async(req,res)=>{
    const email = req.body.username
    const password = req.body.password;
    const founduser = await User.findOne({ email: email}).exec();
    console.log(founduser);
    if(founduser){
        if(founduser.password===password){
            res.render("secrets.ejs");
        }else{
            res.json({message:"wrong credential"})
        }
    }else{
        console.log("not found");
    }
})

app.listen(port, (req,res)=>{
    console.log(`port is running on ${port}`);
})