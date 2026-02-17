import React from 'react';
import PropTypes from 'prop-types';
import MessageCenter from '../../farmer/components/shared/MessageCenter';

const AdminMessageCenter = ({ isOpen, onClose, messages = [], onMessageRead }) => {
    return (
        <MessageCenter
            isOpen={isOpen}
            onClose={onClose}
            messages={messages}
            role="admin"
            onMessageRead={onMessageRead}
        />
    );
};

AdminMessageCenter.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    messages: PropTypes.array,
    onMessageRead: PropTypes.func
};

export default AdminMessageCenter;
