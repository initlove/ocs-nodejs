
var a = {"name" : "initlove", "email": "liangchenye@gmail.com"};
console.log (a);
a.car = "civic";
console.log (a);
    
var query = {}; 
var search = "google";
query.dist = "abd";
query.$or = new Array();
query.$or[0] = {"name" : {$regex: search, $options: 'i'}};
query.$or[1] = {"summary" : {$regex: search, $options: 'i'}};

var category = "123X456";
var category_array = category.split ("x");

query.category ={$in: category_array};

console.log (JSON.stringify(query));

