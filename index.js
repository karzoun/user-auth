var express = require("express");

// Sets up the Express App
// =============================================================
var app = express();
var PORT = process.env.PORT || 8083;

require("dotenv").config();

// Requiring our models for syncing
var db = require("./models");

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const bcrypt = require("bcrypt");

// Static directory
// app.use(express.static("public"));
const session = require("express-session");

app.set("trust proxy", 1);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: true,
            maxAge: 2 * 60 * 60 * 1000,
        },
    })
);

app.get("/", function(req, res) {
    res.render("index")
});


app.post("/signup", function(req, res) {
    db.User.create({
            email: req.body.email,
            password: req.body.password,
        })
        .then((newUser) => {
            res.json(newUser);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json(err);
        });
});

app.post("/login", (req, res) => {
    db.User.findOne({
        where: { email: req.body.email },
    }).then((user) => {
        if (!user) {
            req.session.destroy();
            return res.status(404).send("no such user");
        } else if (bcrypt.compareSync(req.body.password, user.password)) {
            req.session.user = {
                email: user.email,
                id: req.session.id,
            };
            return res.status(200).json(req.session);
        } else {
            req.session.destroy();
            return res.status(401).send("incorrect password");
        }
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.send("logged out");
});

app.get("/secretstuff", (req, res) => {
    if (req.session.user) {
        res.send("secretsssss");
    } else {
        res.status(401).send("login first you knucklehead");
    }
});

//Turtles
app.get("/api/turtles", (req, res) => {
    db.Turtle.findAll().then((turtles) => {
        res.json(turtles);
    });
});

app.get('/myprofile', (req, res) => {
    if (req.session.user) {
        db.User.findOne({
            where: {
                id: req.session.user.id
            },
            include: [db.Turtle]
        }).then(userData => {
            const userDataJSON = userData.toJSON()
            res.render('profile', { user: userDataJSON })
        })
    } else {
        res.redirect("/login")
    }
})

app.post("/api/turtles", (req, res) => {
    if (req.session.user) {
        db.Turtle.create({
                name: req.body.name,
                isTeenageMutantNinja: req.body.isTeenageMutantNinja,
                age: req.body.age,
                UserId: req.session.user.id,
            })
            .then((newTurtle) => {
                res.json(newTurtle);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).end();
            });
    } else {
        res.status(401).send("login first you knucklehead");
    }
});

app.delete("/api/turtles:id", (req, res) => {
    if (req.session.user) {
        db.Turtle.findOne({
            where: {
                id: req.params.id,
            },
        }).then((turtle) => {
            if (turtle.UserId === req.session.user.id) {
                db.Turtle.destroy({
                    where: {
                        id: req.params.id,
                    },
                }).then((delTurtle) => {
                    res.json(delTurtle);
                });
            } else {
                res.status(401).send("NOT YOUR TURTLE!!!!!");
            }
        });
    } else {
        res.status(401).send("not logged in");
    }
});

app.put("/api/turtles:id", (req, res) => {
    if (req.session.user) {
        db.Turtle.findOne({
            where: {
                id: req.params.id
            }
        }).then(turtle => {
            if (!turtle) {
                return res.status(404).send("no such turtle")
            } else if (turtle.UserId === req.session.user.id) {
                db.Turtle.update({
                    name: req.body.name,
                    isTeenageMutantNinja: req.body.isTeenageMutantNinja,
                    age: req.body.age
                }, {
                    where: {
                        id: req.params.id
                    }
                }).then(editTurtle => {
                    res.json(editTurtle);
                }).catch(err => {
                    res.status(500).send("ERROR ERROR ERROR!")
                })
            } else {
                res.status(401).send('NOT YOUR TURTLE!!!!!')
            }
        })

    } else {
        res.status(401).send("not logged in")
    }
})


db.sequelize.sync({ force: false }).then(function() {
    app.listen(PORT, function() {
        console.log("App listening on PORT " + PORT);
    });
});