const weekdayNamesEt = ["Pühapäev", "Esmaspäev", "Teisipäev", "Kolmapäev", "Neljapäev", "Reede", "Laupäev"];
const monthNamesEt = ["jaanuar","veebruar","märts","aprill","mai","juuni","juuli","august","september","octoober","november","detsember"];

const dateEt = function(){
	
let timeNow = new Date();
//specDate = new Date ("12-27-1939");
let dateNow = timeNow.getDate();
let monthNow = timeNow.getMonth();
let yearNow = timeNow.getFullYear();
let dateNowEt = dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
return dateNowEt;
}
//uus
const givenDateFormatted = function(gDate){
	let specDate = new Date (gDate);
	return specDate.getDate() + ". " + monthNamesEt[specDate.getMonth() ] + " " + specDate.getFullYear();
}

	
const weekDayET =function(){
	let timeNow = new Date();
	let dayNow = timeNow.getDay();
	//const weekdayNamesEt = ["pühapäev", "esmaspäev", "teisipäev", "kolmapäev", "neljapäev", "reede", "laupäev"];
	return weekdayNamesEt[dayNow];
}

const CurrentTime = function() {
let date = new Date();
let hours = date.getHours();
let minutes = date.getMinutes();
let seconds = date.getSeconds();

return + hours + ":" + minutes + ":" + seconds;

}

const partOfDay = function() {
    let dayPart = "suvaline hetk";
    let timeNow = new Date();
    let dayNow = timeNow.getDay();
    let hours = timeNow.getHours();

    if (dayNow >= 1 && dayNow <= 5) {
        if (hours >= 8 && hours < 16) {
            dayPart = "kooliaeg"; 
        } else if (hours >= 16 && hours < 22) {
            dayPart = "vabaeag"; 
        } else {
            dayPart = "uneaeg"; 
        }
    } else {
        if (hours >= 10 && hours < 18) {
            dayPart = "Puhkeaeg"; 
        } else if (hours >= 18 && hours < 23) {
            dayPart = "Vaba aeg"; 
        } else {
            dayPart = "Uneaeg"; 
        }
    }
    return dayPart;
}
module.exports = {monthsEt : monthNamesEt,weekdaysET : weekdayNamesEt,dateEt: dateEt,weekDayEt: weekDayET,currentTime: CurrentTime,partOfDay: partOfDay,givenDateFormatted: givenDateFormatted};