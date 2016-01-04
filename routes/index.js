var crypto = require('crypto');
var User = require('../models/user.js');

module.exports = function(app) {
    app.get('/', function (req, res) {
        res.render('index', {
            title : 'Index'
        });
    });

    app.get('/register', function (req, res) {
        res.render('register', {
            title : 'Register'
        });
    });

    app.post('/register', function(req, res) {
        var password = req.body.password;
        var passwordRepeat = req.body['password_re'];

        if (password_re != password) {
            req.flash('error', 'Password doesn\'t match.');
            return res.redirect('/register');
        }

        var md5 = crypto.createHash('md5');
        passwordMD5 = md5.update(password).digest('hex');

        var newUser = new User({
            name: req.body.name,
            password: passwordMD5,
            email: req.body.email
        });

        User.get(newUser.name, function (err, user) {
            if (err) {
                req.flash('Error', err);
                return res.redirect('/');
            }
            if (user) {
                req.flash('Error', 'User name has been used.');
                return res.redirect('/register');
            }

            newUser.save(function (err, user) {
                if (err) {
                    req.flash('Error', err);
                    return res.redirect('/register');
                }
                req.session.user = user;
                req.flash('Success', 'Register Success');
                return res.redirect('/');
            });
        });
    });
});


app.get('/login', function (req, res) {
    res.render('login', {
        title : 'Login'
    });
});

app.post('/login', function (req, res) {

});

app.get('/post', function (req, res) {
    res.render('post', {
        title: 'Post'
    });
});


app.post('/post', function (req, res) {

});

app.get('/logout', function (req, res) {

});
};
