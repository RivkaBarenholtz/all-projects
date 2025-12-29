import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FilterObject  } from "./FilterObject";


export const DatePicker = ({ selectedDate, onChange, label }) => (
  <FilterObject label={label}>
    <ReactDatePicker
      selected={selectedDate}
      onChange={(date) => onChange(date)}
      dateFormat="MM/dd/yyyy"
      placeholderText="Select a date"
    />
  </FilterObject>
);
