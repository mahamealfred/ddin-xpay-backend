const dotenv =require("dotenv")
const axios =require("axios");


dotenv.config();

const generateSMSToken = async(req,res)=>{
    let data = JSON.stringify({
        "api_username": "B29C7CF4-CB27-4790-8489-5AD439F134A1",
        "api_password": "BA243365-A19E-4165-BC96-33C25A7D2ACF"
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://messaging.fdibiz.com/api/v1/auth/',
        headers: { 
          'Content-Type': 'application/json'
        },
        data : data
      };
      
    const accesstoken=await  axios.request(config)
      .then((response) => {
        
        const token=JSON.stringify(response.data.access_token)
        //console.log(JSON.stringify(response.data.data.accessToken));
        return token
       
      })
      .catch((error) => {
        return JSON.stringify({
            responseCodeCode:error.response.status,
            communicationStatus:"FAILED",
            error: error.message,
          });  
      });
      
      return  accesstoken
};

module.exports= generateSMSToken