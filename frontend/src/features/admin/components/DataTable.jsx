import React from 'react';
import PropTypes from 'prop-types';
import '../styles/DataTable.css';

/**
 * Reusable Data Table Component
 * Supports custom columns, actions, and simple pagination styling
 */
const DataTable = ({ columns, data, actions, onAction, emptyMessage, loading, pagination }) => {
    if (loading) {
        return (
            <div className="data-table-container">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2em', color: 'var(--primary)', marginBottom: '10px' }}></i>
                    <p style={{ color: 'var(--gray)' }}>Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} style={{ width: col.width }}>{col.header}</th>
                        ))}
                        {actions && <th className="col-actions">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, rowIndex) => (
                            <tr key={row.id || rowIndex}>
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                                {actions && (
                                    <td>
                                        <div className="action-buttons">
                                            {actions.map((action, actionIndex) => {
                                                const label = typeof action.label === 'function' ? action.label(row) : action.label;
                                                const type = typeof action.type === 'function' ? action.type(row) : action.type;
                                                const name = typeof action.name === 'function' ? action.name(row) : action.name;
                                                const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                                                
                                                return (
                                                    <button
                                                        key={actionIndex}
                                                        className={`btn-action btn-${type || 'primary'}`}
                                                        onClick={() => onAction(name, row)}
                                                        title={label}
                                                    >
                                                        {icon && <i className={icon}></i>}
                                                        {label && <span>{label}</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="empty-state">
                                {emptyMessage || 'No data available'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
                <div className="pagination-container">
                    <div className="pagination-info">
                        Showing {data.length} of {pagination.total} entries
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="btn-pagination"
                            onClick={() => pagination.onPageChange(1)}
                            disabled={pagination.page === 1}
                        >
                            <i className="fas fa-angle-double-left"></i>
                        </button>
                        <button 
                            className="btn-pagination"
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            <i className="fas fa-angle-left"></i>
                        </button>
                        <span className="page-info">
                            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                        </span>
                        <button 
                            className="btn-pagination"
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        >
                            <i className="fas fa-angle-right"></i>
                        </button>
                        <button 
                            className="btn-pagination"
                            onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.limit))}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        >
                            <i className="fas fa-angle-double-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

DataTable.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            header: PropTypes.string.isRequired,
            accessor: PropTypes.string,
            render: PropTypes.func,
            width: PropTypes.string
        })
    ).isRequired,
    data: PropTypes.array.isRequired,
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
            icon: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
            type: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
            label: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
        })
    ),
    onAction: PropTypes.func,
    emptyMessage: PropTypes.string,
    loading: PropTypes.bool,
    pagination: PropTypes.shape({
        page: PropTypes.number,
        limit: PropTypes.number,
        total: PropTypes.number,
        onPageChange: PropTypes.func
    })
};

export default DataTable;
