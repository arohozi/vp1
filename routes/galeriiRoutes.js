const express = require("express");
const router = express.Router();
const { galleryIndex, galleryPage } = require('../controllers/galeriiControllers')

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


router.get("/", checkLogin, galleryIndex);
router.route("/:page").get(galleryPage);

module.exports = router