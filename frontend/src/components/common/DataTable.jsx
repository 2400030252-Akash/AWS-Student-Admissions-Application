import React from 'react';
import './Common.css';

const DataTable = ({ columns, data, onRowClick }) => {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => <th key={i}>{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((row, i) => (
            <tr key={i} onClick={() => onRowClick && onRowClick(row)} className={onRowClick ? 'clickable' : ''}>
              {columns.map((col, j) => <td key={j}>{col.accessor ? row[col.accessor] : col.render(row)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={columns.length} className="text-center py-4">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
export default DataTable;
