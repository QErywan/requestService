const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
var http = require('http');
var fs = require('fs');

const PORT=3001; 

fs.readFile('./index.html', function (err, html) {

    if (err) throw err;    

    http.createServer(function(request, response) {  
        response.writeHeader(200, {"Content-Type": "text/html"});  
        response.write(html);  
        response.end();  
    }).listen(PORT);
});

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const connectionOptions = {
  host: 'db-mysql-lon1-35846-do-user-13649543-0.b.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_NkqBXMuwtBbVrzqhnGF',
  database: 'defaultdb',
  ssl: {
    mode: 'REQUIRED',
    rejectUnauthorized: false
  }
};

async function createRequest(requestTitle, requestDescription, requestDate, requestStatus, requestRecipient) {
  const connection = await mysql.createConnection(connectionOptions);

  // Get the next available Request_ID
  const [rows, fields] = await connection.execute('SELECT MAX(Request_ID) AS max_id FROM Request');
  const nextRequestId = rows[0].max_id + 1;

  const sql = `
    INSERT INTO Request (Request_ID, Request_Title, Request_Description, Request_Date, Request_Status, Request_Recipient)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [nextRequestId, requestTitle, requestDescription, requestDate, requestStatus, requestRecipient];

  await connection.execute(sql, values);

  connection.end();
}

async function createDonation(donationAmount, donationDate, donorName, donorEmail, donationRequestId) {
  const connection = await mysql.createConnection(connectionOptions);

  // Get the next available Donation_ID
  const [rows, fields] = await connection.execute('SELECT MAX(Donation_ID) AS max_id FROM Donations');
  const nextDonationId = rows[0].max_id + 1;

  const sql = `
    INSERT INTO Donations (Donation_ID, Donation_Amount, Donation_Date, Donor_Name, Donor_Email, Donation_Request_ID)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [nextDonationId, donationAmount, donationDate, donorName, donorEmail, donationRequestId];

  await connection.execute(sql, values);

  connection.end();
}

app.post('/create-request', async (req, res) => {
  const { requestTitle, requestDescription, requestDate, requestStatus, requestRecipient } = req.body;
  try {
    await createRequest(requestTitle, requestDescription, requestDate, requestStatus, requestRecipient);
    res.send('Request created successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while creating the request.');
  }
});

app.post('/create-donation', async (req, res) => {
  const { donationAmount, donationDate, donorName, donorEmail, donationRequestId } = req.body;
  try {
    await createDonation(donationAmount, donationDate, donorName, donorEmail, donationRequestId);
    res.send('Donation created successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while creating the donation.');
  }
});

app.use(express.static('public'));
