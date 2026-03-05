import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import styles from '../styles/DataTable.module.css';
import btnStyles from '@/components/common/styles/Button.module.css';

/**
 * Reusable Data Table Component
 * Supports custom columns, actions, and simple pagination styling
 */
const DataTable = ({ columns, data, actions, onAction, emptyMessage, loading, pagination }) => {
    const { t } = useTranslation('admin');
    if (loading) {
        return (
            <div className={styles.dataTableContainer}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingIcon}></div>
                    <p className={styles.loadingText}>{t('users.loadingData')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className={col.className}
                            >
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className={styles.colActions}>{t('users.colActionsLabel')}</th>}
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
                                        <div className={styles.actionButtons}>
                                            {actions.map((action, actionIndex) => {
                                                const label = typeof action.label === 'function' ? action.label(row) : action.label;
                                                const type = typeof action.type === 'function' ? action.type(row) : action.type;
                                                const name = typeof action.name === 'function' ? action.name(row) : action.name;
                                                const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;

                                                // Map type to common button styles
                                                const typeClass = type ? btnStyles[`btn${type.charAt(0).toUpperCase() + type.slice(1)}`] : btnStyles.btnPrimary;

                                                return (
                                                    <button
                                                        key={actionIndex}
                                                        className={`${styles.btnAction} ${btnStyles.btn} ${typeClass} ${btnStyles.btnSm}`}
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
                            <td colSpan={columns.length + (actions ? 1 : 0)} className={styles.emptyState}>
                                {emptyMessage || 'No data available'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
                <div className={styles.paginationContainer}>
                    <div className={styles.paginationInfo}>
                        Showing {data.length} of {pagination.total} entries
                    </div>
                    <div className={styles.paginationControls}>
                        <button
                            className={styles.btnPagination}
                            onClick={() => pagination.onPageChange(1)}
                            disabled={pagination.page === 1}
                        >
                            <i className="fas fa-angle-double-left"></i>
                        </button>
                        <button
                            className={styles.btnPagination}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            <i className="fas fa-angle-left"></i>
                        </button>
                        <span className={styles.pageInfo}>
                            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                        </span>
                        <button
                            className={styles.btnPagination}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        >
                            <i className="fas fa-angle-right"></i>
                        </button>
                        <button
                            className={styles.btnPagination}
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
