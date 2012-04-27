var express = require('express'),
    mongoose = require('mongoose'); //引入mongoose模块
//连接mongodb数据库　nodejs为数据库名称
mongoose.connect('mongodb://localhost/nodejs');

//获取Schema 以及 ObjectId 对象
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

function validator (v) {
    console.log ("we check ");
    return v.length > 3;
};

//创建一个评论Schema(结构＆架构) 这里相当于mongodb中的collection(集合)
var commentsSchema = new Schema({
//    name: {type:String, validate:[validator, 'my error type']},
    name:String,
    content:String
});

commentsSchema.path('name').validate(function (v) {
    console.log ("check in path");
    return v.length > 3;
}, 'my error');

//生成一个用于操作comments这个collection的Ｍodel对象　　第一个参数为mongodb中的collection名称（需要先创建）
var CommentModel = mongoose.model('comments', commentsSchema);

function validator (v) {
    return false;
}

//新闻Schema

var newsSchema = new Schema({
    id: {type: ObjectId, auto: true},
        title : {type: String, require:true},
        source : String,
        content : String,
        comments :{type:[commentsSchema], default:[]} //新闻的评论，这里是一个子集合(collection),记得一定要用中括号包起来(type:[commentsSchema])，默认为一个空数组(default:[])
});

newsSchema.path('source').validate(function (v) {
    return v.length > 3;
}, "title err");

newsSchema.on('init', function (model) {
      // do stuff with the model
    console.log ("init");
});

//生成新闻的Model
var NewsModel = mongoose.model('news', newsSchema);

NewsModel.count ({}, function (err, count) {
    console.log ("count: "+count);
});
//新建一个新闻
var news = new NewsModel();
news.title = '11国家税务总局：节假日加班工资须缴个税11';
news.source = '11http://finance.qq.com/a/20120221/001221.htm11';
news.content = '11昨日，国税总局纳税服务司就纳税咨询热点问题作出解答....11';
news.save(function(err){
    console.log ("save"+news._id);
});
NewsModel.update({_id: "4f73db7dc986ccd510000002"}, {source: ''}, function (err) {
    if (err)
        console.log (err);
});
NewsModel.find().exec (function (err, doc) {
    if (err)
        console.log ("error: " + err);
    else {
        console.log ("got : " + doc[0]);
    }
});

NewsModel.find({}, function(err,docs){
    if(!err){
        console.log (docs);
        if(docs[0]){
    console.log("we get id " + docs[0].id);
            //添加一条评论
            var comment = new CommentModel();
            comment.name = 'ibasdf null';
//            comment.content = '测试评论!';
            docs[0].comments.push(comment);
            NewsModel.update({_id:docs[0]._id}, {comments:docs[0].comments}, function(err){
                console.log(err);
            });
        }
    }
});
