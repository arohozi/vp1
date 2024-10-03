exports.dateFormatted = function(){	
	//function dateFormatted(){
	let timeNow = new Date();
	let dateNow = timeNow.getDate();
	let monthNow = timeNow.getMonth();
	let yearNow = timeNow.getFullYear();
	const monthNamesEt = ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"];
	//console.log("Täna on: " + dateNow + "." + (monthNow + 1) + "." + yearNow);
	//let dateEt = dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
	//return dateEt;
	return dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
}
