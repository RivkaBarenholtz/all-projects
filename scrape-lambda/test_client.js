const { getClient } = require("./client");

async function runTest() {
  try {
    // You can pass a fake event if needed
    const event = { ByName : false ,
       accountInput: "TESTCOR-01", 
       enterpriseid:"GNPIN01",
       username:"BARRI1", 
       password : "Rivka@instech360"
    };
    const result = await getClient(event);
    console.log("Lambda returned:", result);
  } catch (err) {
    console.error("Error running Lambda:", err);
  }
}

runTest();