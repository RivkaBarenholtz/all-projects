import { useEffect, useState } from 'react';
import { fetchWithAuth, FormatCurrency } from './Utilities'; 
import { Grid } from './Objects/Grid';
import { SingleSelectDropdown } from './FilterObjects/SingleSelectDropdown';
import ToggleSwitch from './FilterObjects/ToggleSwitch';


function ReconciliationReport() {
  const [beginDate, setBeginDate]= useState(new Date)
  const [endDate, setEndDate]= useState(new Date)
  const [showError, setShowError] = useState(false)
  const [headers, setHeaders] = useState([
    {
      DisplayValue:"Cardknox BatchID", 
      Show: true, 
      Value:  "BatchId"
    },
    
    {
      DisplayValue:"Receipt ID", 
      Show: true, 
      Value:  "ReceiptId"
    },
    

    {
      DisplayValue:"Batch Total", 
      Show: true, 
      Value:  "BatchTotal"
    },

    {
      DisplayValue:"Epic Receipt Total",
      Show: true,
      Value: "ReceiptTotal"
    },
    
    
    {
      DisplayValue:"Receipt Description", 
      Show: true, 
      Value:  "ReceiptDescription"
    }
  ])
  const [records , setRecords] = useState([])
  const [selectedOption , setSelectedOption] = useState({
    label: "Last 7 Days",
    value: 'Last7'
  });

  const options = [
    {
      label: "Today",
      value: 'Today'
    },
    {
      label: "Yesterday",
      value: 'Yesterday'
    },
    {
      label: "This Month",
      value: 'ThisMonth'
    },
    {
      label: "Last Month",
      value: 'LastMonth'
    },
    {
      label: "Last 7 Days",
      value: 'Last7'
    },
    {
      label: "Last 30 Days",
      value: 'Last30'
    },
    {
      label: "Last 60 Days",
      value: 'Last60'
    },
    {
      label: "Last 90 Days",
      value: 'Last90'
    }
  ]
 
  const fetchSubdata = async(item) =>
  {
    const receiptData = await  fetchWithAuth (`get-reconciliation-details?receiptid=${item.ReceiptId}&batchid=${item.BatchId}`, {Method :  'GET'})
    
    setRecords((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, subData:receiptData.transactions, ReceiptTotal: FormatCurrency(receiptData.ReceiptTotal)  } : i
        )
      );
  }
  const search = async()=> 
  {
    const filters = {
      FromDate : beginDate, 
      ToDate: endDate
    }

    const response = await fetchWithAuth("reconciliation-report", {body: JSON.stringify(filters) ,  method: 'POST'});
    var responseFormatted = response.map((rec, index)=> 
      {
        
        const receiptDescription = `New receipt created for batch number ${rec.BatchId}.`
        
        const item =  {... rec, 
            id: index, 
            ReceiptDescription:receiptDescription, 
            ReceiptTotal:0 , 
            BatchTotal: FormatCurrency(rec.BatchTotal)
        }

        return {
            ... item, 
            getSubData: () => fetchSubdata(item)
        }
      })
    setRecords(responseFormatted);
  }


  useEffect(()=>
    {
      async function getData(){
        await search()
      }
      getData()
    }
   
  ,[])

  const ChangeOption = (option)=> {
    setSelectedOption(option);
    switch (option.value) {
      case "Today": {
        const today = new Date();
        setBeginDate(new Date(today.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }
    
      case "Yesterday": {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setBeginDate(new Date(yesterday.setHours(0, 0, 0, 0)));
        setEndDate(new Date(yesterday.setHours(23, 59, 59, 999)));
        break;
      }
    
      case "ThisMonth": {
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setBeginDate(new Date(firstOfMonth.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }
    
      case "LastMonth": {
        const today = new Date();
        const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(firstOfThisMonth - 1);
        lastOfLastMonth.setHours(23, 59, 59, 999);
        setBeginDate(new Date(firstOfLastMonth.setHours(0, 0, 0, 0)));
        setEndDate(lastOfLastMonth);
        break;
      }
    
      case "Last7": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 6);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }
    
      case "Last30": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 29);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }
    
      case "Last60": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 59);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }
    
      case "Last90": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 89);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }
    }
  } 
 
  return <form>
    <div >
      <h3> Cardknox Applied Epic Reconciliation </h3>
      <div className='filters-header'>
        <SingleSelectDropdown onChange={(o)=> {  ChangeOption(o)}}  label={"Date Range"} options={options} selectedOption={selectedOption}/>
        {/* <DatePicker onChange={setFromDate}selectedDate={fromDate} label={"Begin Date"}/>
        <DatePicker onChange={setToDate} selectedDate={toDate} label={"End Date"}/>
        <SingleSelectDropdown selectedOptions={[]} onChange={setAchStatus} selectedOption={achStatus} label={"ACH Status "} /> */}
        <button type='button' className='search-button' onClick={search}>Search</button>
        
      </div>
      <div> 
        <Grid HeaderList={headers} JsonObjectList={records} isSelectable={false} ></Grid>
        
      </div>
    </div>
    </form>
};

export default ReconciliationReport;
