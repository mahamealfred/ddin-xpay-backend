const dotenv = require("dotenv")
const axios = require("axios");
const generateAccessToken = require("../Utils/generateToken.js");
const ddinAirtimePaymentService = require("../services/airtimeService.js");
const checkTansactionStatus = require("../Utils/checkEfasheTransactionStatus.js");
const { logsData } = require("../Utils/logsData.js");
const airtimePaymentService = require("../services/airtimeService.js");
const ddinStartimePaymentService = require("../services/startimeService.js");

dotenv.config();

class StartimeController {


  static async  ddinStartimePayment(req,res){
    
    const { amount, trxId,transferTypeId, toMemberId,clientPhone, description, currencySymbol, phoneNumber } = req.body;
    const authheader = req.headers.authorization;
    const authHeaderValue = authheader.split(' ')[1];
       const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
       const agent_name=decodedValue.split(':')[0]
       const service_name="Startime"
    let data = JSON.stringify({
      "toMemberId": `${toMemberId}`,
      "amount": `${amount}`,
      "transferTypeId": `${transferTypeId}`,
      "currencySymbol": currencySymbol,
      "description": description,
      "customValues":[{
      "internalName" : "trans_id",
        "fieldId" : "85",
        "value" : trxId
         },
         {
          "internalName" : "net_amount",
          "fieldId" : "87",
          "value" : amount
          },
          {
            "internalName" : "clientphone",
            "fieldId" : "90",
            "value" : clientPhone
          }
        
        ]
  
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
      const response = await axios.request(config);
      if (response.status === 200){
       //call third part
       await ddinStartimePaymentService(req, res, response, amount, description, trxId,phoneNumber,clientPhone,service_name,agent_name)
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
  
  

  
 
  static async ValidateStartimeNumber(req, res) {
    const accessToken = await generateAccessToken();
    const {customerAccountNumber} = req.body

    if (!accessToken) {
      return res.status(401).json({
        responseCode: 401,
        communicationStatus: "FAILED",
        responseDescription: "A Token is required for authentication"
      });
    }
    // console.log("accesst:",accessToken.replace(/['"]+/g, ''))
    let data = JSON.stringify({
      verticalId: "paytv",
      customerAccountNumber: customerAccountNumber
    }
    );
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.EFASHE_URL + '/rw/v2/vend/validate',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.replace(/['"]+/g, '')}`
      },
      data: data
    };

    try {
      const response = await axios.request(config)

      if (response.status === 200) {
        return res.status(200).json({
          responseCode: 200,
          communicationStatus: "SUCCESS",
          responseDescription: "SUCCESS-EFASHE Customer Details",
          data: {
            pdtId: response.data.data.pdtId,
            pdtName: response.data.data.pdtName,
            pdtStatusId: response.data.data.pdtStatusId,
            verticalId: response.data.data.verticalId,
            customerAccountNumber: response.data.data.customerAccountNumber,
            svcProviderName: response.data.data.svcProviderName,
            vendUnitId: response.data.data.vendUnitId,
            vendMin: response.data.data.vendMin,
            vendMax: response.data.data.vendMax,
            selectAmount: response.data.data.selectAmount,
            localStockMgt: response.data.data.localStockMgt,
            stockedPdts: response.data.data.stockedPdts,
            stock: response.data.data.stock,
            trxResult: response.data.data.trxResult,
            trxId: response.data.data.trxId,
            availTrxBalance: response.data.data.availTrxBalance
          }

        });
      }
      return res.status(500).json({
        responseCode: 500,
        communicationStatus: "FAILED",
        responseDescription: "Dear client, we're unable to complete your transaction right now. Please try again later.",
      });

    } catch (error) {
      if (error.response.status === 404) {
        return res.status(404).json({
          responseCode: 404,
          communicationStatus: "FAILED",
          responseDescription: " Not Found"
        });
      }
      if (error.response.status === 422) {
        return res.status(422).json({
          responseCode: 422,
          communicationStatus: "FAILED",
          responseDescription: error.response.data.msg
        });
      }
      if (error.response.status === 400) {
        return res.status(400).json({
          responseCode: 400,
          communicationStatus: "FAILED",
          responseDescription: error.response.data.msg
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
module.exports = StartimeController;