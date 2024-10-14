const dotenv = require("dotenv")
const axios = require("axios");
const generateAccessToken = require("../Utils/generateToken.js");
const { updateLogs, logsData } = require("../Utils/logsData.js");
const { response } = require("express");
const callPollEndpoint = require("../Utils/checkEfasheTransactionStatus.js");

dotenv.config();
//new methode
const ddinElectricityPaymentServiceNewMethod = async (
  req, res, resp, amount, toMemberId, trxId, phoneNumber,clientPhone, transferTypeId, currencySymbol, description, agent_name, service_name
) => {
  const authheader = req.headers.authorization;
  let status = "Incomplete";
  while (true) {
    const responseData = await callPollEndpoint(resp,trxId);
    let thirdpart_status = responseData.data.data.trxStatusId;
    if (thirdpart_status === "successful") {
      let data = JSON.stringify({
        "toMemberId": `${toMemberId}`,
        "amount": `${amount}`,
        "transferTypeId": `${transferTypeId}`,
        "currencySymbol": currencySymbol,
        "description": description+""+responseData.data.data.spVendInfo.voucher,
        "customValues": [
        {
        "internalName" : "meterNumber",
        "fieldId" : "86",
        "value" :phoneNumber 
         },
        {
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
        url: process.env.CORE_URL + '/rest/payments/confirmMemberPayment',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authheader}`
        },
        data: data
      };

      try {
        const response = await axios.request(config)
        if (response.status === 200) {
          let transactionId = response.data.id;
          status = "Complete";
          logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId)
          return res.status(200).json({
            responseCode: 200,
            communicationStatus: "SUCCESS",
            responseDescription: description,
            data: {
              transactionId: response.data.id,
              amount: amount,
              description: description,
              spVendInfo: responseData.data.data.spVendInfo
            }
          });
        }
      } catch (error) {
        let transactionId = "0000"
        let status = "Incomplete"
        logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId)
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
          error: "Dear client, Your transaction has been processed; please get in touch with DDIN Support for follow-up"
        });
      }
    } else if (thirdpart_status !== "pending") {
      // Handle other non-pending statuses
      status = "Incomplete";
      transactionId=""
      logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId)
     // Chargeback(transactionId);
      return res.status(400).json({
        responseCode: 400,
        communicationStatus: "Failed",
        responseDescription: "Dear client, We're unable to complete your transaction right now. Please try again later."
      });
    }

    // Delay before next polling attempt (e.g., 3 seconds)
    await delay(3000); // Delay for 3 seconds
  }

}




//previoys method
const ddinElectricityPaymentService = async (req, res, response, amount, description, trxId, phoneNumber, service_name, agent_name) => {
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
    verticalId: "electricity",
    deliveryMethodId: "sms",
    // deliverTo: "string",
    // callBack: "string"
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
      const responseData = await callPollEndpoint(resp)
      let transactionId = response.data.id
      let thirdpart_status = resp.status
      let status = "Complete"
      logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId)
      if (responseData.status === 200) {
        return res.status(200).json({
          responseCode: 200,
          communicationStatus: "SUCCESS",
          responseDescription: "Payment has been processed! Details of transactions are included below",
          data: {
            transactionId: response.data.id,
            amount: amount,
            description: description,
            spVendInfo: responseData.data.data.spVendInfo
          }
        });
      }

    }

  } catch (error) {
    let transactionId = response.data.id
    let thirdpart_status = error.response.status
    let status = "Incomplete"
    logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId)
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
      error: error.response.data.msg
    });
  }
};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
module.exports = ddinElectricityPaymentServiceNewMethod