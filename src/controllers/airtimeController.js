const dotenv = require("dotenv")
const axios = require("axios");
const mysql =require("mysql2");
const generateAccessToken = require("../Utils/generateToken.js");
const ddinAirtimePaymentService = require("../services/airtimeService.js");
const checkTansactionStatus = require("../Utils/checkEfasheTransactionStatus.js");
const { logsData, insertInBulkServicePayment } = require("../Utils/logsData.js");
const airtimePaymentService = require("../services/airtimeService.js");
const bulkAirtimePaymentService = require("../services/bulkAirtimeService.js");

dotenv.config();

class AirtimeController {


  static async  ddinAirtimePayment(req,res){
    const { amount, trxId,transferTypeId, toMemberId, description, currencySymbol, phoneNumber,clientPhone } = req.body;
    const authheader = req.headers.authorization;
    const authHeaderValue = authheader.split(' ')[1];
       const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
       const agent_name=decodedValue.split(':')[0]
       const service_name="Airtime"
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
      const response = await axios.request(config)
      if (response.status === 200){
       //call third part
     await airtimePaymentService(req, res, response, amount, description, trxId,phoneNumber,service_name,agent_name)
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
        error:"Dear client, we're unable to complete your transaction right now. Please try again later."+ error,
      });
    }
  
  }
 
// Bulk Airtime service
static async ddinBulkAirtimePayment(req, res) {
  const { transferTypeId, toMemberId, currencySymbol,clientPhone, details } = req.body;
  const authheader = req.headers.authorization;
  const authHeaderValue = authheader.split(' ')[1];
  const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
  const agent_name = decodedValue.split(':')[0];
  const service_name = "Bulk Airtime";

  let successCount = 0;
  let failureCount = 0;
  let results = [];
  let totalAmount = 0;

  for (const detail of details) {
    let data = JSON.stringify({
      "toMemberId": `${toMemberId}`,
      "amount": `${detail.amount}`,
      "transferTypeId": `${transferTypeId}`,
      "currencySymbol": currencySymbol,
      "description": detail.description,
      "customValues": [
        {
          "internalName": "trans_id",
          "fieldId": "85",
          "value": detail.trxId
        },
        {
          "internalName": "net_amount",
          "fieldId": "87",
          "value": detail.amount
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
      url: process.env.CORE_URL + '/rest/payments/confirmMemberPayment',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${authheader}`
      },
      data: data
    };

    try {
      const response = await axios.request(config);
      if (response.status === 200) {
        const airtimeResponse = await bulkAirtimePaymentService(
          req, 
          response, 
          detail.amount, 
          detail.description, 
          detail.trxId, 
          detail.phoneNumber, 
          service_name, 
          agent_name
        );
        if (airtimeResponse.responseCode === 200) {
          successCount++;
          totalAmount += parseFloat(detail.amount);
          results.push({
            trxId: detail.trxId,
            transactionId: response.data.id,
            status: 'success',
            data: airtimeResponse.data
          });
        } else {
          failureCount++;
          results.push({
            trxId: detail.trxId,
            status: 'failed',
            error: airtimeResponse.responseDescription
          });
        }
      }
    } catch (error) {
      failureCount++;
      let errorMessage = "An error occurred";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Username and Password are required for authentication";
        } else if (error.response.status === 400) {
          console.log("error:",error.response)
          errorMessage = "Invalid Username or Password";
        } else if (error.response.status === 404) {
          errorMessage = "Account Not Found";
        }
      }
      results.push({
        trxId: detail.trxId,
        status: 'failed',
        error: errorMessage,
        detailedError: error.message
      });
    }
  }

  const finalResponse = {
    responseCode: 200,
    communicationStatus: "completed",
    responseDescription: `Dear Customer,

Your bulk airtime transaction of ${totalAmount} Rwf has been successfully processed. Success Count: ${successCount}, Failure Count: ${failureCount}. Thank you for using our service!

If you'd like to print a receipt, please navigate to "View All Transactions" and select the option to print the receipt.`,
    successCount: successCount,
    failureCount: failureCount,
    amount:totalAmount,
    results: results
  };

  finalResponse.results = finalResponse.results.map(result => {
    result.status = result.status.slice(0, 255);
    if (result.error) {
      result.error = result.error.slice(0, 255);
    }
    if (result.detailedError) {
      result.detailedError = result.detailedError.slice(0, 255);
    }
    return result;
  });

  const description = JSON.stringify(finalResponse.results);
  const status = finalResponse.responseCode;

  await insertInBulkServicePayment(service_name, agent_name, totalAmount, successCount, failureCount, description, status);
if(successCount>0){
  return res.status(200).json(finalResponse);
}
return res.status(400).json({
    responseCode: 400,
    communicationStatus: "Failed",
    responseDescription: "Transaction Failed, Please try again Later",
    successCount: successCount,
    failureCount: failureCount,
});
 
}

  //previous 
  static async airTimePayment(req, res) {
    const { amount, trxId,transferTypeId, toMemberId, description, currencySymbol, phoneNumber } = req.body;
    const authheader = req.headers.authorization;
    //agent name
    const authHeaderValue = authheader.split(' ')[1];
    const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
    const agent_name = decodedValue.split(':')[0]
    const accessToken = await generateAccessToken();
    if (!accessToken) {
      return res.status(401).json({
        responseCode: 401,
        communicationStatus: "FAILED",
        responseDescription: "A Token is required for authentication"
      });
    }
    let data = JSON.stringify({
      trxId: trxId,
      customerAccountNumber: phoneNumber,
      amount: amount,
      verticalId: "airtime",
      deliveryMethodId: "direct_topup",
      deliverTo: "string",
      callBack: "string"
    }
    );
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.EFASHE_URL + '/rw/v2/vend/execute',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.replace(/['"]+/g, '')}`
      },
      data: data
    };

    try {
      const resp = await axios.request(config)
      if (resp.status === 202) {
      //   //save in logs table
        const transactionId = ""
       const thirdpart_status = resp.status
        const service_name = "Airtime"
        const status = "Incomplete"
        logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId)
        ddinAirtimePaymentService(req, res, resp, amount, trxId, transferTypeId, toMemberId, description, currencySymbol, phoneNumber, authheader)
      
      }

    } catch (error) {
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
        error: "Dear client, we're unable to complete your transaction right now. Please try again later."
      });
    }
  }

 
  static async ValidatePhoneNumber(req, res) {
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
      verticalId: "airtime",
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
module.exports = AirtimeController;