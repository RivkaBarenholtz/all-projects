import { useState, useEffect } from 'react';

const ExpirationDateField = ({ value, onChange, isValid }) => {
    const [inputValue, setInputValue] = useState('');
    const [validDate, setValidDate]= useState(true);

    useEffect(() => {
        if (isValid) isValid(validDate);
      }, [validDate]);
  
    const formatDate = (val) => {
      const digits = val.replace(/\D/g, '').slice(0, 4);
      if (digits.length < 3) return digits;
      return digits.replace(/(\d{2})(\d{1,2})/, '$1/$2');
    };
  
    const handleChange = (e) => {
      const formatted = formatDate(e.target.value);
      setInputValue(formatted);
      if (onChange) onChange(formatted);
      
    };
  
    const handleBlur = () => {
      const [mm, yy] = inputValue.split('/');
      const month = parseInt(mm, 10);
  
      if (!month || month < 1 || month > 12) {
        setValidDate(false);
        return;
      }
  
      if (yy?.length === 2) {
        const fullYear = 2000 + parseInt(yy, 10);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
  
        if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
          setValidDate(false);
          return;
        }
        setValidDate(true);
        }
    };
  
    return (
      <input
      
        className={`form-input ${validDate?'':'invalid'}`}
        type="text"
        placeholder="MM/YY"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={5}
        inputMode="numeric"
        pattern="\d{2}/\d{2}"
        style={{ width: '80px', textAlign: 'center' }}
      />
    );
  };
  
  export default ExpirationDateField;