import React, { Component } from 'react';
import { Accordion, Button, Card, Checkbox, Divider, Dropdown, Form, Grid, Header, Icon, Modal, Segment, Statistic, Table } from 'semantic-ui-react';
import { CurrencyFormatter, CurrencyFormField, PercentageFormatter, PercentageFormField } from './Formatting.js';
import { DebtList } from './DebtList.js';
import { DebtCalculator } from './DebtCalculator.js';
import { SortDirection } from './SortDirection.js';
import './Debt.css';
import Transition from 'semantic-ui-react/dist/commonjs/modules/Transition/Transition';

class DebtCalculatorApp extends Component {
    constructor(props) {
        super(props);

        let debtList = new DebtList([
            { name: "Home Depot", balance: 1200.00, interestRate: .085, minimumPayment: 54.00, debtLife: 24.265, interest: 110.38, included: true, payoffOrder: "1", amortization: [] },
            { name: "Medical Bill", balance: 3000.00, interestRate: 0.0, minimumPayment: 250.00, debtLife: 12, interest: 0.0, included: true, payoffOrder: "2", amortization: [] },
            { name: "American Express", balance: 5700.00, interestRate: .12, minimumPayment: 102.00, debtLife: 82.239, interest: 2688.46, included: true, payoffOrder: "3", amortization: [] },
            { name: "Student Loan", balance: 12500.00, interestRate: 0.08, minimumPayment: 151.66, debtLife: 120, interest: 5699.03, included: true, payoffOrder: "4", amortization: [] },
            { name: "Toyota", balance: 17800.00, interestRate: 0.15, minimumPayment: 617.05, debtLife: 36, interest: 4413.5, included: true, payoffOrder: "5", amortization: [] }
        ]);

        const enableSnowball = false;
        const extraPayment = 0.0;

        debtList.buildAmortizations(enableSnowball, extraPayment);
        const amortization = debtList.aggregateAmortization;

        this.state = {
            addingDebt: false,
            debtList: debtList,
            debtFilter: undefined,
            enableSnowball: false,
            extraPayment: 0.0,
            sortedColumn: undefined,
            sortDirection: SortDirection.none,
            amortization: amortization
        };

        this.handleAddDebt = this.handleAddDebt.bind(this);
        this.handleCardClick = this.handleCardClick.bind(this);
        this.handleDebtFormShow = this.handleDebtFormShow.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleIncludedChanged = this.handleIncludedChanged.bind(this);
        this.handleSnowballChanged = this.handleSnowballChanged.bind(this);
        this.handleSortByColumn = this.handleSortByColumn.bind(this);
    }

    setState(newState) {
        let debtList = undefined;

        if (newState.debtList || newState.extraPayment || (newState.enableSnowball !== undefined)) {
            const debtFilter = newState.hasOwnProperty("debtFilter") ? newState.debtFilter : this.state.debtFilter;
            const enableSnowball = (newState.enableSnowball === undefined) ? this.state.enableSnowball : newState.enableSnowball;
            const extraPayment = (newState.extraPayment) ? newState.extraPayment : this.state.extraPayment;
            debtList = (newState.debtList) ? newState.debtList : new DebtList(JSON.parse(JSON.stringify(this.state.debtList.debts)));

            debtList.buildAmortizations(enableSnowball, extraPayment);
            newState.debtList = debtList;
            newState.amortization =
                debtFilter ? debtList.debts.find((debt) => { return debt.name === debtFilter; }).newAmortization :
                    debtList.aggregateAmortization;
        } else if (newState.hasOwnProperty("debtFilter")) {
            debtList = JSON.parse(JSON.stringify(this.state.debtList));
            newState.amortization =
                newState.debtFilter ? debtList.debts.find((debt) => { return debt.name === newState.debtFilter; }).newAmortization :
                    debtList.aggregateAmortization;
        }

        super.setState(newState);
    }

    handleAddDebt(e, debt) {
        let debtList = new DebtList(JSON.parse(JSON.stringify(this.state.debtList.debts)));
        debtList.add(debt);
        this.setState({
            debtList: debtList,
            addingDebt: false
        });
    }

    handleDebtFormShow(e) {
        const addingDebt = this.state.addingDebt;

        this.setState({ addingDebt: !addingDebt});
    }

    handleCardClick(e, data) {
        let debtFilter = this.state.debtFilter;
        debtFilter = (debtFilter === data.debtName) ? undefined : data.debtName;
        this.setState({ debtFilter });
    }

    handleIncludedChanged(e, data) {
        let debtList = new DebtList(JSON.parse(JSON.stringify(this.state.debtList.debts)));
        debtList.toggleIncludeFlag(data.debtName);
        this.setState({ debtList: debtList });
    }

    handleSnowballChanged(e, data) {
        let enableSnowball = this.state.enableSnowball;

        this.setState({ enableSnowball: !enableSnowball });
    }

    handleFormChange(e, data) {
        let value = undefined;

        if (data.type === "checkbox") {
            value = data.checked;
        } else if (data.type === "number") {
            value = parseFloat(data.value);
        } else if ((data.type === undefined) && data.options) {
            const sortData = data.value.split(" ");

            this.handleSortByColumn(e, { sortedColumn: sortData[0], sortDirection: sortData[1] })
        } else {
            value = data.value;
        }

        if (value !== undefined) {
            this.setState({
                [data.name]: value
            });
        }
    }

    handleSortByColumn(e, data) {
        let currentSortedColumn = this.state.sortedColumn;
        let sortDirection = this.state.sortDirection;

        if (data.sortDirection) {
            sortDirection = parseInt(data.sortDirection, 10);
        } else {
            sortDirection = (data.sortedColumn === currentSortedColumn) ? (sortDirection + 1) % 3 : SortDirection.ascending;
        }

        let debtList = new DebtList(JSON.parse(JSON.stringify(this.state.debtList.debts)));
        debtList.sort(data.sortedColumn, sortDirection);

        this.setState({
            sortedColumn: data.sortedColumn,
            sortDirection: sortDirection,
            debtList: debtList
        });
    }

    render() {
        return (
            <Segment>
                <DebtHeading title="Debt Calculator" subHeading="Calculate how long until you are DEBT FREE!" iconName="calculator" />
                <Divider />
                <DebtSummary {...this.state.debtList.amortizationSummary} />
                <DebtCards debts={this.state.debtList.debts} debtFilter={this.state.debtFilter} sortedColumn={this.state.sortedColumn} sortDirection={this.state.sortDirection}
                    onAddDebtClick={this.handleDebtFormShow} onCardClick={this.handleCardClick} onSortByColumn={this.handleSortByColumn} onIncludedChanged={this.handleIncludedChanged} /> 
                <Transition animation="swing up" duration={800} visible={this.state.addingDebt}>
                    <Modal open={this.state.addingDebt} onClose={this.handleDebtFormShow}>
                        <Modal.Header>
                            Add a debt
                            <h4>Please fill out the form to include a debt in your debt-free plan!</h4>
                        </Modal.Header>
                        <Modal.Content>
                            <DebtForm onAddDebt={this.handleAddDebt} />
                        </Modal.Content>
                    </Modal>
                </Transition>
                <Divider horizontal />
                <Header as="h2" attached="top" inverted content="Details" />
                <Segment attached>
                    <Segment>
                        <Accordion panels={[ {
                            title: "Payoff Settings",
                            content: {
                                key: 'payoffSettings',
                                content: (<DebtPayoffSettings enableSnowball={this.state.enableSnowball} onFormChange={this.handleFormChange} />)
                            }
                        } ]} />
                    </Segment>
                    <DebtPayoffSchedule amortization={this.state.amortization} enableSnowball={this.state.enableSnowball} extraPayment={this.state.extraPayment} />
                </Segment>
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

class DebtSummary extends Component {

    render() {
        return (
            <Segment>
                <Grid columns="six">
                    <Grid.Row>
                        <Grid.Column>
                            <Statistic size="tiny">
                                <Statistic.Label>Total Debt</Statistic.Label>
                                <Statistic.Value><CurrencyFormatter value={this.props.totalDebt} /></Statistic.Value>
                            </Statistic>
                        </Grid.Column>
                        <Grid.Column>
                            <Statistic size="tiny">
                                <Statistic.Label>Total Payment</Statistic.Label>
                                <Statistic.Value><CurrencyFormatter value={this.props.totalPayment} /></Statistic.Value>
                            </Statistic>
                        </Grid.Column>
                        <Grid.Column>
                            <Statistic size="tiny">
                                <Statistic.Label>Interest</Statistic.Label>
                                <Statistic.Value><CurrencyFormatter value={this.props.expectedInterest} /></Statistic.Value>
                            </Statistic>
                        </Grid.Column>
                        <Grid.Column>
                            <Statistic size="tiny">
                                <Statistic.Label>Interest</Statistic.Label>
                                <Statistic.Value><CurrencyFormatter value={this.props.actualInterest} /></Statistic.Value>
                            </Statistic>
                        </Grid.Column>
                        <Grid.Column>
                            <Statistic size="tiny">
                                <Statistic.Label>Savings</Statistic.Label>
                                <Statistic.Value><CurrencyFormatter value={this.props.expectedInterest - this.props.actualInterest} /></Statistic.Value>
                            </Statistic>
                        </Grid.Column>
                        <Grid.Column>
                            <Statistic size="tiny">
                                <Statistic.Label>{Math.ceil(this.props.actualDebtLife) === 1 ? "Month" : "Months"}</Statistic.Label>
                                <Statistic.Value>{Math.ceil(this.props.actualDebtLife)}</Statistic.Value>
                            </Statistic>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>
        );
    }
}

class DebtForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            name: undefined,
            debtDate: new Date(),
            balance: undefined,
            minimumPayment: undefined,
            interestRate: undefined,
            debtLife: undefined,
            interest: undefined,
            included: true,
            payoffOrder: undefined
        };

        this.addDebt = this.addDebt.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
    }

    addDebt(e) {
        let debt = Object.assign({}, this.state);

        debt.debtDate = (debt.debtDate) ? debt.debtDate : new Date();
        debt.interestRate = debt.interestRate / 100.0;

        if (!debt.minimumPayment) {
            debt.minimumPayment = DebtCalculator.calculateMinimumPayment(debt.balance, debt.interestRate, debt.debtLife);
        } else if (!debt.debtLife) {
            debt.debtLife = DebtCalculator.calculateDebtLife(debt.balance, debt.interestRate, debt.minimumPayment);
        }

        const amortizationResults = DebtCalculator.buildAmortizationWithTotals(debt.balance, debt.interestRate, debt.minimumPayment, debt.debtLife);
        debt.amortization = amortizationResults.amortization;
        debt.interest = amortizationResults.interest;

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
                    <Form.Input required name="name" label="Name" placeholder="Name" width={8} onChange={this.handleFormChange} />
                </Form.Group>
                <Form.Group>
                    <CurrencyFormField required name="balance" label="Balance" width={4} onChange={this.handleFormChange} />
                    <PercentageFormField required name="interestRate" label="Interest Rate" width={4} onChange={this.handleFormChange} />
                </Form.Group>
                <Form.Group>
                    <CurrencyFormField name="minimumPayment" label="Minimum Payment" width={4} onChange={this.handleFormChange} />
                    {/* <Label circular color="blue">Or</Label> */}
                    <Form.Input name="debtLife" type="number" label="Life of Debt" width={4} placeholder="Life of debt" onChange={this.handleFormChange} />
                </Form.Group>
                <Button type='submit' onClick={this.addDebt}>Add</Button>
            </Form>
        );
    }
}
/*
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
            <Table.HeaderCell sorted={((this.props.sortDirection === SortDirection.none) || (this.props.sortedColumn !== this.props.name)) ? null : ((this.props.sortDirection === SortDirection.ascending) ? "ascending" : "descending")}
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
*/
function DebtCards(props) {
    return (
        <Card.Group>
            {
                props.debts.map((debt) =>
                    <DebtCard key={debt.name} {...debt} debtFilter={props.debtFilter} onCardClick={props.onCardClick} onIncludedChanged={props.onIncludedChanged} />
                )
            }
            <Card className="debt" raised onClick={props.onAddDebtClick}>
                <Card.Content>
                    <Card.Header>
                        <div>Add Debt</div>
                        <div className="icon">
                            <Icon name="add circle" size="huge" />
                        </div>
                    </Card.Header>
                </Card.Content>
            </Card>
        </Card.Group>
    );
}

class DebtCard extends Component {
    constructor(props) {
        super(props);

        this.handleCardClicked = this.handleCardClicked.bind(this);
        this.handleIncludedChanged = this.handleIncludedChanged.bind(this);
    }

    handleIncludedChanged(e) {
        this.props.onIncludedChanged(e, { debtName: this.props.name });
    }

    handleCardClicked(e, data) {
        this.props.onCardClick(e, { debtName: this.props.name });
    }

    render() {
        return (
            <Card className="debt" raised color={this.props.name === this.props.debtFilter ? "blue" : undefined} onClick={this.handleCardClicked}>
                <Card.Content>
                    <Checkbox className="include" toggle checked={this.props.included} onChange={this.handleIncludedChanged} />
                    <Card.Header>
                        {this.props.name}
                    </Card.Header>
                    <Card.Meta>
                        Interest Rate <PercentageFormatter value={this.props.interestRate} />
                    </Card.Meta>
                </Card.Content>
                <Card.Content>
                    <Card.Description>
                        <Grid columns="four">
                            <Grid.Row>
                                <Grid.Column>
                                    <div className="debtValue">
                                        <div className="value"><CurrencyFormatter value={this.props.interest} /></div>
                                        <div className="label">Interest</div>
                                    </div>
                                </Grid.Column>
                                <Grid.Column>
                                    <div className="debtValue">
                                        <div className="value"><CurrencyFormatter value={this.props.actualInterest} /></div>
                                        <div className="label">Interest</div>
                                    </div>
                                </Grid.Column>
                                <Grid.Column>
                                    <div className="debtValue">
                                        <div className="value"><CurrencyFormatter value={this.props.interest - this.props.actualInterest} /></div>
                                        <div className="label">Savings</div>
                                    </div>
                                </Grid.Column>
                                <Grid.Column>
                                    <div className="debtValue">
                                        <div className="value">{Math.ceil(this.props.actualDebtLife)}</div>
                                        <div className="label">{Math.ceil(this.props.actualDebtLife) === 1 ? "Month" : "Months"}</div>
                                    </div>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Card.Description>
                </Card.Content>
                <Card.Content extra textAlign="center">
                    <Grid columns="three" divided>
                        <Grid.Row>
                            <Grid.Column>
                                <div className="debtValue">
                                    <div className="value"><CurrencyFormatter value={this.props.balance} /></div>
                                    <div className="label">Balance</div>
                                </div>
                            </Grid.Column>
                            <Grid.Column>
                                <div className="debtValue">
                                    <div className="value"><CurrencyFormatter value={this.props.minimumPayment} /></div>
                                    <div className="label">Payment</div>
                                </div>
                            </Grid.Column>
                            <Grid.Column>
                                <div className="debtValue">
                                    <div className="value">{Math.ceil(this.props.debtLife)}</div>
                                    <div className="label">{Math.ceil(this.props.debtLife) === 1 ? "Month" : "Months"}</div>
                                </div>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Card.Content>
            </Card>
        );
    }
}

function DebtPayoffSettings(props) {
    const payoffMethods = [
        { text: "Quickest", value: "balance " + SortDirection.ascending.toString() },
        { text: "Greatest Savings", value: "interestRate " + SortDirection.descending.toString() }
    ];

    return (
        <Form>
            <Form.Group>
                <Form.Field width="3">
                    <label>Payoff Method</label>
                    <Dropdown placeholder='Select Payoff Method' fluid selection options={payoffMethods} onChange={props.onFormChange} />
                </Form.Field>
                <Form.Field width="3">
                    <label>Enable Snowball Payments</label>
                    <Checkbox name="enableSnowball" toggle checked={props.enableSnowball} onChange={props.onFormChange} />
                </Form.Field>
                <CurrencyFormField name="extraPayment" label="Extra Payment" width="3" onChange={props.onFormChange} />
            </Form.Group>
        </Form>
    );
}

class DebtPayoffSchedule extends Component {
    render() {
        const showExtraPayment = this.props.enableSnowball || (this.props.extraPayment > 0.0);

        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Payment #</Table.HeaderCell>
                        <Table.HeaderCell>Beginning Balance</Table.HeaderCell>
                        <Table.HeaderCell>Interest</Table.HeaderCell>
                        <Table.HeaderCell>Principal</Table.HeaderCell>
                        { showExtraPayment && <Table.HeaderCell>Extra Payment</Table.HeaderCell> }
                        <Table.HeaderCell>Ending Balance</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        this.props.amortization.map((payment) =>
                            <DebtPayment key={payment.paymentNumber} showExtraPayment={showExtraPayment} {...payment} />
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
            { props.showExtraPayment && <Table.Cell><CurrencyFormatter value={props.extraPayment} /></Table.Cell> }
            <Table.Cell><CurrencyFormatter value={props.endingBalance} /></Table.Cell>
        </Table.Row>
    );
}

export default DebtCalculatorApp;