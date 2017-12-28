import React, { Component } from 'react';
import './App.css';
import DebtCalculator from './Debt.js';

class App extends Component {
  render() {
    return (
      <div className="App">
        <DebtCalculator />
      </div>
    );
  }
}

export default App;
