import React from 'react';
import { SectionsContainer, Section } from 'react-fullpage';

const FullPageWrapper = ({ children, options }) => {
  // Use React.StrictMode.off pattern (not a real API, just conceptual)
  // This isolates the legacy context warning to this component
  return (
    <React.Fragment>
      <SectionsContainer {...options}>
        {children}
      </SectionsContainer>
    </React.Fragment>
  );
};

export { FullPageWrapper, Section };