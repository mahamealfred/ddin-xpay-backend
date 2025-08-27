const dotenv = require("dotenv")
const axios = require("axios");
const generateAccessToken = require("../Utils/generateToken.js");
const dbConnect = require("../db/config.js");
const { logsData } = require("../Utils/logsData.js");
const Chargeback = require("../Utils/chargback.js");
const generateSMSToken = require("../Utils/generateSMSToken.js");
const { uuid } = require('uuidv4');



dotenv.config();


//best for  pindo single sms
const singleSmsByPindoPaymentService = async (req, res, response, amount, recipient, description, senderId, smsMessage,service_name,agent_name) => {

  let data = JSON.stringify({
    "sender": senderId,
    "text": smsMessage,
    "to": recipient
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.pindo.io/v1/sms/',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4NTA4OTc1NTgsImlhdCI6MTc1NjIwMzE1OCwiaWQiOiI3NTEiLCJyZXZva2VkX3Rva2VuX2NvdW50Ijo3fQ.15LsZWJSl2hkHqumYkTKmBGM0_i_-6ttI1ZwMPSMGRWMt0fLVtPwt3bun_59kf2iqHnNR3-5gjju0swph0c9tA'
    },
    data: data
  };

  try {
    const resp = await axios.request(config)
    if (resp.status === 201) {
      //call database Table
      let transactionId=response.data.id
      let thirdpart_status=resp.status
      
      let trxId=""
      let status="Complete"
     logsData(transactionId,thirdpart_status,description,amount,agent_name,status,service_name,trxId)
      // console.log("response from cyclos:",response)
      return res.status(200).json({
        responseCode: 200,
        communicationStatus: resp.data.status,
        responseDescription: "Your message has been sent successfully! Thank you for using DDIN.",
        data: {
          transactionId: response.data.id,
          amount: amount
        }
      });
    }

  } catch (error) {
    let transactionId=response.data.id
    let thirdpart_status=error.response.status
    
    let trxId=""
    let status="Incomplete"
   logsData(transactionId,thirdpart_status,description,amount,agent_name,status,service_name,trxId)
   Chargeback(transactionId)
    if (error.response.status === 400) {
      return res.status(400).json({
        responseCode: 400,
        communicationStatus: "FAILED",
        responseDescription: error.response.data.message
      });
    }
    if (error.response.status === 401) {
      return res.status(401).json({
        responseCode: 401,
        communicationStatus: "FAILED",
        responseDescription: error.response.data.message

      });
    }
    if (error.response.status === 409) {
        console.log("eoor:",error.response)
      return res.status(409).json({
        responseCode: 409,
        communicationStatus: "FAILED",
        responseDescription: "Unknown sender Id"

      });
    }
    return res.status(500).json({
      responseCode: 500,
      communicationStatus: "FAILED",
      error: "Dear client, We're unable to complete your transaction right now. Please try again later"
    });
  }
};

//best for  pindo single sms
const singleSmsByFdiPaymentService = async (req, res, response, amount, recipient, description, senderId, smsMessage,service_name,agent_name) => {
  const uniqueId = uuid();
  const accessToken = await generateSMSToken();
  if (!accessToken) {
    return res.status(401).json({
      responseCode: 401,
      communicationStatus: "FAILED",
      responseDescription: "A Token is required for authentication"
    });
  }
  let data = JSON.stringify({
    "msisdn": recipient,
    "message": smsMessage,
    "msgRef": uniqueId,
    "sender_id": senderId
    
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://messaging.fdibiz.com/api/v1/mt/single',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken.replace(/['"]+/g, '')}`
    },
    data: data
  };

  try {
    const resp = await axios.request(config)
    if (resp.status === 200) {
      //call database Table
      let transactionId=response.data.id
      let thirdpart_status=resp.data.success
      
      let trxId=""
      let status="Complete"
     logsData(transactionId,thirdpart_status,description,amount,agent_name,status,service_name,trxId)
      // console.log("response from cyclos:",response)
      return res.status(200).json({
        responseCode: 200,
        communicationStatus: resp.data.status,
        responseDescription: "Your message has been sent successfully! Thank you for using DDIN.",
        data: {
          transactionId: response.data.id,
          amount: amount
        }
      });
    }

  } catch (error) {
    let transactionId=response.data.id
    let thirdpart_status=error.response.status
    
    let trxId=""
    let status="Incomplete"
   logsData(transactionId,thirdpart_status,description,amount,agent_name,status,service_name,trxId)
   Chargeback(transactionId)
    if (error.response.status === 400) {
      return res.status(400).json({
        responseCode: 400,
        communicationStatus: "FAILED",
        responseDescription: error.response.data.message
      });
    }
    if (error.response.status === 401) {
      return res.status(401).json({
        responseCode: 401,
        communicationStatus: "FAILED",
        responseDescription: error.response.data.message

      });
    }
    if (error.response.status === 409) {
        console.log("eoor:",error.response)
      return res.status(409).json({
        responseCode: 409,
        communicationStatus: "FAILED",
        responseDescription: "Unknown sender Id"

      });
    }
    return res.status(500).json({
      responseCode: 500,
      communicationStatus: "FAILED",
      error: "Dear client, We're unable to complete your transaction right now. Please try again later"
    });
  }
};




module.exports = {singleSmsByPindoPaymentService,singleSmsByFdiPaymentService}