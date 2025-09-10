import React from 'react';
import { Typography } from '@mui/material';
import BaseModal, { BaseModalProps } from './Base';

interface Props extends BaseModalProps {
  title?: string,
  details?: string,
}

const ConfirmModal: React.FC<Props> = ({
  title,
  details,
  ...baseModalProps
}) => {
  return (
    <BaseModal {...baseModalProps}>
      <Typography variant="h6">
        {title}
      </Typography>
      <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
        {details}
      </Typography>
    </BaseModal>
  );
};

export default ConfirmModal;
