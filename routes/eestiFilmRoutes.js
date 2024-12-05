const express = require("express");
const router = express.Router();
const { eestiFilmIndex, eestiFilmTegelased, eestiFilmLisaSeos } = require('../controllers/eestiFilmControllers')

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


router.get("/", checkLogin, eestiFilmIndex);

router.get("/tegelased", checkLogin, eestiFilmTegelased);

router.get("/lisaSeos", eestiFilmLisaSeos);

module.exports = router