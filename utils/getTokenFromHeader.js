// const getTokenFromHeader = req => {
//     // get token from the header
//     const headerObj = req.headers;
//     const token = headerObj["authorization"].split(" ")[1];

//     if(token!==undefined){
//         return token;
//     }else{
//         return false;
//     }

// };  

// module.exports = getTokenFromHeader;

const getTokenFromHeader = req => {
    // get token from the header
    const headerObj = req.headers;
    if (!headerObj || !headerObj.authorization) {
        return false;
    }
    const token = headerObj.authorization.split(" ")[1];
    if (token !== undefined) {
        return token;
    } else {
        return false;
    }
};  

module.exports = getTokenFromHeader;
