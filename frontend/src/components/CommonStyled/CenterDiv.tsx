import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { centerDiv } from './CenterDiv.css';

type DivProps = HTMLAttributes<HTMLDivElement>;

const CenterDiv = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx(centerDiv, className)} {...props} />
  )
);

CenterDiv.displayName = 'CenterDiv';

export default CenterDiv;
