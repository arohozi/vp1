const mysql = require("mysql2");
const sharp = require("sharp");
const dbInfo = require("../../../vp2024config");
const fs = require("fs");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});
function getUserInfo(req, type) {
	if (type === "id") {
	  return req.session.userId
	} else if (type === "full_name") {
	  const id = req.session.userId
	  let sqlReq = "SELECT first_name, last_name FROM users WHERE id = ?";
	  conn.query(sqlReq, [id], (err, sqlres) => {
		if (err) {
		  return 'Anonüümne'
		} else {
			console.log(`Returned ${sqlres[0].first_name} ${sqlres[0].last_name}`)
		  	return `${sqlres[0].first_name} ${sqlres[0].last_name}`
		}
	  });
	}
}

const photoUploadGet = (req, res)=>{
	const fullName = getUserInfo(req, 'full_name');
	res.render("photoupload", { fullName: fullName });
}

const photoUploadPost = (req,res)=>{
	console.log(req.body);
	console.log(req.file);
	//genereerima oma failinime
	const fileName = "vp_" + Date.now() + ".jpg";
	//nimetame üleslaetud faili ümber
	fs.rename(req.file.path, req.file.destination + fileName, (err)=>{
		console.log(err);
	});
	sharp(req.file.destination + fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/gallery/normal/" + fileName);
	sharp(req.file.destination + fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/gallery/thumb/" + fileName);
	//salvestame andmebaasiühenduse
	let sqlReq = "INSERT INTO photos (file_name, orig_name, alt_text, privacy, user_id) VALUES(?,?,?,?,?)";
	const userId = 1;
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err, result)=>{
		if(err){
			throw err;
		}
		else {
			res.render("photoupload");
		}
	});
}

module.exports = { photoUploadGet, photoUploadPost }