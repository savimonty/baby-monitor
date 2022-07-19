//require('dotenv').config();

const fs = require('fs');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fetch = require('node-fetch');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session')
const basicAuth = require('express-basic-auth'); 
const { ExpressPeerServer } = require('peer');
const morgan = require("morgan");

const toDateStr = (dt) => dt.toISOString().split("T")[0];
const toTimeStr = (dt) => dt.toISOString().split("T")[0].split("Z")[0];

const auth0ClientId = process.env.AUTH0_CLIENT_ID
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET

const httpPort = process.env.BM_HTTP_PORT
const httpsPort = process.env.BM_HTTPS_PORT

const exp = require('constants');
const { json } = require('express');
const { send } = require('process');

const privateKey  = fs.readFileSync(process.env.BM_SSL_PRIVATE_KEY, 'utf8');
const certificate = fs.readFileSync(process.env.BM_SSL_CERT, 'utf8');

const logsPath = `${process.env.BM_LOGS_PATH}/bm-${toDateStr(new Date())}.log`

// create a rolling file logger based on date/time that fires process events
const SimpleNodeLogger = require('simple-node-logger'),
	opts = {
		logFilePath: logsPath,
		timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
	},
log = SimpleNodeLogger.createSimpleLogger( opts );
log.setLevel('trace');

//////////////////////////////////////////////////////////////////////////////////

const makeid = (length) => {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
 }
 return result;
}

log.info("=================================================================");

process.on('uncaughtException', function(error) {
  console.log("Some error: ", error)
  console.error(error)
  errorManagement.handler.handleError(error);
  if(!errorManagement.handler.isTrustedError(error))
  console.error(error)
  process.exit(1);
 });

const app = express()
app.use(cookieParser());
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'shhhh',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(cors());

// FILTERS
app.all("*", (req, res, next) => {
  log.info(`[${req.method}] ${req.originalUrl}`)
  next()
})

app.all("*", (req, res, next) => {
    if(!req.secure){
      log.warn(`(${req.method}) ${req.originalUrl} - NON-SSL - Redirecting to HTTPS`)
      return res.redirect(`https://${req.hostname}:${httpsPort}${req.url}`);
    };
    next();
})

const loadAccess = () => {
  let access = {
    "capturer": process.env.USER_CAPTURERS_CSV.split(","),
    "viewer": process.env.USER_VIEWERS_CSV.split(",")
  }
  log.info("Access: ", access);
  return access
}
var access = loadAccess()
app.use(express.static('build'));


// REST END POINTS

const COGNITO_APP_DOMAIN=process.env.COGNITO_APP_DOMAIN
const COGNITO_CLIENT_ID=process.env.COGNITO_CLIENT_ID
const COGNITO_CLIENT_SECRET=process.env.COGNITO_CLIENT_SECRET

app.get('/login', (req, res) => {
  const COGNITO_REDIRECT_URL=encodeURIComponent(`https://${req.hostname}:${httpsPort}/authorization`)
  const COGNITO_AUTHORIZE_URL=`https://${COGNITO_APP_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=openid+profile+email&redirect_uri=${COGNITO_REDIRECT_URL}`
  console.log(COGNITO_AUTHORIZE_URL)
  res.redirect(COGNITO_AUTHORIZE_URL)
})


app.get('/logout', (req, res) => {
  
  req.session.destroy();

  const COGNITO_LOGOUT_REDIRECT_URL=encodeURIComponent(`https://${req.hostname}:${httpsPort}/login`)
  const COGNITO_LOGOUT_URL=`https://${COGNITO_APP_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${COGNITO_LOGOUT_REDIRECT_URL}`
  res.redirect(COGNITO_LOGOUT_URL)
})

app.get('/authorization', (req, res) => {  
  return res.render(__dirname + '/build/blippitybop.html', {redirUri: `https://${req.hostname}:${httpsPort}/token`});
})

app.get("/token", (req, res) => {
  const ACCESS_TOKEN = req.query.access_token;
  const COGNITO_TOKEN_URL=`https://${COGNITO_APP_DOMAIN}/oauth2/userInfo`
  fetch(COGNITO_TOKEN_URL, {
    method: 'GET',
    headers: {
      "Authorization":  'Bearer ' + ACCESS_TOKEN
    }
  })
  .then(response => response.json())
  .then(userInfo => {
    console.log("Response: ", userInfo)
    //res.send(userInfo)
    if(userInfo.email) {
      req.session.user = userInfo
      res.redirect("/home")
    }
    else {

    }
  })
  .catch(reason => {
    console.error("Error", reason)
    res.send(reason)
  })

});


const requiresSession = (req, res, next) => {
  if(req.session.user) {
    next()
  }
  else {
    return res.redirect('/logout');
  }
}

app.get("/turncreds", requiresSession, (req, res) => {
  const TURN_USER=process.env.TURN_USER
  const TURN_PASS=process.env.TURN_PASS
  return res.send({"u": TURN_USER, "p": TURN_PASS})
});

app.get("/home", requiresSession, (req, res) => {
  user = req.session.user
  log.info(user)
  _access = Object.keys(access).filter(x => access[x].includes(user.email))
  log.info(_access)
  log.info("user info: ", user)
  return res.render(__dirname + '/build/home.html', {user: user, access: _access});
});

app.get('/capture', requiresSession, (req, res) => {
  // capturer
  user = req.session.user
  log.info(user)
  _access = Object.keys(access).filter(x => access[x].includes(user.email))
  log.info(_access)
  if(_access.includes("capturer")) {
    return res.render(__dirname + '/build/capture.html', {user: user});
  }
  else {
    return res.send("NO ACCESS TO CAPTURER FOR " + user.email + "<br /><a href='/logout'>LOGOUT</a>");
  }
});

app.get("/bm", requiresSession, (req, res) => {
  // viewer
  user = req.session.user
  log.info(user)
  _access = Object.keys(access).filter(x => access[x].includes(user.email))
  log.info(_access)
  if(_access.includes("viewer")) {
    return res.sendFile(__dirname + '/build/index.html');
  }
  else {
    return res.send("NO ACCESS TO VIEWER FOR " + user.email + "<br /><a href='/logout'>LOGOUT</a>");
  }
});






// SERVER CONFIGURATION INCLUDING PEERJS SERVER
const httpServer = http.createServer(app);
httpServer.on("error", (error) => {
  log.error(`Unable to listen on port ${httpPort} ${error}`);
  process.exit(1)
})

const httpsServer = https.createServer({key: privateKey, cert: certificate}, app);
httpsServer.on("error", (error) => {
  log.error(`Unable to listen on port ${httpsPort} ${error}`);
  process.exit(1)
})

const peerServer = ExpressPeerServer(httpsServer, {
  debug: true, 
  path: '/bm'
});
app.use('/peerjs', peerServer);

httpServer.listen(httpPort, () => {
  log.info(`Listening on port ${httpPort}. All will be redirected to SSL at ${httpsPort}`)
});
httpsServer.listen(httpsPort, () => {
  log.info(`Listening on port ${httpsPort}`)
  log.info("Routes: ", app._router.stack.filter(x => x.name == "bound dispatch").map(x => [x.route.path, x.route.stack[0].method]))
  log.info("Access: ", access)
});
