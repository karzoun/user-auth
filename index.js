var express = require("express");

// Sets up the Express App
// =============================================================
var app = express();
var PORT = process.env.PORT || 8083;

require("dotenv").config()

// Requiring our models for syncing
var db = require("./models");

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const bcrypt = require('bcrypt')

// Static directory
// app.use(express.static("public"));
const session = require('express-session')

app.set('trust proxy', 1)

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        maxAge: 2 * 60 * 60 * 1000
    }
}))




app.get('/', function(req, res) {
    res.send('Hello World!')
})

// app.get('/api/users', function(req, res) {
//     db.User.findAll().then(users => {
//         res.json(users)
//     })
// })

app.post('/signup', function(req, res) {
    db.User.create({
        email: req.body.email,
        password: req.body.password
    }).then(newUser => {
        res.json(newUser)
    }).catch(err => {
        console.log(err)
        res.status(500).json(err)
    })
})

app.post('/login', (req, res) => {
    db.User.findOne({
        where: { email: req.body.email }
    }).then(user => {
        if (!user) {
            req.session.destroy()
            return res.status(404).send('no such user')
        } else if (bcrypt.compareSync(req.body.password, user.password)) {
            req.session.user = {
                email: user.email,
                id: req.session.id
            }
            return res.status(200).json(req.session)
        } else {
            req.session.destroy()
            return res.status(401).send("incorrect password")
        }
    })
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('logged out')
})

app.get('/secretstuff', (req, res) => {
    if (req.session.user) {

        res.send("secretsssss")
    } else {
        res.status(401).send("login first you knucklehead")
    }
})


// Routes
// =============================================================
// require("./routes/api-routes.js")(app);
// require("./routes/html-routes.js")(app);

// Syncing our sequelize models and then starting our Express app
// =============================================================
db.sequelize.sync({ force: false }).then(function() {
    app.listen(PORT, function() {
        console.log("App listening on PORT " + PORT);
    });
});