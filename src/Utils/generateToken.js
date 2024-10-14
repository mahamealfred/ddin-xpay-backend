const dotenv =require("dotenv")
const axios =require("axios");


dotenv.config();

const generateAccessToken = async(req,res)=>{
    let data = JSON.stringify({
        "api_key": "fec6eb42-30e0-4868-ab6c-46dfa78718b4",
        "api_secret": "74a0dd2d-ee5c-4067-aa81-fb5eb8400102"
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://sb-api.efashe.com/rw/v2/auth',
        headers: { 
          'Content-Type': 'application/json'
        },
        data : data
      };
      
    const accesstoken=await  axios.request(config)
      .then((response) => {
        
        const token=JSON.stringify(response.data.data.accessToken)
        //console.log(JSON.stringify(response.data.data.accessToken));
        return token
       
      })
      .catch((error) => {
        console.log("error::",error)
        return JSON.stringify({
            responseCodeCode:error.response.status,
            communicationStatus:"FAILED",
            error: error.message,
          });  
      });
      
      return  accesstoken
};

module.exports= generateAccessToken