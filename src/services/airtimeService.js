const dotenv = require("dotenv");
const axios = require("axios");
const generateAccessToken = require("../Utils/generateToken.js");
const { updateLogs, logsData } = require("../Utils/logsData.js");
const Chargeback = require("../Utils/chargback.js");
const callPollEndpoint = require("../Utils/checkEfasheTransactionStatus.js");

dotenv.config();

const airtimePaymentService = async (req, res, response, amount, description, trxId, phoneNumber, service_name, agent_name) => {
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
  });

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
    const resp = await axios.request(config);
    if (resp.status === 202) {
      // Start continuous polling
      let transactionId = response.data.id;
      let status = "Incomplete";
      while (true) {
        const responseData = await callPollEndpoint(resp, trxId);
        let thirdpart_status = responseData.data.data.trxStatusId;
        if (thirdpart_status === "successful") {
          status = "Complete";
          logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId);
          return res.status(200).json({
            responseCode: 200,
            communicationStatus: "SUCCESS",
            responseDescription: description,
            data: {
              transactionId: response.data.id,
              amount: amount,
              description: description
            }
          });
        } else if (thirdpart_status !== "pending") {
          // Handle other non-pending statuses
          status = "Incomplete";
          logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId);
          Chargeback(transactionId);
          return res.status(400).json({
            responseCode: 400,
            communicationStatus: "Failed",
            responseDescription: "Dear client, We're unable to complete your transaction right now. Please try again later"
          });
        }
        // Delay before next polling attempt (e.g., 3 seconds)
        await delay(3000); // Delay for 3 seconds
      }
    }
  } catch (error) {
    let transactionId = response.data.id;
    // let thirdpart_status = error.response ? error.response.status : 'Unknown Error';
    let thirdpart_status = error.response ? error.response.status : '404';
    let status = "Incomplete";
    logsData(transactionId, thirdpart_status, description, amount, agent_name, status, service_name, trxId);

    if (error.response && error.response.status === 400) {
      Chargeback(transactionId);
      return res.status(400).json({
        responseCode: 400,
        communicationStatus: "FAILED",
        responseDescription: error.response.data.msg
      });
    }
    if (error.response && error.response.status === 422) {
      Chargeback(transactionId);
      return res.status(400).json({
        responseCode: 400,
        communicationStatus: "FAILED",
        responseDescription: error.response.data.msg
      });
    }
    if (!error.response) {
      return res.status(404).json({
        responseCode: 404,
        communicationStatus: "FAILED",
        responseDescription: "Dear client, Your transaction has been processed; please get in touch with DDIN Support for follow-up."
      });
    }
    return res.status(500).json({
      responseCode: 500,
      communicationStatus: "FAILED",
      error: "Dear client, we're unable to complete your transaction right now. Please try again later.",
    });
  }
};

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = airtimePaymentService;
