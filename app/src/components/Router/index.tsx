import React from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import Home from 'components/Home';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Home} />
      </Switch>
    </Router>
  );
};

export default AppRouter;
