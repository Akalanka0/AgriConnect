import React from 'react';
import PropTypes from 'prop-types';
import MessageCenter from './shared/MessageCenter';

const FarmerMessageCenter = ({ isOpen, onClose, messages = [], onMessageRead }) => {
    return (
        <MessageCenter
            isOpen={isOpen}
            onClose={onClose}
            messages={messages}
            role="farmer"
            onMessageRead={onMessageRead}
        />
    );
};

FarmerMessageCenter.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    messages: PropTypes.array,
    onMessageRead: PropTypes.func
};

export default FarmerMessageCenter;
