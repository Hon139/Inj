const express = require('express');
const cors = require('cors');
require('dotenv').config()
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5000;
const User = require('./models/quizzes');
const Cart = require('./models/carts');
const Quiz = require('./models/quizzes');
// import axios from 'axios';



mongoose.connect(process.env.URI)
  .then((result)=> app.listen(PORT))
  .catch((err)=> console.log("FAILED TO CONNECT"));
  


// Middleware
app.use(cors()); // Allow requests from the client
app.use(express.json()); // To parse JSON request bodies

// // Routes
async function getUser(UserName){
  const user = await User.findOne({userName: UserName});
  return user;
}


async function appendUser(){
  const user = await User.create({
    name: "Andrew Yang",
    bal: "20",
    deposit: "5",
    password: "hello",
    userId: "222222",
    userName: "AndrewY",
    karmaPoints: 5,
    penaltyPoints: 10,
    cartsSaved: 20,
    cartsReturned: 30,
    cartsNotReturned: 0,
    totalCartsSignedOut: 60,
  })
  await user.save()

  console.log(user);
}

async function appendCart(){
  const user = await Cart.create({
    cartId: "20224",
    numberOfUses: 0,
    status: "A", // A = Available, U = Unavailable
  })
  await user.save()

  console.log(user);
}


app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

// Define a route with cartId parameter
// should we make it send you to /scan/:cardId or should we keep it as /home/




app.get('/api/home/', async (req, res) => {
  const {cardId, userName} = req.query; // Access the parameter value
  
  const options = {
    projection: {userName: userName}
  }

  // Try mongoDB call to grab userId using userName
  try {
    const findResult = await getUser(userName);
    if(findResult != null) {
      console.log(findResult);
      // make the contract
    }

    res.status(200).json(findResult); // Send the result back to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }

  // Now that you grab the userId, you can make a contract
  // should be a post request
  
  // this is the response you are sending back (basically return in C#)
  // THIS LINE OF CODE WORKS WITH OLD FRONTEND
  //res.json(`Cart ID is: ${cardId}`);

  // get user id then build contract

});


app.get('/api/profile/', async (req, res) => {
  const {userName} = req.query; // Access the parameter value
  
  console.log(req.query)
  const options = {
    projection: {userName: userName}
  }

  // Try mongoDB call to grab userId using userName
  try {
    const findResult = await getUser(userName);
    if(findResult != null) {
      console.log(findResult);
      // make the contract
    }

    res.status(200).json(findResult); // Send the result back to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }

  // Now that you grab the userId, you can make a contract
  // should be a post request
  
  // this is the response you are sending back (basically return in C#)
  // THIS LINE OF CODE WORKS WITH OLD FRONTEND
  // res.send(`Cart ID is: ${cardId}`);

  // get user id then build contract

});

// Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });