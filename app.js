// global module import
require("./lib")
global.moment = require("moment")
global.express = require("express")
global.db = require("./db")

var app = express()
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.text({limit:262144, extended: true}));
app.use(bodyParser.raw({limit:262144, extended: true}));
app.use(bodyParser.urlencoded({limit:262144, extended: true}));

// engine setting
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.set('views', [__dirname, 'views'].join("/"))

// static setting
app.use(express.static([__dirname, 'public'].join("/")))
app.use(express.static([__dirname, 'views'].join("/")))
app.use('/bootstrap', express.static([__dirname, 'node_modules/bootstrap/dist'].join("/")))
app.use('/jquery', express.static([__dirname, 'node_modules/jquery/dist'].join("/")))

// url match
app.use("/", require("./routes/render"))
app.use("/api", require("./routes/api"))

// server on
app.listen(80)
