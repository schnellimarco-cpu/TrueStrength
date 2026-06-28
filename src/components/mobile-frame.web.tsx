import { PropsWithChildren } from 'react';

import classes from './mobile-frame.module.css';

export default function MobileFrame({ children }: PropsWithChildren) {
  return (
    <div className={classes.viewport}>
      <div className={classes.phone}>{children}</div>
    </div>
  );
}
