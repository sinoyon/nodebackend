/**
 * Express configuration
 */

"use strict";

import express from "express";
import morgan from "morgan";
import compression from "compression";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";
import errorHandler from "errorhandler";
import path from "path";
import lusca from "lusca";
import config from "./environment";
import passport from "passport";
import session from "express-session";
import connectMongo from "connect-mongo";
import mongoose from "mongoose";
import cors from "cors";
const fileUpload = require('express-fileupload');

var MongoStore = connectMongo(session);

export default (app) => {
  var env = app.get("env");

  app.use(express.static(path.join(config.root, "public")));
  app.use("/", express.static(path.resolve("./public")));
  app.use(morgan("dev"));
  app.use(compression());
  app.use(bodyParser.json({ limit: "900mb" }));
  app.use(bodyParser.urlencoded({ limit: "900mb", extended: true }));
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(fileUpload());
  
  // app.use(
  //   session({
  //     secret: config.secrets.session,
  //     saveUninitialized: true,
  //     resave: false,
  //     store: new MongoStore({
  //       mongooseConnection: mongoose.connection,
  //       db: "startupswallet"
  //     })
  //   })
  // );

  if (env !== "test" && env !== "development" && !process.env.SAUCE_USERNAME) {
    app.use(
      lusca({
        csrf: true,
        xframe: "SAMEORIGIN",
        hsts: {
          maxAge: 31536000, //1 year, in seconds
          includeSubDomains: true,
          preload: true
        },
        xssProtection: true
      })
    );
  }

  if (env === "development" || env === "test") {
    app.use(cors());
    app.use(errorHandler());
  }
}
