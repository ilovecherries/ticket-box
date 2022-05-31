import express from "express";
import passport from "passport";
import { UserService } from "./services/user";
import jwt from "jsonwebtoken";
import postRouter from "./routes/posts";
import voteRouter from "./routes/votes";
import categoryRouter from "./routes/categories";
import tagRouter from "./routes/tags";
import AnonymousStrategy from "passport-anonymous";
import cors from "cors";

const app = express();
const port = 3500;

const userService = new UserService();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
}))

passport.use('signup', userService.registerStrategy());
passport.use('login', userService.loginStrategy());
passport.use(userService.jwtStrategy());
passport.use(new AnonymousStrategy.Strategy());

const auth = passport.authenticate(["jwt", "anonymous"], { session: false });

app.use('/api/v1/posts', auth, postRouter);
app.use('/api/v1/categories', auth, categoryRouter);
app.use('/api/v1/tags', auth, tagRouter);
app.use('/api/v1/votes', auth, voteRouter);

app.post(
  "/api/v1/register", 
  passport.authenticate('signup', { session: false }),
  async (req, res) => {
    res.status(201);
    res.json(req.user);
  },
);

app.post(
  '/api/v1/login',
  async (req, res, next) => {
    passport.authenticate(
      'login',
      async (err, user) => {
        try {
          if (err || !user) {
            const error = new Error('An error occurred.');

            return next(error);
          }

          req.login(
            user,
            { session: false },
            async (error) => {
              if (error) return next(error);

              const body = { id: user.id, username: user.username, admin: user.admin };
              const token = jwt.sign({ user: { id: user.id } }, 'TOP_SECRET');

              return res.json({ token, user: body });
            }
          );
        } catch (error) {
          return next(error);
        }
      }
    )(req, res, next);
  }
);

app.get("/api/v1/me", auth, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401);
    res.send("You must be logged in to be able to see your user data.");
  }
})

app.get("/assets/:file", (req, res) => {
  res.sendFile(`${__dirname}/public/assets/${req.params.file}`);
});

app.get("/*", (_, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const server = app.listen(port, () => {
  console.log("Server is running.");
});

export default server;
