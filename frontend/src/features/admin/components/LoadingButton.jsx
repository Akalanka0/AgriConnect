import React from 'react';
import PropTypes from 'prop-types';

const LoadingButton = ({
    loading = false,
    children,
    disabled = false,
    className = '',
    loadingText = 'Loading...',
    ...props
}) => {
    return (
        <button
            {...props}
            className={`${className} ${loading ? 'btn-loading' : ''}`}
            disabled={loading || disabled}
        >
            {loading ? (
                <>
                    <i className="fas fa-spinner fa-spin"></i> {loadingText}
                </>
            ) : children}
        </button>
    );
};

LoadingButton.propTypes = {
    loading: PropTypes.bool,
    children: PropTypes.node.isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    loadingText: PropTypes.string
};

export default LoadingButton;
