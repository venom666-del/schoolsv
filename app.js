// requirements
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const storyData = require('./data.json');
app.use(cookieParser());

// serve the web with files from '/public'
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '/public')))

// change the engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// connecting mongoose to mongoDB server
mongoose.connect("mongodb://localhost:27017/storyVibeDB", {useNewUrlParser: true, useUnifiedTopology: true})

// sign-up schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: { 
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        min: 3,
        max: 10
    },
    verPassword: String,
    male: String,
    female: String,
    other: String,
    category: String
})

// model creation
const User = mongoose.model("User", userSchema)

app.get('/home/login', (req, res) => {
    res.render('login');
})


app.get('/choose', (req, res) => {
    res.render('choose')
})

app.get('/register', (req, res) => {
    res.render('register');
})


app.post('/changed', (req, res) => {
    const new_password = req.body.new_password;
    const ver_new_password = req.body.new_ver_password
    const first_Name = req.body.first_name;
    const last_Name = req.body.last_name;
    if(new_password == ver_new_password){
        User.findOneAndUpdate({firstName: first_Name, lastName: last_Name}, {password: new_password, verPassword: ver_new_password}).exec((err, user) => {
            console.log(user);
            console.log(`${first_Name} ${last_Name} has been updated his password`)
        })
    } else {
        console.log('passwords are different');
        res.redirect('/change-password')
    }
    res.redirect('/home')
})

app.post('/home/success', (req, res) => {
    // getting user data
    const firstName = req.body.firstname;
    const lastName = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;
    const Vpassword = req.body.Vpassword;
    const male = req.body.male;
    const female = req.body.female;
    const other = req.body.other;
    const favCategory = req.body.category;
    
    // inserting user data into our model
    const userData = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        verPassword: Vpassword,
        male: male,
        female: female,
        other: other,
        category: favCategory
    });
    
    // saving any other user that is not the admin
    if(password != Vpassword){
        console.log(`could'nt verify password`)
        res.redirect('/home/login');
    } else {
        userData.save().then(() => {
            // creating a cookie that holds the user's first name
            res.cookie('name', firstName);
            res.redirect('/home');
            console.log("new user saved!")
            
        });
    }
})

app.get('/log-out', (req, res) => {
    res.redirect('/choose')
    console.log('user disconnected!');
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, (err, user) => {
        if(err){
            res.redirect('/login')
        } else {
            if(user){
                if(user.password === password) {
                    console.log('user exist!');
                    res.render('home', {name: req.body.name});
                }
            }
        }
    });
});

// main route
app.get('/home', (req, res) => {
    // rendering home page with the cookie we made before
    res.render('home', {name: req.cookies.name});
})

app.get('/admin-connect', (req, res) => {
    res.render('admin-connect')
})

app.post('/admin-sec', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;

    if (username == 'admin@gmail.com' && password == 'admin' && name == 'admin') {
        let users = User.find({}).select('firstName lastName email password male female other category -_id')
        .exec( (err, users) => {
            if(err) {
                console.log(err);
            } else {
                res.render('admin-home', {users: users});
            }
        });
    }
})

// categories route
app.get('/home/categories', (req, res) => {
    res.render('categories', {name: req.cookies.name});
})

app.get('/home/categories/:substory', (req, res) => {
    const {substory} = req.params;
    const data = storyData[substory];
    if (data) {
        res.render('category', { ...data, username: req.cookies.name});
    } else {
        res.render('notfound', {substory});
    }
})

app.get('/change-password', (req, res) => {
    res.render('change-password')
})

app.listen(process.env.PORT || 6060, () => {
    console.log('PORTING...')
})