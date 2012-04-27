
var test_string  = ["hello", "hello@gmail.com", "@gmail.com", "hello@gmail"];

var email_filter = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/;
for (var i = 0; i < 4; i++) {
    var match = email_filter.test(test_string[i]);
    console.log (match);
}
