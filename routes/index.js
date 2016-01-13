'use strict'
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comments.js');
var multer = require('multer');

function getFileName(){
    let time = 1;
    return function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + time);
        time ++;
    }
};

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'images/');
    },
    filename: getFileName()
});

var upload = multer({
    storage: storage
});

module.exports = function(app) {
    app.get('/', function(req, res) {
        let page = parseInt(req.query.p) || 1;
        Post.getLimit(null, 10, page, function(err, posts, total) {
            if (err) {
                queryPosts = [];
            }
            res.render('index', {
                title: 'Index',
                user: req.session.user,
                posts: posts,
                page: page,
                isFirstPage: (page -1) == 0,
                isLastPage: ((page -1) * 10 + posts.length) == total,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/register', checkNotLogin);
    app.get('/register', function(req, res) {
        res.render('register', {
            title: 'Register',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/register', checkNotLogin);
    app.post('/register', function(req, res) {
        let password = req.body.password;
        let passwordRepeat = req.body['password_repeat'];
        if (passwordRepeat != password) {
            req.flash('error', 'Password doesn\'t match.');
            return res.redirect('/register');
        }
        let md5 = crypto.createHash('md5');
        //给密码加盐哈希
        passwordMD5 = md5.update(password).digest('hex');
        let newUser = new User({
            name: req.body.name,
            password: passwordMD5,
            email: req.body.email
        });
        User.get(newUser.name, function(err, user) {
            if (err) {
                req.flash('Error', err);
                return res.redirect('/');
            }
            if (user) {
                req.flash('Error', 'User name has been used.');
                return res.redirect('/register');
            }
            newUser.save(function(err, user) {
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
    app.get('/login', function(req, res) {
        res.render('login', {
            title: 'Login',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        let md5 = crypto.createHash('md5');
        let password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function(err, user) {
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
            return res.redirect('/');
        });
    });

    app.get('/post', checkLogin);
    app.get('/post', function(req, res) {
        res.render('post', {
            title: 'Post',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });


    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        let currentUser = req.session.user;
        let post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'Post Success');
            res.redirect('/');
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', 'Logout Success.');
        res.redirect('/');
    });

    app.get('/upload', checkLogin);
    app.get('/upload', function(req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', upload.array('picture',5), function (req, res, next) {
        let filenames = '\n';
        req.files.forEach(function(file) {
            filenames += file.filename;
            filenames += '\n';
        });
        req.flash('success', 'Upload Success.\n' + filenames);
        res.redirect('/upload');
    });

    app.get('/u/:name', function (req, res) {
        let page = parseInt(req.query.p) || 1;
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', 'User doesn\'t Exist!');
                return res.redirect('/');
            }
            Post.getLimit(user.name, 10, page, function (err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    app.get('/u/:name/:day/:title', function (req, res) {
        Post.get(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        let currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title,function (err, post) {
            if (err) {
                req.flash(('error', err));
                return res.redirect('back');
            }
            res.render('edit', {
                title: 'Edit',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/archive', function (req, res) {
        Post.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: 'Archive',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {
        let currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            var url = encodeURI('/u/' +req.params.name + '/' + req.params.day + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash('success', 'Update Success');
            res.redirect(url);
        });
    });


    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        let currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'Remove Success');
            res.redirect('/');
        });
    });

    app.post('/u/:name/:day/:title', function (req, res) {
        let date = new Date();
        let time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        let comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        let newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', 'Comment Success');
            res.redirect('back');
        });
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
            res.redirect('/');
        }
        next();
    }
};
