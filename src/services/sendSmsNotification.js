const dotenv = require("dotenv")
const axios = require("axios");
dotenv.config();




const smsNotification= async (req,res) => {
    const {description}=req.body;
    // const authheader = req.headers.authorization;
    const username = 'smarta';
    const password = 'uat@123';

// Encode the username and password in Base64
const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

 
    let data = JSON.stringify({
      "toMemberId": "17",
      "amount": "10",
      "transferTypeId": "47",
      "currencySymbol": "Rwf",
      "description": description
  
    });
  
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.CORE_URL+'/rest/payments/confirmMemberPayment',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth
      },
      data: data
    };
  
    try {
      const response = await axios.request(config)
      if (response.status === 200){
        console.log("Success for sms:",response)
      //call send notification 
      sendSmsNotification(req,res)
    }
    } catch (error) {
        console.log("error for sms:",error)
  
    }
  
  }


const sendSmsNotification= async (req,res) => {
    const {address,firstName}=req.body
let smsMessage=`Dear ${firstName}, your EpoBox account has been successfully created. Thank you for choosing EpxBox!`
let data = JSON.stringify({
  "to": address,
  "text":smsMessage,
  "sender": "ePoBox"
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://api.pindo.io/v1/sms/',
  headers: { 
    'Content-Type': 'application/json', 
     'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJpZCI6Ijc1MSIsInJldm9rZWRfdG9rZW5fY291bnQiOjYsImlhdCI6MTcyODcyODM5MiwiZXhwIjoxODIzMzM2MzkyfQ.Q7qqV9fNGwdyCAtfz6aulK7YCKqwFMBwgq-V2hKrxwJJj5S0n6OOG8mTPBHdIggO994V3H3PLKZeI54R1QGysQ'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});

}

module.exports = smsNotification