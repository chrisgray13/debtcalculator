/*
Notes:
- Create cards of plan options where the user may select in the basic option.  In advance, go back to what we are currently doing
- Slider for payment to see how it changes savings
- Sticky summary, not sure about mobile
- Pull snowball toggle to summary area
- Create multiple plans to compare against
- When selecting a single debt, include debt name in the details
- Add a payment column instead of extra payment to allow the user to adjust
- After first debt, move header to smaller icon title label in the top left, replace the original header with a prominent total balance and other key indicator below
- Allow the user to drag card order
- Turn into a step-by-step
    1. Add Debts
    2. See Plan
    3. Execute
- unsplash.com

Intent:
- Create a plan
- Motivate the user to stay on target based on their personality, e.g. how long to payoff each debt, how long to be debt free, how much interest they are currently paying, how much they will save, etc.
- Be as easy to use and understand as possible, less thinking more doing
*/
import React, { Component } from 'react';
import { Accordion, Button, Card, Checkbox, Divider, Dropdown, Form, Grid, Header, Icon, Modal, Segment, Statistic, Table } from 'semantic-ui-react';
import { CurrencyFormatter, CurrencyFormField, PercentageFormatter, PercentageFormField } from './Formatting.js';
import { Tooltip } from './Controls.js';
import { Debt } from './Debt.js';
import { DebtList } from './DebtList.js';
import { DebtCalculator } from './DebtCalculator.js';
import { PayoffPlan, SortDirection } from './SortDirection.js';
import './Debt.css';
import Transition from 'semantic-ui-react/dist/commonjs/modules/Transition/Transition';

class DebtCalculatorApp extends Component {
    constructor(props) {
        super(props);

        let debtList = new DebtList([
            { name: "Home Depot", balance: 1200.00, interestRate: .085, minimumPayment: 54.00, debtLife: 24.265, interest: 110.38, included: true, payoffOrder: 1, amortization: [] },
            { name: "Medical Bill", balance: 3000.00, interestRate: 0.0, minimumPayment: 250.00, debtLife: 12, interest: 0.0, included: true, payoffOrder: 2, amortization: [] },
            { name: "American Express", balance: 5700.00, interestRate: .12, minimumPayment: 102.00, debtLife: 82.239, interest: 2688.46, included: true, payoffOrder: 3, amortization: [] },
            { name: "Student Loan", balance: 12500.00, interestRate: 0.08, minimumPayment: 151.66, debtLife: 120, interest: 5699.03, included: true, payoffOrder: 4, amortization: [] },
            { name: "Toyota", balance: 17800.00, interestRate: 0.15, minimumPayment: 617.05, debtLife: 36, interest: 4413.5, included: true, payoffOrder: 5, amortization: [] }
        ]);

        const enableRollingPayments = false;
        const extraPayment = 0.0;

        debtList.buildAmortizations(enableRollingPayments, extraPayment);
        const amortization = debtList.aggregateAmortization;

        this.state = {
            addingDebt: false,
            debtList: debtList,
            debtFilter: undefined,
            enableRollingPayments: false,
            extraPayment: 0.0,
            payoffPlanFilter: undefined,
            sortColumn: undefined,
            sortDirection: SortDirection.none,
            amortization: amortization
        };

        this.handleAddDebt = this.handleAddDebt.bind(this);
        this.handleDebtCardClick = this.handleDebtCardClick.bind(this);
        this.handleDebtFormShow = this.handleDebtFormShow.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleIncludedChanged = this.handleIncludedChanged.bind(this);
        this.handlePlanCardClick = this.handlePlanCardClick.bind(this);
        this.handleSnowballChanged = this.handleSnowballChanged.bind(this);
        this.handleSortByColumn = this.handleSortByColumn.bind(this);
    }

    setState(newState) {
        let debtList = undefined;

        if (newState.debtList || newState.extraPayment || (newState.enableRollingPayments !== undefined)) {
            const debtFilter = newState.hasOwnProperty("debtFilter") ? newState.debtFilter : this.state.debtFilter;
            const enableRollingPayments = (newState.enableRollingPayments === undefined) ? this.state.enableRollingPayments : newState.enableRollingPayments;
            const extraPayment = (newState.extraPayment) ? newState.extraPayment : this.state.extraPayment;
            debtList = (newState.debtList) ? newState.debtList : new DebtList(JSON.parse(JSON.stringify(this.state.debtList.debts)));

            debtList.buildAmortizations(enableRollingPayments, extraPayment);
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

    handleDebtCardClick(e, data) {
        let debtFilter = this.state.debtFilter;
        debtFilter = (debtFilter === data.debtName) ? undefined : data.debtName;
        this.setState({ debtFilter });
    }

    handleIncludedChanged(e, data) {
        let debtList = new DebtList(JSON.parse(JSON.stringify(this.state.debtList.debts)));
        debtList.toggleIncludeFlag(data.debtName);
        this.setState({ debtList: debtList });
    }

    handlePlanCardClick(e, data) {
        let payoffPlanFilter = this.state.payoffPlanFilter;

        if (payoffPlanFilter === data.payoffPlanName) {
            this.setState({
                enableRollingPayments: false,
                payoffPlanFilter: undefined,
                sortColumn: undefined,
                sortDirection: SortDirection.none
            });
        } else {
            const payoffPlan = PayoffPlan[data.payoffPlanName];
            this.setState({
                enableRollingPayments: payoffPlan.enableRollingPayments,
                payoffPlanFilter: payoffPlan.name,
                sortColumn: payoffPlan.sortColumn,
                sortDirection: payoffPlan.sortDirection
            });
        }
    }

    handleSnowballChanged(e, data) {
        let enableRollingPayments = this.state.enableRollingPayments;

        this.setState({ enableRollingPayments: !enableRollingPayments });
    }

    handleFormChange(e, data) {
        let value = undefined;

        if (data.type === "checkbox") {
            value = data.checked;
        } else if (data.type === "number") {
            value = parseFloat(data.value);
        } else if ((data.type === undefined) && data.options) {
            const sortData = PayoffPlan[data.value] ? PayoffPlan[data.value] : PayoffPlan.Minimum;

            this.handleSortByColumn(e, { sortColumn: sortData.sortColumn, sortDirection: sortData.sortDirection })
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
        let currentSortColumn = this.state.sortColumn;
        let sortDirection = this.state.sortDirection;

        if (data.sortDirection) {
            sortDirection = data.sortDirection;
        } else {
            sortDirection = (data.sortColumn === currentSortColumn) ? (sortDirection + 1) % 3 : SortDirection.ascending;
        }

        let debtList = new DebtList(JSON.parse(JSON.stringify(this.state.debtList.debts)));
        debtList.sort(data.sortColumn, sortDirection);

        this.setState({
            sortColumn: data.sortColumn,
            sortDirection: sortDirection,
            debtList: debtList
        });
    }

    render() {
        return (
            <Segment>
                <DebtHeading title="Debt Calculator" subHeading="Calculate how long until you are DEBT FREE!" iconName="calculator" />
                <Divider />
                <Segment>
                    <PayoffPlanCards debts={this.state.debtList.debts} payoffPlanFilter={this.state.payoffPlanFilter} onCardClick={this.handlePlanCardClick} />
                </Segment>
                <DebtSummary {...this.state.debtList.amortizationSummary} />
                <DebtCards debts={this.state.debtList.debts} debtFilter={this.state.debtFilter} sortColumn={this.state.sortColumn} sortDirection={this.state.sortDirection}
                    onAddDebtClick={this.handleDebtFormShow} onCardClick={this.handleDebtCardClick} onSortByColumn={this.handleSortByColumn} onIncludedChanged={this.handleIncludedChanged} /> 
                <Transition animation="swing up" duration={800} visible={this.state.addingDebt}>
                    <Modal open={this.state.addingDebt} onClose={this.handleDebtFormShow}>
                        <Modal.Header>
                            Add a debt
                            <h4>Please fill out the form to include a debt in your debt-free plan!</h4>
                        </Modal.Header>
                        <Modal.Content>
                            <DebtForm key={this.state.debtList.debts.length + 1} onAddDebt={this.handleAddDebt} />
                        </Modal.Content>
                    </Modal>
                </Transition>
                <Divider horizontal />
                <Header as="h2" attached="top" inverted content={"Debt-Free Plan for " + (this.state.debtFilter ? this.state.debtFilter : "All")} />
                <Segment attached>
                    <Segment>
                        <Accordion panels={[ {
                            title: "Payoff Settings",
                            content: {
                                key: 'payoffSettings',
                                content: (<DebtPayoffSettings enableRollingPayments={this.state.enableRollingPayments} payoffPlanFilter={this.state.payoffPlanFilter} onFormChange={this.handleFormChange} />)
                            }
                        } ]} />
                    </Segment>
                    <DebtPayoffSchedule amortization={this.state.amortization} enableRollingPayments={this.state.enableRollingPayments} extraPayment={this.state.extraPayment} />
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

class PayoffPlanCards extends Component {
    render() {
        return (
            <Card.Group>
                <PayoffPlanCard {...this.props} payoffPlan={PayoffPlan.Minimum}>
                    Standard plan making the basic minimum payments on each until paid.  This method will take the longest and cost you the most
                </PayoffPlanCard>
                <PayoffPlanCard {...this.props} payoffPlan={PayoffPlan.QuickestWins}>
                    Optimized plan allowing you to focus on the smallest bills first to gain quick wins to help build momentum.  As debts are paid in full, the payments are rolled into the next debt payment like a snowball rolling down a hill
                </PayoffPlanCard>
                <PayoffPlanCard {...this.props} payoffPlan={PayoffPlan.GreatestSavings}>
                    Maximized plan allowing you to minimize the overall time and cost.  This is not for the faint of heart as it requires grit and determination to stick to the plan until the end
                </PayoffPlanCard>
            </Card.Group>
        );
    }
}

class PayoffPlanCard extends Component {

    constructor(props) {
        super(props);

        this.handleCardClicked = this.handleCardClicked.bind(this);
    }

    handleCardClicked(e, data) {
        this.props.onCardClick(e, { payoffPlanName: this.props.payoffPlan.name });        
    }

    render() {
        let debtList = new DebtList(JSON.parse(JSON.stringify(this.props.debts)));
        debtList.sort(this.props.payoffPlan.sortColumn, this.props.payoffPlan.sortDirection);
        const summary = debtList.getAmortizationSummary(this.props.payoffPlan.enableRollingPayments);

        return (
            <Card className="debt" centered raised color={this.props.payoffPlan.name === this.props.payoffPlanFilter ? "blue" : undefined} onClick={this.handleCardClicked}>
                <Card.Content textAlign="center">
                    <Card.Header>
                        {this.props.payoffPlan.displayText}
                    </Card.Header>
               </Card.Content>
                <Card.Content>
                    <Card.Description>
                        {this.props.children}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <Grid columns="two">
                        <Grid.Row>
                            <Grid.Column>
                                <div className="debtValue">
                                    <div className="value"><CurrencyFormatter value={summary.actualInterest} /></div>
                                    <div className="label">Interest</div>
                                </div>
                            </Grid.Column>
                            <Grid.Column>
                                <div className="debtValue">
                                    <div className="value">{Math.ceil(summary.actualDebtLife)}</div>
                                    <div className="label">{Math.ceil(summary.actualDebtLife) === 1 ? "Month" : "Months"}</div>
                                </div>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Card.Content>
            </Card>
        );
    }
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
            debt: new Debt()
        };

        this.addDebt = this.addDebt.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
    }

    addDebt(e) {
        let debt = Object.assign({}, this.state.debt);

        debt.payoffOrder = this.props.key;
        debt.debtDate = (debt.debtDate) ? debt.debtDate : new Date();
        debt.interestRate = debt.interestRate / 100.0;

        if (!debt.minimumPayment) {
            debt.minimumPayment = DebtCalculator.calculateMinimumPayment(debt.balance, debt.interestRate, debt.debtLife);
        } else if (!debt.debtLife) {
            debt.debtLife = DebtCalculator.calculateDebtLife(debt.balance, debt.interestRate, debt.minimumPayment);
        }

        const amortizationResults = DebtCalculator.buildAmortizationWithTotals(debt.balance, debt.interestRate, debt.minimumPayment, debt.debtLife);
        debt.amortization = amortizationResults.amortization;
        debt.interest = amortizationResults.totals.interest;

        this.props.onAddDebt(e, debt);
    }

    handleFormChange(e, data) {
        let debt = Object.assign({}, this.state.debt);

        if (data.type === "checkbox") {
            debt[data.name] = data.checked;
        } else if (data.type === "number") {
            debt[data.name] = parseFloat(data.value);
        } else {
            debt[data.name] = data.value;
        }

        this.setState({
            debt: debt
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
        this.props.onSortByColumn(e, { sortColumn: this.props.name });
    }

    render() {
        return (
            <Table.HeaderCell sorted={((this.props.sortDirection === SortDirection.none) || (this.props.sortColumn !== this.props.name)) ? null : ((this.props.sortDirection === SortDirection.ascending) ? "ascending" : "descending")}
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
            <SortableColumnHeader name="balance" sortColumn={props.sortColumn} sortDirection={props.sortDirection} onSortByColumn={props.onSortByColumn}>Balance</SortableColumnHeader>
            <SortableColumnHeader name="interestRate" sortColumn={props.sortColumn} sortDirection={props.sortDirection} onSortByColumn={props.onSortByColumn}>Interest Rate</SortableColumnHeader>
            <Table.HeaderCell>Minimum Payment</Table.HeaderCell>
            <Table.HeaderCell>Life of Debt</Table.HeaderCell>
            <SortableColumnHeader name="payoffOrder" sortColumn={props.sortColumn} sortDirection={props.sortDirection} onSortByColumn={props.onSortByColumn}>Payoff Order</SortableColumnHeader>
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
                            <Icon name="add circle" size="massive" />
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
        e.stopPropagation();
        
        this.props.onIncludedChanged(e, { debtName: this.props.name });
    }

    handleCardClicked(e, data) {
        this.props.onCardClick(e, { debtName: this.props.name });
    }

    render() {
        return (
            <Card className="debt" raised color={this.props.name === this.props.debtFilter ? "blue" : undefined} onClick={this.handleCardClicked}>
                <Card.Content>
                    <Tooltip className="include" text={"Click to " + (this.props.included ? " exclude" : "include")}>
                        <Checkbox toggle checked={this.props.included} onChange={this.handleIncludedChanged} />
                    </Tooltip>
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
    const payoffPlans = [
        { text: PayoffPlan.Minimum.displayText, value: PayoffPlan.Minimum.name },
        { text: PayoffPlan.QuickestWins.displayText, value: PayoffPlan.QuickestWins.name },
        { text: PayoffPlan.GreatestSavings.displayText, value: PayoffPlan.GreatestSavings.name }
    ];

    return (
        <Form>
            <Form.Group>
                <Form.Field width="3">
                    <label>Payoff Method</label>
                    <Dropdown placeholder='Select Payoff Method' fluid selection options={payoffPlans} value={props.payoffPlanFilter} onChange={props.onFormChange} />
                </Form.Field>
                <Form.Field width="3">
                    <label>Enable Rolling Payments</label>
                    <Checkbox name="enableRollingPayments" toggle checked={props.enableRollingPayments} onChange={props.onFormChange} />
                </Form.Field>
                <CurrencyFormField name="extraPayment" label="Extra Payment" width="3" onChange={props.onFormChange} />
            </Form.Group>
        </Form>
    );
}

class DebtPayoffSchedule extends Component {
    render() {
        const showExtraPayment = this.props.enableRollingPayments || (this.props.extraPayment > 0.0);

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