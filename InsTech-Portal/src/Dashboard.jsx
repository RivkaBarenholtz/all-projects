import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  Legend as PieLegend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as AreaTooltip,
} from "recharts";
import { fetchWithAuth, FormatCurrency } from "./Utilities";
import { CircleDollarSign, ArrowRightLeft } from "lucide-react";
import { SingleSelectDropdown } from "./FilterObjects/SingleSelectDropdown";
import { FilterObject } from "./FilterObjects/FilterObject";

const CARD_COLORS = {
  Visa: "#1a48ffe8",
  MasterCard: "#ffcc00",
  Amex: "#33cc3359",
  Discover: "#ff6600",
  Other: "#8884d891"
};

const h4styles ={
  textDecoration: "underline", 
  padding: "12px"
}

const Dashboard = ({ dateRange }) => {
  const [beginDate, setBeginDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 6))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [pieData, setPieData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedOption , setSelectedOption] = useState( {
      label: "Last 7 Days",
      value: 'Last7'
    });

  useEffect(() => {
    search();
  }, [beginDate, endDate]);

  const dateRangeOptions = [
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
    },
    {
      label: "Custom Range", 
      value : "Custom"
    }
  ]

  const search = async () => {
    const filters = {
      TransactionsPerPage: 1000000,
      PageNumber: 1,
      SortBy: "Date",
      isAsc: true,
      FromDate: beginDate,
      ToDate: endDate,
      IncludeError: false,
      RefNum: "",
      Statuses: [21, 22],
      PaymentMethods:["ALL"],
      AccountId:""
    };

    const response = await fetchWithAuth("transaction-report", filters);
    const responseFormatted = response.xReportData;
    setAreaData(areaData2(responseFormatted));
    setPieData(pieData2(responseFormatted));
    setTotalResults(response.xRecordsReturned);
    setTotal(response.xResult);
  };

  const pieData2 = (paymentData) =>
    Object.values(
      paymentData.reduce((acc, payment) => {
        const type = payment.xCardType || "Other";
        acc[type] = acc[type] || { name: type, value: 0 };
        acc[type].value += payment.xAmount;
        return acc;
      }, {})
    );

  const groupByKey = dateRange === "Today" ? "hour" : "day";
  const grouped = {};

  const areaData2 = (paymentData) => {
    const data = [];
    paymentData.forEach((payment) => {
      let key;
      const date = new Date(payment.xEnteredDate);
      if (groupByKey === "hour") {
        key = `${date.getHours()}:00`;
      } else if (groupByKey === "day") {
        key = date.toLocaleDateString();
      } else if (groupByKey === "week") {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        key = start.toLocaleDateString();
      }

      grouped[key] = grouped[key] || 0;
      grouped[key] += payment.xAmount;
    });

    for (let k in grouped) {
      data.push({ name: k, amount: grouped[k] });
    }
    return data;
  };

  const ChangeOption = (option)=> {
    
    
    const optionObj = dateRangeOptions.find((o) => o.value === option);
    setSelectedOption(optionObj);
    switch (option) {
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



  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        alignItems: "center",
        padding: "20px",
        maxWidth: "1000px",
        margin: "auto"
      }}
    >

        <div style={{width:"90%"}}>
        <div >
          <div className='filter-row' style={{position:"relative"}}>
            <SingleSelectDropdown 
              onChange={ChangeOption}  
              label={"Date Range"} 
              options={dateRangeOptions} 
              selectedOption={selectedOption} 
              style={{position:"relative"}}
                           
              />
          
            
          </div>
        </div>
      </div>



      {/* === TOP: AREA CHART === */}
      <div className="dashboard-element">
        <AreaChart
          width={900}
          height={300}
          data={areaData}
          margin={{ top: 30, right: 40, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
            return value;
          }} />
          <AreaTooltip formatter={(value) => FormatCurrency(value)} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#82ca9d"
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>

        {/* Circle showing total transactions */}

      </div>

      {/* === BOTTOM: PANELS + PIE CHART === */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <div
          style={{display:"flex", flexDirection:"column" , gap:"30px"}}
        >
        {/* Panel 1: Total Transactions */}
        <div 
          className="dashboard-element dashboard-panel"
        >
          <h4 style={h4styles}>Total Transactions</h4>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {totalResults.toLocaleString()}
          </div>
        </div>

        {/* Panel 2: Total Amount */}
        <div style={{flex:1}}
          className="dashboard-element dashboard-panel"
        >
          <div style={{margin:"auto"}}>
            <h4 style={h4styles}>Total Amount</h4>

            {/* <div>
              <CircleDollarSign size={84} color="#3665b7"/>
            </div>
             */}
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {FormatCurrency(total)}
            </div>
          </div>
        </div>
        </div>

        {/* Pie Chart */}
        <div className="dashboard-element">
          <h4 style={{...h4styles, textAlign: "center" }}>Payments by Card Type</h4>
          <PieChart width={600} height={300} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              labelLine={false}
              label={({ name, value }) => `${name}: ${FormatCurrency(value)}`}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CARD_COLORS[entry.name]}
                />
              ))}
            </Pie>
            <PieTooltip formatter={(value) => FormatCurrency(value)} />
          </PieChart>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
