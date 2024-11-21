const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

//@desc home page for news section 
//@route GET /news 
//@access private 

const newsHome = (req, res)=>{
	console.log("Töötab uudiste  router koos kontrolleriga");
	res.render("news");
};

//@desc page for adding news
//@route GET /news/addnews
//@access private

const addNews = (req, res)=>{
	res.render("addnews");
};

//@desc adding news
//@route POST /news/addnews
//@access private

const addingNews = (req, res)=>{
	if(!req.body.titleInput || !req.body.newsInput || !req.body.expireInput){
		console.log('Uudisega jama');
		notice = 'Andmeid puudu!';
		res.render('addnews', {notice: notice});
	}
	else {
		let sql = 'INSERT INTO news (news_title, news_text, expire_date, user_id) VALUES(?,?,?,?)';
		//let userid = 1;
		//andmebaasi osa
		conn.execute(sql, [req.body.titleInput, req.body.newsInput, req.body.expireInput, req.session.userId], (err, result)=>{
			if(err) {
				throw err;
				notice = 'Uudise salvestamine ebaأµnnestus!';
				res.render('addnews', {notice: notice});
			} else {
				notice = 'Uudis edukalt salvestatud!';
				res.render('addnews', {notice: notice});
			}
		});
		//andmebaasi osa lأµppeb
	}
};

//@desc page for reading news headings
//@route POST /news/read
//@access private

const newsHeadings = (req, res)=>{
	let sql = "SELECT id, news_title FROM vp1news WHERE expire_date > ? ORDER BY id DESC";
		//let userid = 1;
		//andmebaasi osa
		conn.execute(sql, [new Date()], (err, result)=>{
			if(err) {
				//throw err;
				const news = [{id: 0, news_title: "Uudiseid pole!"}];
				notice = 'Uudiste lugemine ebaأµnnestus!' + err;
				res.render('readnews', {news: news});
			} else {
				notice = 'Uudised edukalt loetud!';
				res.render('readnews', {news: result});
			}
		});
	//res.render("readnews");
};

module.exports = {
	newsHome,
	addNews,
	addingNews,
	newsHeadings
};