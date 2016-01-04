var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
//根据settings.js里的数据库名，地址，端口创建数据库连接实例
module.exports = new Db(settings.dbName, new Server(settings.host, settings.port),{
    safe: true
});
