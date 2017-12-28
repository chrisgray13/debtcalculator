import React, { Component } from 'react';
import { Accordion, Button, Checkbox, Divider, Form, Header, Icon, Segment, Table } from 'semantic-ui-react';
import { CurrencyFormatter, CurrencyFormField, PercentageFormatter, PercentageFormField } from './Formatting.js';

class DebtCalculator extends Component {
    constructor(props) {
        super(props);

        this.state = {
            debts: [
                { name: "Home Depot", balance: 1200.00, interestRate: .085, minimumPayment: 54.00, debtLife: 24.265, excluded: false, customSort: "1" },
                { name: "Medical Bill", balance: 1800.00, interestRate: 0.0, minimumPayment: 200.00, debtLife: 12, excluded: true, customSort: "2" },
                { name: "American Express", balance: 5700.00, interestRate: .12, minimumPayment: 102.00, debtLife: 82.239, excluded: false, customSort: "3" }
            ],
            enableSnowball: false
        };
    }

    handleAddDebt(e, debt) {
        let debts = this.state.debts.slice();
        debts.push(debt);
        this.setState({ debts: debts });
    }

    render() {
        return (
            <div>
                <DebtHeader title="Debt Calculator" subHeading="Calculate how long until you are DEBT FREE!" iconName="calculator" />
                <Segment>
                    <Accordion panels={[
                        { title: 'Add Debt', content: { key: 'addDebt', content: (<DebtForm onAddDebt={(e, d) => this.handleAddDebt(e, d)} />) } }
                    ] } />
                </Segment>
                <Divider horizontal />
                <DebtList debts={this.state.debts}/>
            </div>
        );
    }
}

function DebtHeader(props) {
    return (
        <Header as="h2" icon textAlign="center">
            <Icon name={props.iconName} />
            {props.title}
            <Header.Subheader>
                {props.subHeading}
            </Header.Subheader>
        </Header>
    );
}

function DebtList(props) {
    return (
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Balance</Table.HeaderCell>
            <Table.HeaderCell>Interest Rate</Table.HeaderCell>
            <Table.HeaderCell>Minimum Payment</Table.HeaderCell>
            <Table.HeaderCell>Life of Debt</Table.HeaderCell>
            <Table.HeaderCell>Exclude</Table.HeaderCell>
            <Table.HeaderCell>Custom Sort</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
            {
              props.debts.map((debt) =>
                <Debt key={debt.name} name={debt.name} balance={debt.balance}
                  interestRate={debt.interestRate} minimumPayment={debt.minimumPayment}
                  debtLife={debt.debtLife} excluded={debt.excluded} customSort={debt.customSort} />
              )
            }
        </Table.Body>
      </Table>
    );
}

function Debt(props) {
    return (
      <Table.Row>
        <Table.Cell>{props.name}</Table.Cell>
        <Table.Cell><CurrencyFormatter value={props.balance} /></Table.Cell>
        <Table.Cell><PercentageFormatter value={props.interestRate} /></Table.Cell>
        <Table.Cell><CurrencyFormatter value={props.minimumPayment} /></Table.Cell>
        <Table.Cell>{Math.ceil(props.debtLife)}</Table.Cell>
        <Table.Cell><Checkbox toggle checked={props.excluded} /></Table.Cell>
        <Table.Cell>{props.customSort}</Table.Cell>
      </Table.Row>
    );
}

/*class Debt extends Component {
  constructor(props) {
    super();

    this[_name] = props.name;
    this[_balance] = props.balance;
    this[_minimumPayment] = props.minimumPayment;
    this[_interestRate] = props.interestRate;
    this[_debtLife] = props.debtLife;
    this[_excluded] = props.excluded;
    this[_customSort] = props.customSort;
  }

  get name() {
      return this[_name];
  }

  set name(value) {
      this[_name] = value;
  }

  get balance() {
      return this[_balance];
  }

  set balance(value) {
      this[_balance] = value;
  }
  
  get interestRate() {
      return this[_interestRate];
  }

  set interestRate(value) {
      this[_interestRate] = value;
  }
  
  get minimumPayment() {
      return this[_minimumPayment];
  }

  set minimumPayment(value) {
      this[_minimumPayment] = value;
  }
  
  get debtLife() {
      return this[_debtLife];
  }

  set debtLife(value) {
      this[_debtLife] = value;
  }
  
  get excluded() {
      return this[_excluded];
  }

  set excluded(value) {
      this[_excluded] = value;
  }
  
  get customSort() {
      return this[_customSort];
  }

  set customSort(value) {
      this[_customSort] = value;
  }
  
  render() {
    return (
      <Table.Row>
        <Table.Cell>{this.name}</Table.Cell>
        <Table.Cell><CurrencyFormatter value={this.balance} /></Table.Cell>
        <Table.Cell><PercentageFormatter value={this.interestRate} /></Table.Cell>
        <Table.Cell><CurrencyFormatter value={this.minimumPayment} /></Table.Cell>
        <Table.Cell>{Math.ceil(this.debtLife)}</Table.Cell>
        <Table.Cell><Checkbox toggle checked={this.excluded} /></Table.Cell>
        <Table.Cell>{this.customSort}</Table.Cell>
      </Table.Row>
    );
  }
}
*/

class DebtForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            name: undefined,
            balance: undefined,
            minimumPayment: undefined,
            interestRate: undefined,
            debtLife: undefined,
            excluded: undefined,
            customSort: undefined
        };
    }

    addDebt(e) {
        let debt = Object.assign({}, this.state);

        debt.interestRate = debt.interestRate / 100.0;

        this.props.onAddDebt(e, debt);
    }

    handleFormChange(e, data) {
        let value = undefined;

        if (e.target.type === "checkbox") {
            value = e.target.checked;
        } else if (e.target.type === "number") {
            value = parseFloat(e.target.value);
        } else {
            value = e.target.value;
        }

        this.setState({
            [e.target.name]: value
        });
    }

    render() {
        return (
            <Form>
                <Form.Group>
                    <Form.Input name="name" label="Name" placeholder="Name" onChange={ (e, d) => this.handleFormChange(e, d) } />
                </Form.Group>
                <Form.Group>
                    <CurrencyFormField name="balance" label="Balance" onChange={ (e, d) => this.handleFormChange(e, d) } />
                    <PercentageFormField name="interestRate" label="Interest Rate" onChange={ (e, d) => this.handleFormChange(e, d) } />
                </Form.Group>
                <Form.Group>
                    <CurrencyFormField name="minimumPayment" label="Minimum Payment" onChange={ (e, d) => this.handleFormChange(e, d) } />
                    <Form.Input name="debtLife" type="number" label="Life of Debt" placeholder="Life of debt" onChange={ (e, d) => this.handleFormChange(e, d) } />
                </Form.Group>
                <Form.Group>
                    <Form.Field>
                        <label>Exclude</label>
                        <Checkbox name="excluded" toggle onChange={ (e, d) => this.handleFormChange(e, d) } />
                    </Form.Field>
                    <Form.Input name="customSort" type="number" label="Custom Sort" placeholder="Custom Sort" onChange={ (e, d) => this.handleFormChange(e, d) } />
                    <Form.Field label="Exclude" control={Checkbox} toggle fitted={true} />
                </Form.Group>
                <Button type='submit' onClick={(e) => this.addDebt(e)}>Add</Button>
            </Form> 
        );
    }
}

export default DebtCalculator;