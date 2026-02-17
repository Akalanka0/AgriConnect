import React from 'react';
import PropTypes from 'prop-types';
import MessageCenter from '../../farmer/components/shared/MessageCenter';

const InstructorMessageCenter = ({ isOpen, onClose, messages = [], onMessageRead }) => {
    return (
        <MessageCenter
            isOpen={isOpen}
            onClose={onClose}
            messages={messages}
            role="instructor"
            onMessageRead={onMessageRead}
        />
    );
};

InstructorMessageCenter.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    messages: PropTypes.array,
    onMessageRead: PropTypes.func
};

export default InstructorMessageCenter;
