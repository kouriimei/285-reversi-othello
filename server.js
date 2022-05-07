/**********************************/
/* Set up the static file server*/
let static = require("node-static");


/* Set up HTTP server */
let http = require("http");

/* Assume that we are running on Heroku */
let port = process.env.PORT;
let directory = __dirname + '/public';

/* If not on Heroku, then adjust port and directory */
if ((typeof port == "undefined") || (port === null)) {
	port = 8080;
	directory = "./public";
}

/* Set up static file webserver to deliver files from hard drive */
let file = new static.Server(directory);

let app = http.createServer(
	function(request, response) {
		request.addListener("end", 
			function() {
				file.serve(request, response);
			}
		).resume();
	}

).listen(port);

console.log("The server is running"); 
