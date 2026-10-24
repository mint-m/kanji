import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import * as styles from './DefaultButton.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean;
  variant?: keyof typeof styles.variant;
};

const DefaultButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, pressed: isPressed, variant = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={clsx(styles.button, styles.variant[variant], isPressed && styles.pressed, className)}
      {...props}
    />
  )
);

DefaultButton.displayName = 'DefaultButton';

export default DefaultButton;
