const express = require("express");
const dtEt= require("./dateTime");
const fs = require("fs");
const dbInfo = require("../../vp2024config");
const mysql = require("mysql2");
//päringu lahtiharutamiseks POST päringute puhul
const bodyparser = require ("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
app.use(session({secret: "minuAbsoluutseltSalajanaeAsi", saveUninitialized: true, resave: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended: true}));
//seadistame vahevara multer fotode laadimiseks kindlasse kataloogi

//UUDISTE OSA ERALDI MARSRUUDILE FAILIGA
const newsRouter= require("./routes/newsRoutes");
const eestiFilmRouter = require("./routes/eestiFilmRoutes");
const galleryRouter = require("./routes/galeriiRoutes");
const photoRouter = require("./routes/fotoRoutes");
app.use("/news", newsRouter);
app.use("/eestifilm", eestiFilmRouter);
app.use("/gallery", galleryRouter);
app.use("/photoupload", photoRouter);

//loon andmebaasiühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

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

app.get("/", (req,res) => {
	const semStartDate = new Date("2024-09-02")
	const today = new Date()
	const timeDifference = today - semStartDate
	const dateDifference = Math.floor(timeDifference / (1000 * 60 * 60 *24))
	console.log(`time dif: ${timeDifference}\ndate dif ${dateDifference}`)
	const sql = 'SELECT * FROM news ORDER BY id DESC LIMIT 1'
	conn.query(sql, [], (err, sqlres) => {
		if (sqlres) {
			let date = new Date(sqlres[0].news_date)
			date = date.toUTCString()
			res.render("index.ejs", {dateDifference: dateDifference, newsTitle: sqlres[0].news_title, newsDesc: sqlres[0].news_text, newsDate: date});
		} else {
			console.log(err)
		}
	})
});

app.get("/signin", (req,res) => {
	let notice = "";
	res.render("signin", {notice: notice});
});
	
app.post("/signin", (req, res)=>{
	let notice = "";
	console.log(req.body);
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("Andmeid puudu");
		notice = "Sisselogimise andmeid on puudu!";
		res.render("index.ejs", {notice: notice});
	}
	else{
		let sqlReq = "SELECT id, password FROM users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
			console.log("Viga andmebaasist lugemisel!" + err);
			notice = "Tehniline viga, sisselogimine ebaõnnestus!";
			res.render("index.ejs", {notice: notice});
			}
			else {
				if(result[0] != null){
					//kasutaja on olemas, kontrollime sisestatud parooli
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
							notice = "Tehniline viga, sisselogimine ebaõnnestus!";
							res.render("signin", {notice: notice});
						}
						else {
							//kas õige v vale parool
							if(compareresult){
								//notice = "Oled sisse loginud!";
								//res.render("signin", {notice: notice});
								req.session.userId = result[0].id;
								res.redirect("/home");
							}
							else {
								notice = "Kasutajatunnus ja/või parool on vale!";
								res.render("signin", {notice: notice});
							}
						}
					});
				}
				else {
					notice = "Ksutajatunnus ja/või parool on vale!";
					res.render("signin", {notice: notice});
				}
			}
			
		});//conn.execute lõppeb
	}
	//res.render("index.ejs");
});

app.get("/home", checkLogin, (req, res)=>{
	console.log("Sees on kasutja: " + req.session.userId);
	res.render("home");
});

app.get("/logout", (req, res)=>{
	req.session.destroy();
	console.log("Välja logitud");
	res.redirect("/");
});

app.get("/signup", (req, res)=>{
	res.render("signup");
});

app.post("/signup", (req, res)=>{
	let notice = "Ootan andmeid!";
	console.log(req.body);
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
			console.log("Andmeid on puudu või paroolid ei kattu!");
			notice = "Andmeid on puudu, parool liiga lühike või paroolid ei kattu!";
			res.render("signup", {notice: notice});
	}
	else {
		notice = "Andmed sisestatud!";
		//loome parooli räasi
		bcrypt.genSalt(10, (err, salt)=> {
			if(err){
				notice = "Tehniline viga, kasutajat ei loodud";
				res.render("signup", {notice: notice});
			}
			else {
				//krüpteerime
				bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash)=>{
					if(err){
						notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud";
					res.render("signup", {notice: notice});
					}
					else {
						let sqlReq = "INSERT INTO users (first_name, last_name, birth_date, gender, email, password) VALUES(?,?,?,?,?,?)"
						conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result)=>{
							if(err){
								notice = "Tehniline viga andmebaasi kirjutamisel, kasutajat ei loodud."
								res.render("signup", {notice: notice});
							}
							else {
								notice = "Kasutaja" + req.body.emailInput + " edukalt loodud!";
								res.render("signup", {notice: notice});
							}
						});//con.execute lõpp
						//
					}
				});
				//hash lõpeb
			}
		});
	}//kui andmed korras, lõppeb
	//res.render("signup");
});


app.get("/timenow", (req, res)=>{
	const weekdayNow = dtEt.weekDayEt();
	const dateNow = dtEt.dateEt();
	const timeNow = dtEt.currentTime();
	res.render("timenow",{nowWD: weekdayNow, nowD: dateNow, nowT: timeNow});
});

app.get("/vanasonad", (req, res)=>{
	let folkWisdom = [];
	fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data)=>{
		if(err){
		//throw err;
		res.render ("justlist", {h2: "Vanasõnad", listData: ["Ei leidnud ühtegi vanasõna"]});
		}
		else {
			folkWisdom = data.split(";");
			res.render ("justlist", {h2: "Vanasõnad", listData: folkWisdom});
		}
	});
});

app.get("/visitlog", (req, res)=>{
	
	fs.readFile("public/textfiles/visitlog.txt", "utf8", (err, data) => {
		if (err) {
			res.render("visitlog", { h2: "Külastuste logi", listData: ["Ei suutnud faili lugeda"] });
		} else {
			const visits = data.trim().split(";");
			res.render("visitlog", { h2: "Külastuste logi", listData: visits });
		}
    });
});

app.get("/regvisit", (req, res)=>{
	//res.send("Express läks täiesti käima");
	res.render("regvisit");
});

app.post("/regvisit", (req, res)=>{
	console.log(req.body);
	fs.open("public/textfiles/visitlog.txt", "a", (err,file)=>{
		if(err){
			throw err;
		}
		else {
			fs.appendFile("public/textfiles/visitlog.txt", `;${req.body.firstNameInput} ${req.body.lastNameInput} ${new Date ().toLocaleDateString()} 
			${new Date().toLocaleTimeString()}`,(err)=>{
				if(err){
					throw err;
				}
				else {
					console.log("Faili kirjutati");
					res.render("regvisit");
				}
			});
		}
	});

	
});

app.get("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	res.render("regvisitdb", {notice: notice,firstName: firstName, lastName: lastName});
});	

app.post("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		firstName = req.body.firstNameInput;
		lastName = req.body.lastNameInput;
		notice = "Osa andmeid sisestamata";
		res.render("regvisitdb", {notice: notice,firstName: firstName, lastName: lastName});
	}
	else {
		let sqlreq = "INSERT INTO visitlog (first_name, last_name) VALUES(?,?)";
		conn.query(sqlreq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlres)=>{
			if(err){
				throw err;
			}
			else{
				notice = "Külastus registreeritud";
				res.render("regvisitdb", {notice: notice,firstName: firstName, lastName: lastName});
			}
		});
	}
});


//uus asi!!!!!!!!!16.10
app.get("/visitlogdb", checkLogin, (req, res) => {
	const fullName = getUserInfo(req, 'full_name');
    let sql = "SELECT first_name, last_name, visit_time FROM visitlog";
    conn.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        res.render("visitlogdb", { visitData: results, fullName: fullName });
    });
});


app.get("/3vorm", checkLogin, (req, res) => {
	const fullName = getUserInfo(req, 'full_name');
    let notice = "";
    let firstName = "";
	let lastName = "";
	let birthDate = "";
    let title = "";
    let positionName = "";
	let productionYear = "";
	let description = "";
    res.render("3vorm", {notice: notice,firstName: firstName, lastName: lastName,title: title,positionName: positionName, fullName: fullName });
});

app.post("/addperson", (req, res) => {

        let notice = "";
	    let firstName = "";
	    let lastName = "";
		let birthDate = ""; //on vaja kirjutada nagu 2001.03.04
        if(req.body.personSubmit ){
		firstName = req.body.firstName;
		lastName = req.body.lastName;
		birthDate = req.body.birthDate;
        if (!firstName || !lastName) {
		    notice = "Osa andmeid sisestamata";
		    res.render("3vorm", {notice: notice,firstName: firstName, lastName: lastName});
        }
        else{ 
            let sqlreq = "INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)";
            conn.query(sqlreq, [req.body.firstName, req.body.lastName, req.body.birthDate], (err, sqlres)=>{
                if (err) {
                    throw err;
                } else {
                    notice = "Tegelane lisatud";
                    res.render("3vorm", { notice: notice, firstName: firstName, lastName: lastName,birthDate: birthDate });
                }
            });
        }
    }
});

app.post("/addfilm", (req, res) => {
    let title = "";
    let notice = "";
	let productionYear = "";
	let duration = "";
	let description = "";
    if (req.body.filmSubmit) {
        title = req.body.title;
		productionYear = req.body.productionYear; 
		duration = req.body.duration;
		description = req.body.description;
        if (!title || !productionYear || !duration || !description) {
            notice = "Osa andmeid sisestamata";
            res.render("3vorm", { notice: notice });
        } else {
            let sqlReq = "INSERT INTO movie (title, production_year,duration,description) VALUES (?,?,?,?)";
            conn.query(sqlReq, [req.body.title, req.body.productionYear,req.body.duration,req.body.description], (err, sqlres) => {
                if (err) {
                    throw err;
                } else {
                    notice = "Film lisatud";
                    res.render("3vorm", { notice: notice, title: title,productionYear: productionYear,duration: duration,description: description});
                }
            });
        } 
    }
 });

app.post("/addrole", (req, res) => {
    let positionName = "";
    let notice = "";
	let description = "";
    
    if (req.body.roleSubmit) {
        positionName = req.body.positionName;
	    description = req.body.description
        if (!positionName|| !description) {
            notice = "Osa andmeid sisestamata";
            res.render("3vorm", { notice: notice });
        } else {
            let sqlReq = "INSERT INTO `position` (position_name,description) VALUES (?,?)";
            conn.query(sqlReq, [positionName,description], (err, sqlres) => {
                if (err) {
                    throw err;
                } else {
                    notice = "Roll lisatud";
                    res.render("3vorm", { notice: notice, positionName: positionName,description: description });
                }
            });
        }
    }
});

//uuuuus aasi !!!!!!!!!

app.get("/addnews", checkLogin, (req,res)=>{
	const fullName = getUserInfo(req, 'full_name');
	const today = new Date();
	const expDate = new Date(today);
	expDate.setDate(today.getDate() + 10);
	const year = expDate.getFullYear();
	const month = String(expDate.getMonth() + 1).padStart(2, '0');
	const day = String(expDate.getDate()).padStart(2, '0');

	const formattedDate = `${year}-${month}-${day}`;
	console.log("ya ne ponimayu", formattedDate)
	res.render("addnews", {
		expDate: formattedDate,
		notice: '',
		fullName: fullName
	});
});

app.post("/addnews", checkLogin, (req,res)=>{
	let notice = "";
	const { titleInput, newsInput, expireInput } = req.body
	if (!titleInput || !expireInput || !newsInput) {
		notice = "Osa andmeid sisestamata";
        return res.render("addnews", { notice: notice, expDate: expireInput });
	}
	if (titleInput.length <3 || newsInput.length <10){
		notice = "Nii lühike, proovi uuesti!";
        return res.render("addnews", { notice: notice, expDate: expireInput });   
	}	
	let sqlReq = "INSERT INTO `news` (news_title, news_text, expire_date, user_id) VALUES (?,?,?,?)";
	conn.query(sqlReq, [titleInput, newsInput, expireInput, 1], (err, sqlres) => {
		if (err) {
			throw err;
		} else {
			notice = "Uudis lisatud";
			res.render("addnews", { notice: notice, expDate: expireInput });
		}
	});
});
app.get("/uudislist", checkLogin, (req, res)=>{
	const fullName = getUserInfo(req, 'full_name');
	let folkWisdom = [];
	let sqlReq = "SELECT * FROM news WHERE expire_date >= ?";
	const now = Math.floor(Date.now() / 1000)
	conn.query(sqlReq, [now], (err, sqlres) => {
		if(err){
		//throw err;
		// res.render ("justlist", {h2: "Vanasõnad", listData: ["Ei leidnud ühtegi vanasõna"]});
		}
		else {
			const formattedResults = sqlres
			formattedResults.forEach(item => {
				const date = new Date(item.news_date)
				item.news_date = date.toUTCString()
			})
			res.render ("uudislist", {listData: sqlres, fullName: fullName});
		}
	});
});

	
app.listen(5151);
