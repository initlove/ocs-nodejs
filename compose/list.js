var $ = require("mongous").Mongous;

$('test.content').find(
        function (r) {
            if (r.documents.length > 0)
               console.log (r.documents[0]);
}); 

