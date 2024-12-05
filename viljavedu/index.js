// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const dbInfo = require("../../../vp2024config");
const mysql = require('mysql2');
const app = express();
const path = require('path');

// Set up the database connection
const db = mysql.createConnection({
host: dbInfo.configData.host,          // Your database host (usually 'localhost' or an IP address)
user: dbInfo.configData.user,          // Your database username
password: dbInfo.configData.passWord,  // Your database password (if applicable)
database: dbInfo.configData.dataBase   // Your database name
});

// Check if the database connection is successful
db.connect((err) => {
  if (err) {
    console.error('Database connection error: ', err.stack);
    return;
  }
  console.log('Connected to the database');
});

// Set up EJS for rendering views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Route for the main form page (index.ejs)
app.get('/', (req, res) => {
  res.render('index');  // Render the form page
});

// Route for displaying the summary of all truck data
app.get('/summary', (req, res) => {
  // Query to fetch all truck data from the database
  const query = 'SELECT * FROM viljavedu';
 
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data: ', err);
      res.status(500).send('Database error');
      return;
    }
    // Render the summary page with the data
    res.render('summary', { loads: results });
  });
});

app.post('/addLoad', (req, res) => {
  const { autoNumber, entranceWeight, exitWeight } = req.body;

  // Query to insert the truck load data into the 'truck_data' table
  const query = 'INSERT INTO viljavedu (truck, weight_in, weight_out) VALUES (?, ?, ?)';
  db.query(query, [autoNumber, entranceWeight, exitWeight], (err, result) => {
    if (err) {
      console.error('Error inserting data: ', err);
      res.status(500).send('Database error');
      return;
    }
    // Redirect to the summary page after successfully inserting the data
    res.redirect('/summary');
  });
});

// Route for the main form page (index.ejs)
app.get('/', (req, res) => {
  res.render('index');  // Render the form page
});

app.get('/summary', (req, res) => {
    db.execute('SELECT * FROM viljavedu', (err, sqlRes) => {
        if (err) {
            console.error(err)
            res.render("summary", {
                notice: "Tekkis viga"
            })
        } else {
            res.render("summary", {
                loads: sqlRes
            })
        }
    })
});

app.post('/summary', (req, res) => {
    db.execute('SELECT * FROM viljavedu', (err, sqlRes) => {
        if (err) {
            console.error(err)
            res.render("summary", {
                notice: "Tekkis viga"
            })
        } else {
            const truckNumber = req.body.truckNumber
            if (!truckNumber) {
                res.render("summary", {
                    loads: sqlRes,
                    notice: 'Auto ei sisestatud'
                })
            } else {
                db.execute('SELECT * FROM viljavedu WHERE truck = ?', [truckNumber], (err, sqlRes2) => {
                    if (err) {
                        console.error(err)
                        res.render("summary", {
                            loads: sqlRes,
                            notice: "Tekkis viga"
                        })
                    } else {
                        if (sqlRes2.length === 0) {
                            res.render("summary", {
                                loads: sqlRes,
                                notice: "Auto ei leidnud"
                            })
                        } else {
                            let totalWeight = 0
                            sqlRes2.forEach(function(item) {
                                totalWeight += (item.weight_in - item.weight_out)
                            })
                            res.render("summary", {
                                loads: sqlRes2,
                                sumWeight: totalWeight
                            })
                        }
                    }
                })
            }
        }
    })
})

// Route for adding a new truck load (POST request)
app.post('/addLoad', (req, res) => {
  const { autoNumber, entranceWeight, exitWeight } = req.body;

  // Query to insert the truck load data into the 'truck_data' table
  const query = 'INSERT INTO viljavedu (truck, weight_in, weight_out) VALUES (?, ?, ?)';
  db.query(query, [autoNumber, entranceWeight, exitWeight], (err, result) => {
    if (err) {
      console.error('Error inserting data: ', err);
      res.status(500).send('Database error');
      return;
    }
    // Redirect to the summary page after successfully inserting the data
    res.redirect('/summary');
  });
});

// Start the server and listen on port 5151
app.listen(5151, () => {
  console.log('Server running on http://localhost:5151');
});