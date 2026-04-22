import { FC } from 'react';
import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const errorText = style({
  color: '#f44336',
  margin: `${vars.space.sm} 0`,
  fontSize: vars.fontSize.sm,
});

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: FC<ErrorMessageProps> = ({ message }) => (
  <div className={errorText}>{message}</div>
);

export default ErrorMessage;
