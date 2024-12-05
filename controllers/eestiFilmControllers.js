const mysql = require("mysql2");
const dtEt= require("../dateTime");
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

const eestiFilmIndex = async (req, res)=>{
	const id = req.session.userId
	let sqlReq = "SELECT first_name, last_name FROM users WHERE id = ?";
	conn.query(sqlReq, [id], (err, sqlres) => {
	  if (err) {
		res.render("filmindex", { fullName: `Error` });
	  } else {
		  res.render("filmindex", { fullName: `${sqlres[0].first_name} ${sqlres[0].last_name}` });
	  }
	});	
}

const eestiFilmTegelased = (req, res)=>{
	const fullName = getUserInfo(req, 'full_name');
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
	let persons = [];
	conn.query(sqlReq, (err, sqlres)=>{
		if(err){
			throw err;
		}
		else {
			console.log(sqlres);
		
			//persons = sqlres;
			//for   i   algab  0 piiriks sqlres.length
			//tsükli sees lisame persons listile uue elemendi,mis on ise "object"{first_name: sqlres[i].first_name}
			//listi liisamiseks on käsk
			//push.persons(lisatav element);
			for (let i = 0; i < sqlres.length; i ++){
				persons.push({first_name: sqlres[i].first_name, last_name: sqlres[i].last_name,birth_date: dtEt.givenDateFormatted(sqlres[i].birth_date)});
			}
			res.render("tegelased", {persons: persons, fullName: fullName});	
			
		}
	});
	//res.render("tegelased");
}

const eestiFilmLisaSeos =  (req, res) => {
	//async! et korraga teha mitu andmebaasipäringut
	const filmQueries = [
		function(callback){
			let sqlReq1 = "SELECT id, first_name, last_name, birth_date FROM person"
			conn.execute(sqlReq1, (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			let sqlReq2 = "SELECT id, title, production_year FROM movie"
			conn.execute(sqlReq2, (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			let sqlReq3 = "SELECT id, position_name FROM position"
			conn.execute(sqlReq3, (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		}
	];
	//paneme need päringud funktsioonid paralleelselt käima, tulemuseks saame kolme päringu koondi
	async.parallel(filmQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else{
			console.log(results);
			res.render("addRelations", {personList: results[0], movieList: results[1], positionList: results[2] });
		}
	});
	//res.render("addRelations");
}

module.exports = { eestiFilmIndex, eestiFilmTegelased, eestiFilmLisaSeos }