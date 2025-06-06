const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const hbs = require('hbs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const session = require('express-session');
const methodOverride = require('method-override');





const app = express();

// Setup MySQL connection
const db = mysql.createConnection({
 host: 'localhost',
 user: 'root',
 password: '',
 database: 'turf'
});

db.connect((err) => {
 if (err) throw err;
 console.log('MySQL Connected...');
});

//middlewaRE
app.use(session({
   secret: 'your-secret-key',
   resave: false,
   saveUninitialized: false
 }));

// Setup HBS as the view engine
app.set('view engine', 'hbs');

// Setup body-parser
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(methodOverride('_method'));

// Include your HBS views
hbs.registerPartials(__dirname + '/views');

// Routes
app.get('/', (req, res) => {
    res.render('turfs');
   });

app.get('/login', (req, res) => {
 res.render('login');
});
app.get('/adlogin', (req, res) => {
   res.render('adlogin');
  });

app.get('/register', (req, res) => {
 res.render('register');
});
app.get('/registerad', (req, res) => {
   res.render('registerad');
  });



app.post('/registerss', upload.single('fileInput'), (req, res) => {
   let username = req.body.username;
   let password = req.body.password;
   let phonenumber = req.body.phonenumber;
   let profile_image = req.file ? req.file.filename : null;

   // Check if the username already exists
   let checkUsernameQuery = 'SELECT * FROM users WHERE username = ?';
   db.query(checkUsernameQuery, [username], (checkUsernameErr, checkUsernameResult) => {
       if (checkUsernameErr) throw checkUsernameErr;

       if (checkUsernameResult.length > 0) {
           res.send('Username already taken. Please choose another one.');
       } else {
           // Username is unique, proceed with registration

           // Insert the new user into the database
           let registerQuery = 'INSERT INTO users (username, password, phonenumber, profile_image) VALUES (?, ?, ?, ?)';
           db.query(registerQuery, [username, password, phonenumber, profile_image], (registerErr, registerResult) => {
               if (registerErr) throw registerErr;
               res.redirect('/login');
           });
       }
   });
});





app.post('/registerad', upload.single('fileInput'), (req, res) => {
   let username = req.body.username;
   let password = req.body.password;
   let phonenumber = req.body.phonenumber;
   let profile_image = req.file ? req.file.filename : null;

   // Check if the username already exists
   let checkUsernameQuery = 'SELECT * FROM admin WHERE username = ?';
   db.query(checkUsernameQuery, [username], (checkUsernameErr, checkUsernameResult) => {
       if (checkUsernameErr) throw checkUsernameErr;

       if (checkUsernameResult.length > 0) {
           res.send('Username already taken. Please choose another one.');
       } else {
           // Username is unique, proceed with registration

           // Insert the new user into the database
           let registerQuery = 'INSERT INTO admin (username, password, phonenumber, profile_image) VALUES (?, ?, ?, ?)';
           db.query(registerQuery, [username, password, phonenumber, profile_image], (registerErr, registerResult) => {
               if (registerErr) throw registerErr;
               res.redirect('/adlogin');
           });
       }
   });
});

//---------------------------------------user------------------------------------------


app.post('/loginss', (req, res) => {
   const username = req.body.username;
   const password = req.body.password;
   const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
 
   db.query(sql, [username, password], (err, result) => {
     if (err) throw err;
     if (result.length > 0) {
       // Store the user data in the session
       req.session.loggedin = true;
       req.session.userDatas = result[0];
 
       res.redirect('/dashboard');
     } else {
       res.send('Incorrect Username and/or Password!');
     }
   });
 });
 

 app.get('/dashboard', (req, res) => {
  


  // Check if the user is logged in
  if (req.session.loggedin) {

    let sqal = 'SELECT * FROM booking WHERE username = ?';
    let sql = 'SELECT * FROM post';

    // Check if a search query is provided
    if (req.query.search) {
      const searchTerm = req.query.search;
      // Modify the SQL query to include search conditions for title, content, username, and location
      sql = `SELECT * FROM post 
             WHERE name LIKE '%${searchTerm}%' OR 
                   location LIKE '%${searchTerm}%'`;
    }

    // Fetch posts from the database
    db.query(sql, (err, posts) => {
      if (err) {
        console.error('Error fetching posts:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      
       db.query(sqal, [req.session.userDatas.username], (err, bookingData) => {
        if (err) {
          console.error('Error fetching booking data:', err);
          res.status(500).send('Internal Server Error');
          return;
        }

        // Render the dashboard and pass the entire user data, posts, and booking data to the view
        res.render('dashboard', { userDatas: req.session.userDatas, posts: posts, bookingData: bookingData });
      });
    });
  } else {
    // Redirect to the login page if the user is not logged in
    res.redirect('/login');
  }
});

app.get('/book/:postId', (req, res) => {

  const postId = req.params.postId;
  if (req.session.loggedin) {
    // Access user data from the session
    const userDatas = req.session.userDatas;
  // Fetch the specific post from the database using the postId
  db.query('SELECT * FROM post WHERE id = ?', [postId], (err, post) => {
    if (err) {
      console.error('Error fetching post:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    

    // Render the booking page and pass both user data and post data to the view
    res.render('book', { userDatas: req.session.userDatas, post: post[0] }); // Assuming you have a 'book' view
  });
} else {
  // Redirect to the login page if the user is not logged in
  res.redirect('/login');
}
});


//------------------------------------------admin-------------------------------------------

app.post('/loginad', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const sql = 'SELECT * FROM admin WHERE username = ? AND password = ?';

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Error in login:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (result.length > 0) {
      req.session.loggedin = true;
      req.session.userData = result[0];
      res.redirect('/dashboardad');
    } else {
      res.send('Incorrect Username and/or Password!');
    }
  });
});

app.get('/dashboardad', (req, res) => {
  if (req.session.loggedin) {
    let skil = 'SELECT * FROM post WHERE username = ?';
    const sqal = 'SELECT * FROM booking  WHERE owner = ?';
    const ub = req.session.userData.username;
    console.log('Username:', ub);

    db.query(sqal, [ub], (err, bookingData) => {
      if (err) {
        console.error('Error fetching booking data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      db.query(skil, [ub], (err, mypost) => {
        if (err) {
          console.error('Error fetching booking data:', err);
          res.status(500).send('Internal Server Error');
          return;
        }
      

      // Print userData
     // console.log('User Data:', req.session.userData);//

      res.render('dashboardad', { userData: req.session.userData, bookingData: bookingData ,post :mypost});
    });
  });
  } else {
    res.redirect('/adlogin');
  }
});



 //---------------------------------------------------------------
//----------------posts----------------------------------------------
//------------------------------------------------------------------



 // CREATE new post
 app.post('/post', (req, res) => {
  let post = req.body;
  let sql = 'INSERT INTO post SET ?';
  let query = db.query(sql, post, (err, result) => {
     if (err) throw err;
     res.send('Post created...');
  });
 });
 
// UPDATE a post
app.post('/update/:id', (req, res) => {
  const postId = req.params.id;
  const { name, description, location, price, hours } = req.body;

  const updateQuery = `
    UPDATE post
    SET name = ?, description = ?, location = ?, price = ?, hours = ?
    WHERE id = ?;
  `;

  db.query(updateQuery, [name, description, location, price, hours, postId], (err, result) => {
    if (err) {
      console.error('Error updating post:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/dashboardad'); // Redirect to the dashboard or wherever you want after update
    }
  });
});

// Delete a post (DELETE request)
app.post('/delete/:id', (req, res) => {
  const postId = req.params.id;

  const deleteQuery = 'DELETE FROM post WHERE id = ?';

  db.query(deleteQuery, [postId], (err, result) => {
    if (err) {
      console.error('Error deleting post:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/dashboardad'); // Redirect to the dashboard or wherever you want after delete
    }
  });
});







 //--------------------------post--------end-------------------------------








//===================booking=============================









app.post('/book/confirm-booking', (req, res) => {
  // Extract data from the request body
  const bookingData = {
    username: req.body.username,
    turfname: req.body.name,
    turfid: req.body.number,
    booking_date: req.body.date,
    booking_time: req.body.time,
    num_of_players: req.body.players,
    owner:req.body.owner
  };

  // SQL query to check if the slot is already booked
  const checkAvailabilitySql = `
    SELECT * FROM booking 
    WHERE turfid = ? 
      AND booking_date = ? 
      AND booking_time = ?;
  `;

  // Values for the checkAvailability query
  const checkAvailabilityValues = [
    bookingData.turfid,
    bookingData.booking_date,
    bookingData.booking_time
  ];

  // Execute the SQL query to check for existing bookings
  db.query(checkAvailabilitySql, checkAvailabilityValues, (availabilityErr, availabilityResult) => {
    if (availabilityErr) {
      // Handle database error while checking availability
      console.error('Error checking availability:', availabilityErr);
      res.status(500).send('Internal Server Error');
    } else if (availabilityResult.length > 0) {
      // If there is already a booking for the specified date and time, send a message
      res.status(409).send('This slot is already booked. Please choose a different date or time.');
    } else {
      console.log('Availability SQL Query:', checkAvailabilitySql);
console.log('Availability Values:', checkAvailabilityValues);
console.log('Availability Result:', availabilityResult);

      // No existing booking, proceed with the new booking
      // SQL query to insert data into the 'booking' table
      const insertBookingSql = `
        INSERT INTO booking
        (username, turfname, turfid, booking_date, booking_time, num_of_players, owner ,created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      // Values to be inserted into the insertBooking query
      const insertBookingValues = [
        bookingData.username,
        bookingData.turfname,
        bookingData.turfid,
        bookingData.booking_date,
        bookingData.booking_time,
        bookingData.num_of_players,
        bookingData.owner
      ];

      // Execute the SQL query to insert data into the database
      db.query(insertBookingSql, insertBookingValues, (insertErr, insertResult) => {
        if (insertErr) {
          // Handle database error during insertion
          console.error('Error inserting data:', insertErr);
          res.status(500).send('Internal Server Error');
        } else {
          // Fetch the inserted data from the database
          const confirmationSql = 'SELECT * FROM booking WHERE id = ?';
          const confirmationValues = [insertResult.insertId]; // Assuming your primary key column is named 'id'

          // Execute the SQL query to fetch confirmation data
          db.query(confirmationSql, confirmationValues, (confirmationErr, confirmationResult) => {
            if (confirmationErr) {
              // Handle database error while fetching confirmation data
              console.error('Error fetching confirmation data:', confirmationErr);
              res.status(500).send('Internal Server Error');
            } else {
              // Render the confirmation page with the fetched data
              res.render('bok', { bookingData: confirmationResult[0] });
            }
          });
        }
      });
    }
  });
});






























 
app.get('/logout', (req, res) => {
 req.session.destroy();
 res.redirect('/');
});

// Start server
app.listen(3000, () => {
 console.log('Server started on port 3000');
});