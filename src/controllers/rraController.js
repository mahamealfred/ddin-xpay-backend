const dotenv =require("dotenv")
const axios =require("axios");
const generateAccessToken =require("../Utils/generateToken.js");
dotenv.config();
class rraController{
    static async rraPayment(req, res) {
        const {amount,referenceId,taxpayer,trxId,transferTypeId,toMemberId}=req.body
        const authheader = req.headers.authorization;
        let data = JSON.stringify({
            "toMemberId": `${toMemberId}`,
            "amount": `${amount}`,
            "transferTypeId":`${transferTypeId}`,
            "currencySymbol": "Rwf",
            "description": "RRA Tax Payment",
            "customValues": [
              {
              "internalName" : "tax_identification_number",
              "fieldId" : "82",
              "value" : "11986801789765"
              },
                  {
              "internalName" : "validation_id",
              "fieldId" : "83",
              "value" : "12345"
                  },
                  {
              "internalName" : "tax_document_id",
              "fieldId" : "84",
              "value" :`${referenceId}`
                  },
                  {
              "internalName" : "tax_center",
              "fieldId" : "85",
              "value" : "Kigali"
                  },
                  {
              "internalName" : "declaration_date",
              "fieldId" : "86",
              "value" : "2024-02-09"
                  },
                  {
              "internalName" : "full_payment_status",
              "fieldId" : "87",
              "value" : "Successful"
                  },
                  {
              "internalName" : "tax_type",
              "fieldId" : "88",
              "value" : "Cleaning Fee"
                  },
                  {
              "internalName" : "taxpayer",
              "fieldId" : "89",
              "value" : `${taxpayer}`
                  },
                  {
              "internalName" : "createdat",
              "fieldId" : "90",
              "value" : "2024-02-09"
                  },
                  {
              "internalName" : "updatedat",
              "fieldId" : "91",
              "value" : "2024-02-09"
                  },
                  {
              "internalName" : "receiptNo",
              "fieldId" : "92",
              "value" : "DDIN123456789"
                  }
              ]
          });
          
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.CORE_TEST_URL+'/coretest/rest/payments/confirmMemberPayment',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `${authheader}`
            },
            data : data
          };

        try{
            const response =await axios.request(config)
            if(response.status===200){
                return res.status(200).json({
                    responseCode: 200,
                    communicationStatus:"SUCCESS",
                    responseDescription: "Payment has been processed! Details of transactions are included below",
                    data:response.data
                  });  
            }
                return res.status(500).json({
                    responseCode: 500,
                    communicationStatus:"FAILED",
                    responseDescription: "Something went wrong, Please try again later.",
                  });
            
        } catch (error) {
            if(error.response.status===401){
                return res.status(401).json({
                    responseCode: 401,
                    communicationStatus:"FAILED",
                    responseDescription: "Username and Password are required for authentication"
                  }); 
            }
            if(error.response.status===400){
                return res.status(400).json({
                    responseCode: 400,
                    communicationStatus:"FAILED",
                    responseDescription: "Invalid Username or Password"
                  }); 
            }
            if(error.response.status===404){
                return res.status(404).json({
                    responseCode: 404,
                    communicationStatus:"FAILED",
                    responseDescription: "Account Not Found"
                  }); 
            }
            return res.status(500).json({
                responseCode: 500,
                communicationStatus:"FAILED",
                error: error.message,
              });  
        }
          
    }

    //validate RRA id
    static async ValidateRRAId(req, res) {
      const accessToken = await generateAccessToken();
      const {phoneNumber,verticalId}=req.body

      if(!accessToken){
        return res.status(401).json({
          responseCode: 401,
          communicationStatus:"FAILED",
          responseDescription: "A Token is required for authentication"
        }); 
      }
      // console.log("accesst:",accessToken.replace(/['"]+/g, ''))
      let data = JSON.stringify({
        verticalId: verticalId,
        customerAccountNumber: phoneNumber
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
              return res.status(500).json({
                  responseCode: 500,
                  communicationStatus:"FAILED",
                  responseDescription: "Something went wrong, Please try again later.",
                });
          
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
              error: error.message
            });  
      } 
        
  }
   
}
module.exports= rraController;