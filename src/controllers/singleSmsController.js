const dotenv =require("dotenv")
const axios =require("axios");
const singleSmsPaymentService = require("../services/singleSmsService.js");
dotenv.config();

class singleSmsController{

  static async  ddinPindoSingleSmsPayment(req,res){
    const {amount,recipient,transferTypeId,toMemberId,senderId,smsMessage,currencySymbol}=req.body;
    const authheader = req.headers.authorization;
    const authHeaderValue = authheader.split(' ')[1]; // Extracting the value after 'Basic ' or 'Bearer '
       const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
       const agent_name=decodedValue.split(':')[0]
       const service_name="Pindo Single SMS"
      let description=`Bulk SMS Vending TX by:${agent_name},Total Recipient:1, and Total Paid amount:15`
    let data = JSON.stringify({
      "toMemberId": `${toMemberId}`,
      "amount": '15',
      "transferTypeId": `${transferTypeId}`,
      "currencySymbol": currencySymbol,
      "description": description
  
    });
  
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.CORE_URL+'/rest/payments/confirmMemberPayment',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${authheader}`
      },
      data: data
    };
  
    try {
      const response = await axios.request(config)
      if (response.status === 200){
       //call logs table
       await singleSmsPaymentService.singleSmsByPindoPaymentService(req, res, response, amount, recipient, description, senderId, smsMessage,service_name,agent_name)
      }
    } catch (error) {
  
      if (error.response.status === 401) {
        return res.status(401).json({
          responseCode: 401,
          communicationStatus: "FAILED",
          responseDescription: "Username and Password are required for authentication"
        });
      }
      if (error.response.status === 400) {
        return res.status(400).json({
          responseCode: 400,
          communicationStatus: "FAILED",
          responseDescription: "Invalid Username or Password"
        });
      }
      if (error.response.status === 404) {
        return res.status(404).json({
          responseCode: 404,
          communicationStatus: "FAILED",
          responseDescription: "Account Not Found"
        });
      }
      return res.status(500).json({
        responseCode: 500,
        communicationStatus: "FAILED",
        error: "Dear client, we're unable to complete your transaction right now. Please try again later.",
      });
    }
  
  }

  static async  ddinFdiSingleSmsPayment(req,res){
    const {amount,recipient,transferTypeId,toMemberId,senderId,smsMessage,currencySymbol}=req.body;
    const authheader = req.headers.authorization;
    const authHeaderValue = authheader.split(' ')[1]; // Extracting the value after 'Basic ' or 'Bearer '
       const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
       const agent_name=decodedValue.split(':')[0]
       const service_name="FDI Single SMS"
       const description="FDI Single SMS service"
    let data = JSON.stringify({
      "toMemberId": `${toMemberId}`,
      "amount": '15',
      "transferTypeId": `${transferTypeId}`,
      "currencySymbol": currencySymbol,
      "description": description
  
    });
  
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.CORE_URL+'/rest/payments/confirmMemberPayment',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${authheader}`
      },
      data: data
    };
  
    try {
      const response = await axios.request(config)
      if (response.status === 200){
       //call logs table
       await singleSmsPaymentService.singleSmsByFdiPaymentService(req, res, response, amount, recipient, description, senderId, smsMessage,service_name,agent_name)
      }
    } catch (error) {
  
      if (error.response.status === 401) {
        return res.status(401).json({
          responseCode: 401,
          communicationStatus: "FAILED",
          responseDescription: "Username and Password are required for authentication"
        });
      }
      if (error.response.status === 400) {
        return res.status(400).json({
          responseCode: 400,
          communicationStatus: "FAILED",
          responseDescription: "Invalid Username or Password"
        });
      }
      if (error.response.status === 404) {
        return res.status(404).json({
          responseCode: 404,
          communicationStatus: "FAILED",
          responseDescription: "Account Not Found"
        });
      }
      return res.status(500).json({
        responseCode: 500,
        communicationStatus: "FAILED",
        error: "Dear client, we're unable to complete your transaction right now. Please try again later.",
      });
    }
  
  }

}
module.exports= singleSmsController;