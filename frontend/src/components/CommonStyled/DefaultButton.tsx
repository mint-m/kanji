import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import * as styles from './DefaultButton.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean;
};

const DefaultButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, pressed: isPressed, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(styles.button, isPressed && styles.pressed, className)}
      {...props}
    />
  )
);

DefaultButton.displayName = 'DefaultButton';

export default DefaultButton;
