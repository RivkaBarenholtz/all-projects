const { handler } = require("./index");

(async () => {
  const event = {
    enterpriseId : "sapph02", 
    userName : "RRUBIN", 
    password: "Proactovate1!", 
    amount: ".25", 
    paymentMethod: "Check", 
    bankAccountNumber : 1010, 
    description : "test description", 
    detailDescription : "test detail description", 
    accountLookupCode : "ALLECUS-01", 
    isDebit: true, 
    isLocalTest: true
  }
  const result = await handler(event);
  console.log(result);
})();