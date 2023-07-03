import React from 'react';
import Navbar from 'components/Navbar';
import { Link } from 'react-router-dom';

const Main = () => {
  return (
    <div>
      <Navbar />
      <Link to={'study'}>
        <button>히히 니뽄</button>
      </Link>
    </div>
  );

};
export default Main;
