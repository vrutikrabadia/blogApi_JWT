require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Configuring the express app
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());


// Configuring MongoDb via mongoose
const db = mongoose.connect('mongodb://localhost:27017/blogApi', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    desc: String,
    content: String,
    author: {
        type: String,
        required: true
    },
});

const User = new mongoose.model('User', userSchema);
const Blog = new mongoose.model('Blog', blogSchema);

// Function to authenticate the recieved tokens in header
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } 
    else {
        res.sendStatus(401);
    }
};


app.post("/register",function(req,res){
    let username = req.body.username;
    let password = req.body.password;
    let confirm = req.body.confirm;

    if(password===confirm){
        User.findOne({username: username},function(err,found){
            if(!found){

                let hash_out = bcrypt.hashSync(password, 10);
                const user = new User({
                    username: username,
                    password: hash_out
                })
                user.save(function(err){
                    if(err){
                        console.log(err);
                        res.send("Error! Please try again");
                    }
                    else{
                        res.send("User sucessfully reistered!");
                    }
                })
            }
            else{
                res.send("Username already taken");
            }
            if(err){
                console.log(err);
                res.send("Error! Please try again");
            }
        })
        
    }   
    else{
        res.send("Error: confirmation does not matches the password");
    }
});


app.post("/login",function(req,res){
    let username = req.body.username;
    let password = req.body.password;

    User.findOne({username: username}, function(err,found){
        if(!found){
            res.send("User not found");
        }
        if(err){
            console.log(err);
            res.send("Error! Please try again");
        }
        if(found){
            if(bcrypt.compareSync(password, found.password)){
                const accessToken = jwt.sign({ username: found.username }, process.env.SECRET,{expiresIn: '3000000000'});

                res.json({
                    accessToken
                });
            }

            else{
                res.send("Incorrect password");
            }
        }
    })
});


app.get("/deleteUser",authenticateJWT, function(req,res){
    User.remove({username: req.user.username}, 
        {justOne: true}, 
        function(err){
            if(err){
                console.log(err);
                res.send("Error! Please try again");
            }
            else{
                res.send("User deleted sucessfully");
            }
    });
});


app.get("/listBlogs", authenticateJWT, function(req,res){
    Blog.find({}, function(err,found){
        if(err){
            console.log(err);
            res.send("Error! Please try again");
        }
        else{
            res.json(found);
        }
    })
});


app.post("/createBlog",authenticateJWT, function(req,res){
    let title = req.body.title;
    let desc = req.body.desc;
    let content = req.body.content;
    
    const blog = new Blog({
        title: title,
        desc: desc,
        content: content,
        author: req.user.username,
    });

    blog.save(function(err){
        if(err){
            res.send("Error! Please try again"); 
        }
        else{
            res.send("Blog Sucesfully saved");
        }
    })
});


app.post("/deleteBlog",authenticateJWT, function(req,res){
    let title = req.body.title;

    Blog.findOneAndDelete({title: title, author: req.user.username}, 
        {justOne: true}, 
        function(err, found){
            if(err){
                console.log(err);
                res.send("Error! Please try again");
            }
            if(!found){
                res.send("No such blog is created by you!");
            }
            else{
                res.send("Blog deleted sucessfully");
            }
    });
});


app.post("/updateBlog",authenticateJWT, function(req,res){
    let title = req.body.title;
    let desc = req.body.desc;
    let content = req.body.content;

    Blog.findOneAndUpdate({title: title, author: req.user.username}, 
        {title: title, desc: desc, content: content, author: req.user.username},
        function(err,found){
            if(err){
                console.log(err);
                res.send("Error! Please try again");
            }
            if(!found){
                res.send("No such blog is created by you!");
            }
            else{
                res.send("blog sucessfully updated!");
            }
    });
});


app.post("/findWithTitle", authenticateJWT, function(req,res){
    let title=req.body.title;

    Blog.find({title: title},function(err, found){
        if(err){
            console.log(err);
            res.send("Error! Please try again");
        }
        if(found.length ==0){
            res.send("No such Blog exists!")
        }
        else{
            res.json(found);
        }
    })
});


app.listen(3000, function(){
    console.log('server started on port 3000');
});


//exporting app for unit tests
module.exports = app;