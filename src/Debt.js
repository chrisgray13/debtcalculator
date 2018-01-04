import React, { Component } from 'react';
import './Debt.css';
import { Accordion, Button, Checkbox, Divider, Form, Header, Icon, Segment, Table } from 'semantic-ui-react';
import { CurrencyFormatter, CurrencyFormField, PercentageFormatter, PercentageFormField } from './Formatting.js';
import { DebtCalculator } from './DebtCalculator.js';

class DebtCalculatorApp extends Component {
    constructor(props) {
        let debts = [
            { name: "Home Depot", balance: 1200.00, interestRate: .085, minimumPayment: 54.00, debtLife: 24.265, included: true, payoffOrder: "1", amortization: [] },
            { name: "Medical Bill", balance: 3000.00, interestRate: 0.0, minimumPayment: 250.00, debtLife: 12, included: true, payoffOrder: "2", amortization: [] },
            { name: "American Express", balance: 5700.00, interestRate: .12, minimumPayment: 102.00, debtLife: 82.239, included: true, payoffOrder: "3", amortization: [] },
            { name: "Student Loan", balance: 12500.00, interestRate: 0.08, minimumPayment: 151.66, debtLife: 120, included: true, payoffOrder: "4", amortization: [] },
            { name: "Toyota", balance: 17800.00, interestRate: 0.15, minimumPayment:  617.05, debtLife: 36, included: true, payoffOrder: "5", amortization: [] }
        ];

        super(props);

        for (let i = 0, length = debts.length; i < length; i++) {
            debts[i].amortization = DebtCalculator.buildAmortization(debts[i].balance, debts[i].interestRate, debts[i].minimumPayment, debts[i].debtLife);
        }

        this.state = {
            debts: debts,
            enableSnowball: false,
            sortedColumn: undefined,
            sortDirection: 0
        };

        this.handleAddDebt = this.handleAddDebt.bind(this);
        this.handleIncludedChanged = this.handleIncludedChanged.bind(this);
        this.handleSnowballChanged = this.handleSnowballChanged.bind(this);
        this.handleSortByColumn = this.handleSortByColumn.bind(this);
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

    handleIncludedChanged(e, data) {
        let debts = this.state.debts.slice();
        let debt = debts.find((debt) => { return debt.name === data.debtName; })
        debt.included = !debt.included;
        this.setState({ debts: debts });
    }

    handleSnowballChanged(e, data) {
        let enableSnowball = this.state.enableSnowball;

        this.setState({ enableSnowball: !enableSnowball });
    }

    handleSortByColumn(e, data) {
        let currentSortedColumn = this.state.sortedColumn;
        let sortDirection = this.state.sortDirection;

        sortDirection = (data.sortedColumn === currentSortedColumn) ? (sortDirection + 1) % 3 : 1;

        let debts = this.state.debts.slice();

        debts.sort((a, b) => {
            if (sortDirection === 2) {
                return b[data.sortedColumn] - a[data.sortedColumn];
            } else if (sortDirection === 1) {
                return a[data.sortedColumn] - b[data.sortedColumn];
            } else {
                return a["payoffOrder"] - b["payoffOrder"];
            }
        });

        this.setState({
            sortedColumn: data.sortedColumn,
            sortDirection: sortDirection,
            debts: debts
        });
    }

    render() {
        return (
            <Segment>
                <Segment>
                    <DebtHeading title="Debt Calculator" subHeading="Calculate how long until you are DEBT FREE!" iconName="calculator" />
                </Segment>
                <Segment>
                    <Accordion panels={[
                        { title: 'Add Debt', content: { key: 'addDebt', content: (<DebtForm onAddDebt={this.handleAddDebt} />) } }
                    ] } />
                </Segment>
                <Divider horizontal />
                <DebtList debts={this.state.debts} sortedColumn={this.state.sortedColumn} sortDirection={this.state.sortDirection}
                    onSortByColumn={this.handleSortByColumn} onIncludedChanged={this.handleIncludedChanged} />
                <Divider horizontal />
                <Segment>
                    <Checkbox name="included" toggle checked={this.state.enableSnowball} label="Enable Snowball Payments" onChange={this.handleSnowballChanged} />
                </Segment>
                <DebtPayoffSchedule debts={this.state.debts} enableSnowball={this.state.enableSnowball} />
            </Segment>
        );
    }
}

function DebtHeading(props) {
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
            included: true,
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

        if (data.type === "checkbox") {
            value = data.checked;
        } else if (data.type === "number") {
            value = parseFloat(data.value);
        } else {
            value = data.value;
        }

        this.setState({
            [data.name]: value
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
                    <Form.Input name="payoffOrder" type="number" label="Payoff Order" placeholder="Payoff Order" onChange={this.handleFormChange} />
                    <Form.Field>
                        <label>Include</label>
                        <Checkbox name="included" toggle checked={this.state.included} onChange={this.handleFormChange} />
                    </Form.Field>
                </Form.Group>
                <Button type='submit' onClick={this.addDebt}>Add</Button>
            </Form>
        );
    }
}

class SortableColumnHeader extends Component {

    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        this.props.onSortByColumn(e, { sortedColumn: this.props.name });
    }

    render() {
        return (
            <Table.HeaderCell sorted={((this.props.sortDirection === 0) || (this.props.sortedColumn !== this.props.name)) ? null : ((this.props.sortDirection === 1) ? "ascending" : "descending")}
                onClick={this.handleClick}>{this.props.children}</Table.HeaderCell>
        );
    }
}

function DebtList(props) {
    return (
      <Table sortable celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <SortableColumnHeader name="balance" sortedColumn={props.sortedColumn} sortDirection={props.sortDirection} onSortByColumn={props.onSortByColumn}>Balance</SortableColumnHeader>
            <SortableColumnHeader name="interestRate" sortedColumn={props.sortedColumn} sortDirection={props.sortDirection} onSortByColumn={props.onSortByColumn}>Interest Rate</SortableColumnHeader>
            <Table.HeaderCell>Minimum Payment</Table.HeaderCell>
            <Table.HeaderCell>Life of Debt</Table.HeaderCell>
            <SortableColumnHeader name="payoffOrder" sortedColumn={props.sortedColumn} sortDirection={props.sortDirection} onSortByColumn={props.onSortByColumn}>Payoff Order</SortableColumnHeader>
            <Table.HeaderCell>Include</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
            {
              props.debts.map((debt) =>
                <Debt key={debt.name} {...debt} onIncludedChanged={props.onIncludedChanged} />
              )
            }
        </Table.Body>
        <Table.Footer>
            <DebtFooter debts={props.debts} />
        </Table.Footer>
      </Table>
    );
}

class Debt extends Component {
    constructor(props) {
        super(props);

        this.handleIncludedChanged = this.handleIncludedChanged.bind(this);
    }

    handleIncludedChanged(e) {
        this.props.onIncludedChanged(e, { debtName: this.props.name });
    }

    render() {
        return (
            <Table.Row>
                <Table.Cell>{this.props.name}</Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.balance} /></Table.Cell>
                <Table.Cell><PercentageFormatter value={this.props.interestRate} /></Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.minimumPayment} /></Table.Cell>
                <Table.Cell>{Math.ceil(this.props.debtLife)}</Table.Cell>
                <Table.Cell>{this.props.payoffOrder}</Table.Cell>
                <Table.Cell><Checkbox toggle checked={this.props.included} onChange={this.handleIncludedChanged} /></Table.Cell>
            </Table.Row>
        );
    }
}

class DebtFooter extends Component {

    render() {
        let balance = 0, minimumPayment = 0, debtLife = 0, count = 0;

        this.props.debts.forEach((debt) => {
            if (debt.included) {
                balance += debt.balance;
                minimumPayment += debt.minimumPayment;
                debtLife = Math.max(debtLife, Math.ceil(debt.debtLife));
                count++;
            }
        });

        return (
            <Table.Row>
                <Table.HeaderCell>Total</Table.HeaderCell>
                <Table.HeaderCell><CurrencyFormatter value={balance} /></Table.HeaderCell>
                <Table.HeaderCell><PercentageFormatter value={.08} /></Table.HeaderCell>
                <Table.HeaderCell><CurrencyFormatter value={minimumPayment} /></Table.HeaderCell>
                <Table.HeaderCell>{debtLife}</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
                <Table.HeaderCell>{count}</Table.HeaderCell>
            </Table.Row>
            );
    }
}

class DebtPayoffSchedule extends Component {
    render() {
        const amortization = DebtCalculator.buildAggregateAmortization(this.props.debts, this.props.enableSnowball);

        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Payment #</Table.HeaderCell>
                        <Table.HeaderCell>Beginning Balance</Table.HeaderCell>
                        <Table.HeaderCell>Interest</Table.HeaderCell>
                        <Table.HeaderCell>Principal</Table.HeaderCell>
                        <Table.HeaderCell>Snowball Payment</Table.HeaderCell>
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
            <Table.Cell><CurrencyFormatter value={props.snowballPayment} /></Table.Cell>
            <Table.Cell><CurrencyFormatter value={props.endingBalance} /></Table.Cell>
        </Table.Row>
    );
}

export default DebtCalculatorApp;