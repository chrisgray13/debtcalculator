import React, { Component } from 'react';
import './Debt.css';
import { Accordion, Button, Checkbox, Divider, Form, Header, Icon, Segment, Table } from 'semantic-ui-react';
import { CurrencyFormatter, CurrencyFormField, PercentageFormatter, PercentageFormField } from './Formatting.js';
import { DebtCalculator } from './DebtCalculator.js';

class DebtCalculatorApp extends Component {
    constructor(props) {
        let debts = [
            { name: "Home Depot", balance: 1200.00, interestRate: .085, minimumPayment: 54.00, debtLife: 24.265, excluded: false, payoffOrder: "1", amortization: [] },
            { name: "Medical Bill", balance: 1800.00, interestRate: 0.0, minimumPayment: 200.00, debtLife: 12, excluded: true, payoffOrder: "2", amortization: [] },
            { name: "American Express", balance: 5700.00, interestRate: .12, minimumPayment: 102.00, debtLife: 82.239, excluded: false, payoffOrder: "3", amortization: [] }
        ];

        super(props);

        for (let i = 0, length = debts.length; i < length; i++) {
            debts[i].amortization = DebtCalculator.buildAmortization(debts[i].balance, debts[i].interestRate, debts[i].minimumPayment, debts[i].debtLife);
        }

        this.state = {
            debts: debts,
            enableSnowball: false
        };

        this.handleAddDebt = this.handleAddDebt.bind(this);
        this.handleExcludedChanged = this.handleExcludedChanged.bind(this);
    }

    handleAddDebt(e, debt) {
        if (!debt.minimumPayment) {
            debt.minimumPayment = DebtCalculator.calculateMinimumPayment(debt.balance, debt.interestRate, debt.debtLife);
        } else if (!debt.debtLife) {
            debt.debtLife = DebtCalculator.calculateDebtLife(debt.balance, debt.interestRate, debt.minimumPayment);
        }

        debt.amortization = DebtCalculator.buildAmortization(debt.balance, debt.interestRate, debt.minimumPayment, debt.debtLife);

        let debts = this.state.debts.slice();
        debts.push(debt);
        this.setState({ debts: debts });
    }

    handleExcludedChanged(e, data) {
        let debts = this.state.debts.slice();
        let debt = debts.find((debt) => { return debt.name === data.debtName; })
        debt.excluded = !debt.excluded;
        this.setState({ debts: debts });
    }

    render() {
        return (
            <div>
                <Segment>
                    <DebtHeader title="Debt Calculator" subHeading="Calculate how long until you are DEBT FREE!" iconName="calculator" />
                </Segment>
                <Segment>
                    <Accordion panels={[
                        { title: 'Add Debt', content: { key: 'addDebt', content: (<DebtForm onAddDebt={this.handleAddDebt} />) } }
                    ] } />
                </Segment>
                <Divider horizontal />
                <DebtList debts={this.state.debts} onExcludedChanged={this.handleExcludedChanged} />
                <Divider horizontal />
                <DebtPayoffSchedule debts={this.state.debts} />
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
            payoffOrder: undefined
        };

        this.addDebt = this.addDebt.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
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
                    <Form.Input name="name" label="Name" placeholder="Name" onChange={this.handleFormChange} />
                </Form.Group>
                <Form.Group>
                    <CurrencyFormField name="balance" label="Balance" onChange={this.handleFormChange} />
                    <PercentageFormField name="interestRate" label="Interest Rate" onChange={this.handleFormChange} />
                </Form.Group>
                <Form.Group>
                    <CurrencyFormField name="minimumPayment" label="Minimum Payment" onChange={this.handleFormChange} />
                    <Form.Input name="debtLife" type="number" label="Life of Debt" placeholder="Life of debt" onChange={this.handleFormChange} />
                </Form.Group>
                <Form.Group>
                    <Form.Field>
                        <label>Exclude</label>
                        <Checkbox name="excluded" toggle onChange={this.handleFormChange} />
                    </Form.Field>
                    <Form.Input name="payoffOrder" type="number" label="Payoff Order" placeholder="Payoff Order" onChange={this.handleFormChange} />
                </Form.Group>
                <Button type='submit' onClick={this.addDebt}>Add</Button>
            </Form>
        );
    }
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
            <Table.HeaderCell>Payoff Order</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
            {
              props.debts.map((debt) =>
                <Debt key={debt.name} {...debt} onExcludedChanged={props.onExcludedChanged} />
              )
            }
        </Table.Body>
      </Table>
    );
}

class Debt extends Component {
    constructor(props) {
        super(props);

        this.handleExcludedChanged = this.handleExcludedChanged.bind(this);
    }

    handleExcludedChanged(e, data) {
        data.debtName = this.props.name;
        this.props.onExcludedChanged(e, data);
    }

    render() {
        return (
            <Table.Row>
                <Table.Cell>{this.props.name}</Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.balance} /></Table.Cell>
                <Table.Cell><PercentageFormatter value={this.props.interestRate} /></Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.minimumPayment} /></Table.Cell>
                <Table.Cell>{Math.ceil(this.props.debtLife)}</Table.Cell>
                <Table.Cell><Checkbox toggle checked={this.props.excluded} onChange={this.handleExcludedChanged} /></Table.Cell>
                <Table.Cell>{this.props.payoffOrder}</Table.Cell>
            </Table.Row>
        );
    }
}

class DebtPayoffSchedule extends Component {
    generateAmortization(debts) {
        let includedDebts = debts.filter((debt) => !debt.excluded).slice();
        let amortization = [];

        if (includedDebts.length > 0) {
            amortization = JSON.parse(JSON.stringify(includedDebts[0].amortization));

            let finalAmortizationLength = amortization.length;
            let debtsLength = includedDebts.length;

            for (let i = 1, j = 0, currentAmortizationLength = 0; i < debtsLength; i++) {

                currentAmortizationLength = includedDebts[i].amortization.length;

                for (j = 0; j < currentAmortizationLength && j < finalAmortizationLength; j++) {
                    amortization[j].paymentNumber = includedDebts[i].amortization[j].paymentNumber;
                    amortization[j].beginningBalance = amortization[j].beginningBalance + includedDebts[i].amortization[j].beginningBalance;
                    amortization[j].interest += includedDebts[i].amortization[j].interest;
                    amortization[j].principal += includedDebts[i].amortization[j].principal;
                    amortization[j].endingBalance += includedDebts[i].amortization[j].endingBalance;
                }

                if (currentAmortizationLength > finalAmortizationLength) {
                    amortization = amortization.concat(JSON.parse(JSON.stringify(includedDebts[i].amortization.slice(j))));
                    finalAmortizationLength = currentAmortizationLength;
                }
            }
        }

        return amortization;
    }

    render() {
        const amortization = this.generateAmortization(this.props.debts);

        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Payment #</Table.HeaderCell>
                        <Table.HeaderCell>Beginning Balance</Table.HeaderCell>
                        <Table.HeaderCell>Interest</Table.HeaderCell>
                        <Table.HeaderCell>Principal</Table.HeaderCell>
                        <Table.HeaderCell>Ending Balance</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        amortization.map((payment) =>
                            <DebtPayment key={payment.paymentNumber} {...payment} />
                        )
                    }
                </Table.Body>
            </Table>
        );
    }
}

function DebtPayment(props) {
    return (
        <Table.Row>
            <Table.Cell>{props.paymentNumber}</Table.Cell>
            <Table.Cell><CurrencyFormatter value={props.beginningBalance} /></Table.Cell>
            <Table.Cell><CurrencyFormatter value={props.interest} /></Table.Cell>
            <Table.Cell><CurrencyFormatter value={props.principal} /></Table.Cell>
            <Table.Cell><CurrencyFormatter value={props.endingBalance} /></Table.Cell>
        </Table.Row>
    );
}

export default DebtCalculatorApp;