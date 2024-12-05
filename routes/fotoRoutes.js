const express = require("express");
const router = express.Router();
const multer = require("multer");
const { photoUploadGet, photoUploadPost } = require('../controllers/fotoControllers')
const upload = multer({dest: "../public/gallery/orig/"});

const checkLogin = function(req, res, next){
	if(req.session != null){
		if(req.session.userId){
			console.log("Login, sees kasutaja: " + req.session.userId);
			next();
		}
		else {
			console.log("login not detected");
			res.redirect("/signin");
		}
	}
	else {
		console.log("sessiont not detected");
		res.redirect("/signin");
	}
}

router.get("/", checkLogin, photoUploadGet);

router.post("/", checkLogin, upload.single("photoInput"), photoUploadPost);

module.exports = router