const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config");
const async = require("async");

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
const galleryIndex = (req, res) => {
	res.redirect("/gallery/1");
};

const galleryPage = (req, res)=>{
	let galleryLinks = "";
	let page = parseInt(req.params.page);
	if (page < 1){
		page = 1;
	}
	const fullName = getUserInfo(req, 'full_name');
	const photoLimit = 5;
	let skip = 10;
	skip = (page - 1) * photoLimit;
	let sqlReq = "SELECT file_name, alt_text FROM photos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC LIMIT ?, ?";
	const privacy = 3;
	//teeme päringud, mida tuleb kindlalt üksteise jätel teha
	const galleryPageTasks = [
		function(callback) {
			conn.execute("SELECT COUNT(id) as photoCount FROM photos WHERE privacy = ? AND deleted IS NULL", [privacy], (err, result) => {
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(photoCount, callback){
				console.log("Fotosid on: " + photoCount[0].photoCount);
				if((page - 1) * photoLimit >= photoCount[0].photoCount){
					page = Math.ceil(photoCount[0].photoCount / photoLimit);
				}
				console.log("Lehekülg on: " + page);
				//lingid oleksid
				//<a href="/gallery/1">eelmine leh</a> | <a href="/gallery/3">järgmine leht</a>
				if(page == 1){
					galleryLinks = "eelmine leht &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;";
				}
				else {
					galleryLinks = '<a href="/gallery/' + (page - 1) + '">eelmine leht &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;';
				}
				if(page * photoLimit >= photoCount[0].photoCount){
					galleryLinks += "järgmine leht";
				}
				else {
					galleryLinks += '<a href="/gallery/' + (page + 1) + '">järgmine leht</a>';
				}
				return callback(null, page);
		}
	];
	//async waterfall
	async.waterfall(galleryPageTasks, (err, results)=>{
		if(err){
			throw err;
		}
		else {
			console.log(results);
		}
	});
	//kui aadressis toodud 1k on muudetud, oli vigane, siis ...
	console.log(req.params.page);
	if(page != parseInt(req.params.page)){
		console.log("LK muutus");
		res.redirect("/gallery/" + page);
	}
	
	let photoList = [];
	conn.execute(sqlReq, [privacy, skip, photoLimit], (err, result)=>{
		if(err){
			throw err;
		}
		else {
			console.log(result);
			for(let i = 0; i < result.length; i ++) {
				photoList.push({href: "/gallery/thumb/" + result[i].file_name, alt: result[i].alt_text, fileName: result[i].file_name});
			}
		
			res.render("gallery", {listData: photoList, fullName: fullName, links: galleryLinks});
		}
	});
	//res.render("gallery");
}

module.exports = { galleryIndex, galleryPage }