// components/ErrorMessage.tsx
import React from 'react';
import styled from 'styled-components';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return <ErrorContainer>{message}</ErrorContainer>;
};

const ErrorContainer = styled.div`
  color: #f44336;
  margin: 8px 0;
  font-size: 14px;
`;

export default ErrorMessage;