const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const portNumber = 3000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  session({
    secret: "Our little Secret.",
    resave: 0,
    saveUninitialized: 0,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/ctmartDB");

const authenticateSchema = mongoose.Schema({
  username: String,
  password: String,
});

const userSchema = mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  phoneNumber: String,
});

authenticateSchema.plugin(passportLocalMongoose);

const cycleSchema = mongoose.Schema({
  product: String,
  company: String,
  sellPrice: Number,
  originalPrice: Number,
  suitableFor: {
    type: String,
    enum: ["male", "female", "unisex"],
  },
  color: String,
  description: String,
  created_at: { type: Date, required: true, default: Date.now },
  images: {
    data: Buffer,
    contentType: String,
    fileurl: String,
  },
});

const mattressSchema = mongoose.Schema({
  product: String,
  company: String,
  sellPrice: Number,
  originalPrice: Number,
  length: Number,
  width: Number,
  height: Number,
  description: String,
  material: {
    type: String,
    enum: ["cotton", "jute", "ortho", "other"],
    default: "jute",
  },
  created_at: { type: Date, required: true, default: Date.now },
  images: {
    data: Buffer,
    contentType: String,
    fileurl: String,
  },
});

const booksSchema = mongoose.Schema({
  product: String,
  author: String,
  edition: Number,
  sellPrice: Number,
  originalPrice: Number,
  genre: String,
  description: String,
  bookType: {
    type: String,
    enum: ["paperback", "hardcover"],
    default: "paperback",
  },
  created_at: { type: Date, required: true, default: Date.now },
  images: {
    data: Buffer,
    contentType: String,
    fileurl: String,
  },
});

const electricSchema = mongoose.Schema({
  product: String,
  company: String,
  sellPrice: Number,
  originalPrice: Number,
  description: String,
  created_at: { type: Date, required: true, default: Date.now },
  images: {
    data: Buffer,
    contentType: String,
    fileurl: String,
  },
});

const otherSchema = mongoose.Schema({
  product: String,
  company: String,
  sellPrice: Number,
  originalPrice: Number,
  description: String,
  created_at: { type: Date, required: true, default: Date.now },
  images: {
    data: Buffer,
    contentType: String,
    fileurl: String,
  },
});

const itemSchema = mongoose.Schema({
  code: String,
  product: String,
  company: String,
  category: String,
});

const cartSchema = mongoose.Schema({
  userInfo: [userSchema],
  boughtProdId: [],
});

//{ "_id" : ObjectId("62780690261881b520f3621a"), "name" : "Demo", "username" : "123412341", "email" : "demo@gmail.com", "password" : "demo123", "phoneNumber" : "0960762037", "__v" : 0 }

const AuthUser = mongoose.model("AuthUser", authenticateSchema);
const User = mongoose.model("User", userSchema);
const Item = mongoose.model("Item", itemSchema);
const Cycle = mongoose.model("Cycle", cycleSchema);
const Electrical = mongoose.model("Electrical", electricSchema);
const Mattress = mongoose.model("Mattress", mattressSchema);
const Book = mongoose.model("Book", booksSchema);
const Other = mongoose.model("Other", otherSchema);
const Cart = mongoose.model("Cart", cartSchema);

passport.serializeUser(AuthUser.serializeUser());
passport.deserializeUser(AuthUser.deserializeUser());

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({
  storage: storage,
}).single("item_image");

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("login", { loginfo: -1 });
  } else res.render("login", { loginfo: 1 });
});

app.get("/cart", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("cart");
  } else res.render("login", { loginfo: 2 });
});

app.get("/sell", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("sell");
  } else {
    res.render("login", { loginfo: 2 });
  }
});

app.post("/signup", (req, res) => {
  const name = req.body.name;
  const password = req.body.password;
  const username = req.body.rollNumber;
  const phone = req.body.phone;
  const email = req.body.email;

  const newUser = new User({
    username: username,
    name: name,
    email: email,
    phoneNumber: phone,
    password: password,
  });

  AuthUser.register({ username: username }, req.body.password, function (err, user) {
      if (err) {
        res.redirect("/signup");
      } else {
        req.login(newUser, (err) => {
          if (!err) {
            passport.authenticate("local")(req, res, () => {
              newUser.save();
              res.redirect("/");
            });
          }
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const newUser = new AuthUser({
    username: req.body.rollNumber,
    password: req.body.password
  });
  req.login(newUser, (err) => {
    User.findOne({ username: req.body.rollNumber }, (error, result) => {
      if (error || result == null || result.password != req.body.password)
        res.render("login", { loginfo: 0 });
      else {
        if (!err) {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/");
          });
        }
      }
    });
  });
});

app.post("/sell", (req, res) => {
  upload(req, res, (error) => {
    if (error) {
      res.render("sell", { upload_info: false });
    } else {
      var objectId;
      const category = req.body.category;

      var categoryItem;
      if (category == "cycle") {
        categoryItem = {
          product: req.body.product,
          company: req.body.company,
          sellPrice: req.body.sellPrice,
          originalPrice: req.body.originalPrice,
          suitableFor: req.body.suitableFor,
          description: req.body.description,
          color: req.body.color,
          images: {
            data: `uploads/${req.file.filename}`,
            contentType: "image/png/jpeg/jpg/gif",
            fileurl: "/uploads/" + req.file.filename,
          },
        };
        Cycle.create(categoryItem, (err, obj) => {
          if (err) {
            console.log(err);
          } else {
            objectId = obj._id.valueOf();
            console.log(objectId);
            console.log("Cycle is added sucessfully!");
          }
        });
      } else if (category == "books") {
        categoryItem = {
          product: req.body.product,
          author: req.body.company,
          sellPrice: req.body.sellPrice,
          originalPrice: req.body.originalPrice,
          edition: req.body.edition,
          genre: req.body.genre,
          bookType: req.body.bookType,
          description: req.body.description,
          images: {
            data: `uploads/${req.file.filename}`,
            contentType: "image/png/jpeg/jpg/gif",
            fileurl: "/uploads/" + req.file.filename,
          },
        };
        Book.create(categoryItem, (err, obj) => {
          if (err) {
            console.log(err);
          } else {
            objectId = categoryItem._id;
            console.log("Book is added sucessfully!");
          }
        });
      } else if (category == "mattress") {
        categoryItem = {
          product: req.body.product,
          company: req.body.company,
          sellPrice: req.body.sellPrice,
          originalPrice: req.body.originalPrice,
          length: req.body.len,
          width: req.body.wt,
          height: req.body.ht,
          material: req.body.material,
          description: req.body.description,
          images: {
            data: `uploads/${req.file.filename}`,
            contentType: "image/png/jpeg/jpg/gif",
            fileurl: "/uploads/" + req.file.filename,
          },
        };
        Mattress.create(categoryItem, (err, obj) => {
          if (err) {
            console.log(err);
          } else {
            objectId = categoryItem._id;
            console.log("Mattress is added sucessfully!");
          }
        });
      } else if (category == "electrical") {
        categoryItem = {
          product: req.body.product,
          company: req.body.company,
          sellPrice: req.body.sellPrice,
          originalPrice: req.body.originalPrice,
          description: req.body.description,
          images: {
            data: `uploads/${req.file.filename}`,
            contentType: "image/png/jpeg/jpg/gif",
            fileurl: "/uploads/" + req.file.filename,
          },
        };
        Electrical.create(categoryItem, (err, obj) => {
          if (err) {
            console.log(err);
          } else {
            objectId = categoryItem._id;
            console.log("Electrical Appliance is added sucessfully!");
          }
        });
      } else if (category == "others") {
        categoryItem = {
          product: req.body.product,
          company: req.body.company,
          sellPrice: req.body.sellPrice,
          originalPrice: req.body.originalPrice,
          description: req.body.description,
          images: {
            data: `uploads/${req.file.filename}`,
            contentType: "image/png/jpeg/jpg/gif",
            fileurl: req.file.filename,
          },
        };
        Other.create(categoryItem, (err, obj) => {
          if (err) {
            console.log(err);
          } else {
            objectId = categoryItem._id;
            console.log("Other item is added sucessfully!");
          }
        });
      }
      console.log(objectId);
      var obj1 = {
        code: objectId,
        product: req.body.product,
        company: req.body.company,
        category: req.body.category,
      };
      Item.create(obj1, (err, item) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Item is added sucessfully!");
          res.redirect("/");
        }
      });
    }
  });
});

app.get("/category/:category_name", (req, res) => {
  let category_name = _.capitalize(req.params.category_name);
  if (category_name === "Book") {
    Book.find({}, (err, items) => {
      res.render("display", { items_array: items });
    });
  } else if (category_name === "Mattress") {
    Mattress.find({}, (err, items) => {
      res.render("display", { items_array: items });
    });
  } else if (category_name === "Electrical") {
    Electrical.find({}, (err, items) => {
      res.render("display", { items_array: items });
    });
  } else if (category_name === "Other") {
    Other.find({}, (err, items) => {
      res.render("display", { items_array: items });
    });
  } else if (category_name === "Cycle") {
    Cycle.find({}, (err, items) => {
      res.render("display", { items_array: items });
    });
  }
});

app.post("/search", (req, res) => {
  const searched_item = _.capitalize(req.body.searched_item);
  if (
    ["Book", "Mattress", "Electrical", "Other", "Cycle"].includes(searched_item)
  )
    res.redirect("/category/" + searched_item);
  else res.send("Not found!");
});

app.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

app.listen(portNumber, () => {
  console.log("Server is running on port 3000");
});
