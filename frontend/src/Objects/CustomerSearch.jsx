import  { use, useEffect , useState} from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { fetchWithAuth } from "../Utilities";
import { Grid } from "./Grid";

export function CustomerSearch({ onSelectCustomer, onClose }) {
    const [nextToken, setNextToken] = useState("");
       const [data, setData] = useState([]);
       const [selectedCustomer, setSelectedCustomer] = useState(null);
       const [filters, setFilters ] = useState({})
    
    
    
       const [headers, setHeaders] = useState([
          
          {
             DisplayValue: "First Name",
             Show: true,
             Value: "BillFirstName",
             FilterValue: "BillFirstName",
             SortString: "BillLastName",
             SortAsc: false
          },
    
            {
             DisplayValue: "Last Name",
             Show: true,
             Value: "BillLastName",
             FilterValue: "BillLastName",
             SortString: "BillLastName",
             SortAsc: false
          },
    
    
        //    {
        //      DisplayValue:"Customer ID", 
        //      Show: true, 
        //      Value:  "CustomerId",
        //      SortString : "CustomerId",
        //      SortAsc: true
        //    },
    
    
           {
             DisplayValue:"Company", 
             Show: true, 
             Value:  "BillCompany",
             FilterValue:  "BillCompany",
             SortString:"BillCompany",
             SortAsc: true
           },
    
             //  {
          //    DisplayValue:"Status", 
          //    Show: true, 
          //    Value:  "StatusHtml",
          //    SortString : "Status", 
          //    SortAsc: true
          //  },
    
          //  // {
          //  //   DisplayValue:"Description", 
          //  //   Show: true, 
          //  //   Value:  "xDescription",
          //  //   SortAsc: true
          //  // },
    
    
          //  {
          //    DisplayValue:"Customer ID", 
          //    Show: false, 
          //    Value:  "xCustom01",
          //    SortString: "CardknoxCustomer",
          //    SortAsc: true
          //  },
    
    
          //  {
          //    DisplayValue:"CSR Code", 
          //    Show: false, 
          //    Value:  "xCustom02",
          //    SortString : "CsrCode",
          //    SortAsc: true
          //  },
    
       {
             DisplayValue: "Customer ID",
             Show: true,
             Value: "CustomerId",
             FilterValue: "CustomerId",
             SortString: "CustomerId",
             SortAsc: true
          }
    
       ])
    
       //const {showSuccess, SuccessModal}= useSuccessModal();
    
       async function getData() {
          const req = {
             NextToken: nextToken,
             PageSize: 100
          }
    
          const response = await fetchWithAuth("list-customers", req)
          
        //   const formattedData = response.Customers.map((customer) => {
        //         ...
    
        //   })
    
          const allData =[
             ...nextToken == '' || nextToken == undefined ? [] : data,
             ...response.Customers
          ]
          setNextToken(response.NextToken)
             setData(allData)
          
       }
    
       useEffect(() => {
    
          if (data.length === 0 || (nextToken != null && nextToken !== undefined && nextToken !== "")) {
             getData()
          }
    
    
       }
    
          , [nextToken])
    
    

    return <ConfirmationModal 
     confirmButtonText={"Select Customer"}
     maxWidth={"800px"}
     onClose={onClose}
        onConfirm={() => onSelectCustomer(selectedCustomer)}


     >


        <Grid
          filters={filters }
          setFilters={setFilters}
          JsonObjectList={data}
           headerList={headers}
          setHeaders = {setHeaders}
          isSelectable={true}
          selectedItem = {selectedCustomer}
          setSelectedItem = {setSelectedCustomer}
             enableFilters = {true}
          >

          </Grid>
     </ConfirmationModal>
}