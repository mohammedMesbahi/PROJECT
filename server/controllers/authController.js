const mongoose = require("mongoose");
const User = mongoose.model("User");
const jwt = require('jsonwebtoken');
exports.validateSignup = (req, res, next) => {
  req.sanitizeBody("name");
  req.sanitizeBody("email");
  req.sanitizeBody("password");
  req.sanitizeBody("rPassword");

  // Name is non-null and is 4 to 10 characters
  req.checkBody("name", "Enter a name").notEmpty();
  req
    .checkBody("name", "Name must be between 4 and 10 characters")
    .isLength({ min: 4, max: 10 });

  // Email is non-null, valid, and normalized
  req
    .checkBody("email", "Enter a valid email")
    .isEmail()
    .normalizeEmail();

  // Password must be non-null, between 4 and 10 characters
  req.checkBody("password", "Enter a password").notEmpty();
  req
    .checkBody("password", "Password must be between 4 and 10 characters")
    .isLength({ min: 4, max: 10 });

  req.assert('password', 'Passwords do not match').equals(req.body.rPassword);

  const errors = req.validationErrors();
  if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).send(firstError);
  }
  next();
};

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  User.create({ name, email, password })
    .then(user => {
      res.json(user.name);
    })
    .catch(err => {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    })
};

exports.signin = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email: email })
  .then(user => {
    if (!user) {
      res.status(404).send("this email is not registered")
    } else {
      if (user.isValidPassword(password)) {
        // give him a token
        var token = jwt.sign({ userid: user.id, email: user.email, name: user.name }, process.env.jwtSecret, { expiresIn: maxAge });
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
      }
      else {
        res.status(403).send('wrong cridentials')
      }
    }
  })
  .catch(err => {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  })
};

exports.signout = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
};

exports.checkAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.jwtSecret, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        return res.redirect('/signin');
      } else {
        console.log(decodedToken);
        return next();
      }
    });
  } else {
    res.redirect('/signin');
  }
};
const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, 'net ninja secret', (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else {
        console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect('/login');
  }
};

const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

const maxAge = 24 * 60 * 60;
// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    // console.log(err);
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);
      // console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}