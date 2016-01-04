var crypto = require('crypto');
var User = require('../models/user.js');

module.exports = function(app) {
    app.get('/', function (req, res) {
        res.render('index', {
            title : 'Index',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.get('/register', checkNotLogin);
    app.get('/register', function (req, res) {
        res.render('register', {
            title : 'Register',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/register', checkNotLogin);
    app.post('/register', function(req, res) {
        var password = req.body.password;
        var passwordRepeat = req.body['password_repeat'];

        if (passwordRepeat != password) {
            req.flash('error', 'Password doesn\'t match.');
            return res.redirect('/register');
        }

        var md5 = crypto.createHash('md5');
        //给密码加盐哈希
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


    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title : 'Login',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/login',checkLogin);
    app.post('/login', function (req, res) {
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('error', 'User doesn\' exist. ');
                return res.redirect('/login');
            }
            if (user.password != password) {
                req.flash('error', 'Password doesn\'t match.');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', 'Login Success.');
            res.redirect('/');
        });
    });

    app.get('/post',checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: 'Post'
        });
    });


    app.post('/post',checkLogin);
    app.post('/post', function (req, res) {
    });

    app.get('/logout',checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', 'Logout Success.');
        res.redirect('/');
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', 'Haven\'t login!');
            res.redirect('/');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', 'Already login!');
            res.redirect('back');
        }
        next();
    }
};
