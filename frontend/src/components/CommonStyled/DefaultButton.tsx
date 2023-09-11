
import styled from 'styled-components';

const StyledButton = styled.button`
  ${(props) => props.theme.outerShadow}
    background: #E6EAED;
    border: none;
    border-radius: 0.5rem;
    padding: 1rem 2.5rem;
    cursor: pointer;
    font-size: 1rem;

    &:hover {
    background-color: '#eeeeee';
  }
`;

const DefaultButton = styled(StyledButton)``;

export default DefaultButton;
