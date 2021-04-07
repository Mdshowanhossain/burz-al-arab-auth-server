const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser')
const admin = require("firebase-admin");
const cors = require('cors');
require('dotenv').config()
// console.log(process.env.DB_PASS)


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.buk2o.mongodb.net/arabian-hotel?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const port = 5000


const app = express()

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./burj-al-arab-hotel-37da4-firebase-adminsdk-fsbum-e1f3b55e8b.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.get('/', (req, res) => {
    res.send('Burj-al-arab server running!')
})


client.connect(err => {
    const bookingsCollection = client.db("arabian-hotel").collection("bookings");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookingsCollection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertCountedCount > 0);
            })
        console.log(newBooking);
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });

            console.log(req.headers.authorization);
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        bookingsCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(404).send('unAuthorized access')
                    }

                })
                .catch((error) => {
                    res.status(404).send('unAuthorized access')
                });

        }
        else {
            res.status(404).send('unAuthorized access')
        }

    })

});





app.listen(port)