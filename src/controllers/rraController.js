const dotenv =require("dotenv")
const axios =require("axios");
const generateAccessToken =require("../Utils/generateToken.js");
const { logsData } = require("../Utils/logsData.js");
const ddinRraPaymentService = require("../services/rraService.js");
const findNetAmount = require("../Utils/findNetAmount.js");
dotenv.config();
class rraController{

  static async rraPayment(req, res) {
    const { amount, trxId,transferTypeId, toMemberId, description, currencySymbol, phoneNumber,clientPhone,taxPayer,tin,agentCategory,referenceNumber} = req.body;
    const authheader = req.headers.authorization;
    const authHeaderValue = authheader.split(' ')[1];
       const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
       const agent_name=decodedValue.split(':')[0]
       const service_name="RRA"
       let netAmount=findNetAmount(amount)
       
    let data = JSON.stringify({
      "toMemberId": `${toMemberId}`,
      "amount": `${amount}`,
      "transferTypeId": `${transferTypeId}`,
      "currencySymbol": currencySymbol,
      "description": description,
      "customValues": [
       {
      "internalName" : agentCategory==="Corporate"?"tax_identification_number_v1":"tax_identification_number",
      "fieldId" : agentCategory==="Corporate"?"57":"46",
      "value" : tin
       },
        {
      "internalName" : agentCategory==="Corporate"?"tax_document_id_v1":"tax_document_id",
      "fieldId" : agentCategory==="Corporate"?"59":"48",
      "value" : phoneNumber?phoneNumber:referenceNumber
        },
        {
      "internalName" : agentCategory==="Corporate"?"taxpayer_v1":"taxpayer",
      "fieldId" : agentCategory==="Corporate"?"64":"53",
      "value" : taxPayer
        },
	    {
      "internalName" : "trans_id",
      "fieldId" : "85",
      "value" : trxId
        },
      {
          "internalName" : "net_amount",
          "fieldId" : "87",
          "value" : netAmount
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
       await ddinRraPaymentService(req, res, response, amount, description, trxId,phoneNumber,clientPhone,service_name,agent_name,referenceNumber)
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

    //validate RRA id
    static async ValidateRRAId(req, res) {
      const accessToken = await generateAccessToken();
      const {customerAccountNumber}=req.body
      if(!accessToken){
        return res.status(401).json({
          responseCode: 401,
          communicationStatus:"FAILED",
          responseDescription: "A Token is required for authentication"
        }); 
      }
      // console.log("accesst:",accessToken.replace(/['"]+/g, ''))
      let data = JSON.stringify({
        verticalId: "tax",
        customerAccountNumber: customerAccountNumber
      }
      );
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: process.env.EFASHE_URL+'/rw/v2/vend/validate',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization':`Bearer ${accessToken.replace(/['"]+/g, '')}`
          },
          data : data
        };

      try{
          const response =await axios.request(config)
         
          if(response.status===200){
              return res.status(200).json({
                  responseCode: 200,
                  communicationStatus:"SUCCESS",
                  responseDescription: " Details",
                  data:response.data.data
                });  
          }
            
          
      } catch (error) {
      
          if(error.response.status===404){
              return res.status(404).json({
                  responseCode: 404,
                  communicationStatus:"FAILED",
                  responseDescription: " Not Found"
                }); 
          }
          if(error.response.status===400){
            return res.status(400).json({
                responseCode: 400,
                communicationStatus:"FAILED",
                responseDescription: error.response.data.msg
              }); 
        }
          return res.status(500).json({
              responseCode: 500,
              communicationStatus:"FAILED",
              error: "Dear client, we're unable to complete your transaction right now. Please try again later."
            });  
      } 
        
  }
   
}
module.exports= rraController;