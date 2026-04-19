import React from 'react';

const FormInput = ({ label, type = 'text', value, onChange, required, options, placeholder, error }) => {
  return (
    <div className="form-group">
      <label className="form-label">{label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
      
      {type === 'textarea' ? (
        <textarea 
          className="form-textarea" 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder} 
          required={required}
        />
      ) : type === 'select' ? (
        <select className="form-select" value={value} onChange={onChange} required={required}>
          <option value="" disabled>Select {label}</option>
          {options?.map(opt => (
            <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type} 
          className="form-input" 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder} 
          required={required}
        />
      )}
      
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export default FormInput;
