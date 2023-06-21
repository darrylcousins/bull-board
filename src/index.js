import crypto from "crypto";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";

import { rechargeQueue } from "./queue.js";

const port = process.env.NODE_PORT || 3000;

// eg when using proxy in nginx under a directory path name http://.../bullmq
const path_prefix = process.env.NODE_PATH || "bullmq";

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash('sha256');
  const hash = sha256.update(password).digest('base64');
  return hash;
};

const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
};

/* Bullboard */
const serverAdapter = new ExpressAdapter();
const bullBoard = createBullBoard({
  queues: [
    new BullMQAdapter(rechargeQueue),
  ],
  serverAdapter: serverAdapter,
});
serverAdapter.setBasePath(`/${path_prefix}/admin`);
/* End Bullboard */

/* Express */
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

app.use(express.static("public"));

/* Ensure authentication */
app.use((req, res, next) => {
  // Get auth token from the cookies
  const authToken = req.cookies['AuthToken'];

  // Inject the user to the request
  req.user = authTokens[authToken];

  next();
});

/* Middleware */
const requireAuth = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.render('login', {
      message: 'Please login to continue',
      messageClass: 'alert-danger'
    });
  }
};

  
/* Routes */
// not this one
//app.use(`/${path_prefix}/admin`, requireAuth, serverAdapter.getRouter());
app.use('/admin', requireAuth, serverAdapter.getRouter());

app.get("/", requireAuth, async function (req, res) {
  res.render("index");
});

app.get("/login", async function (req, res) {
  res.render("login", { message: null });
});

const authTokens = {};

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = getHashedPassword(password);

  const user = process.env.USER === username && process.env.PASS === hashedPassword;

  if (user) {
    const authToken = generateAuthToken();

    // Store authentication token
    authTokens[authToken] = username;

    // Setting the auth token in cookies
    res.cookie('AuthToken', authToken);

    // Redirect user to the protected page
    res.redirect(`/${path_prefix}/admin`);
  } else {
    res.render('login', {
      message: 'Invalid username or password',
      messageClass: 'alert-danger'
    });
  };
});

/* End Routes */

app.listen(port, function () {
  console.log(`Server running on port ${port}`);
});

