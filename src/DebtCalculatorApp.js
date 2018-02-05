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

Components:
- Debt List
- Amortization Summary
- Amortization Schedule

Intent:
- Create a plan
- Motivate the user to stay on target based on their personality, e.g. how long to payoff each debt, how long to be debt free, how much interest they are currently paying, how much they will save, etc.
- Be as easy to use and understand as possible, less thinking more doing
*/
import React, { Component } from 'react';
import { Accordion, Button, Card, Checkbox, Divider, Form, Grid, Header, Icon, Input, Label, Modal, Progress, Segment, Statistic, Table } from 'semantic-ui-react';
import { CurrencyFormatter, CurrencyFormField, CurrencyInput, PercentageFormatter, PercentageFormField, SimpleDateFormatter } from './Formatting.js';
import { Tooltip } from './Controls.js';
import { Debt } from './Debt.js';
import { DebtList } from './DebtList.js';
import { DebtCalculator } from './DebtCalculator.js';
import { PayoffPlan, SortDirection } from './SortDirection.js';
import { SimpleDate } from './SimpleDate.js';
import './Debt.css';
import Transition from 'semantic-ui-react/dist/commonjs/modules/Transition/Transition';

class DebtCalculatorApp extends Component {
    constructor(props) {
        super(props);

        let debtList = new DebtList([
            { name: "Home Depot", createdDate: '2017-01', balance: 1200.00, interestRate: .085, minimumPayment: 54.00, debtLife: 24.265, interest: 110.38, included: true, payoffOrder: 1, extraPrincipalPayments: {} },
            { name: "Medical Bill", createdDate: '2017-01', balance: 3000.00, interestRate: 0.0, minimumPayment: 250.00, debtLife: 12, interest: 0.0, included: true, payoffOrder: 2, extraPrincipalPayments: {} },
            { name: "American Express", createdDate: '2017-01', balance: 5700.00, interestRate: .12, minimumPayment: 102.00, debtLife: 82.239, interest: 2688.46, included: true, payoffOrder: 3, extraPrincipalPayments: {} },
            { name: "Student Loan", createdDate: '2017-01', balance: 12500.00, interestRate: 0.08, minimumPayment: 151.66, debtLife: 120, interest: 5699.03, included: true, payoffOrder: 4, extraPrincipalPayments: {} },
            { name: "Toyota", createdDate: '2017-11', balance: 17800.00, interestRate: 0.15, minimumPayment: 617.05, debtLife: 36, interest: 4413.5, included: true, payoffOrder: 5, extraPrincipalPayments: { "2017-12": 100.00, "2018-02": 125.00 } }
        ]);

        const enableRollingPayments = false;
        const extraPrincipalPayment = 0.0;

        debtList.buildAmortizations(enableRollingPayments, extraPrincipalPayment);

        this.state = {
            addingDebt: false,
            debts: debtList.debts,
            debtFilter: undefined,
            sortColumn: undefined,
            sortDirection: SortDirection.none,
            summary: debtList.amortization.summary,
            amortization: debtList.amortization.payments,
            payoffPlanFilter: undefined,
            enableRollingPayments: enableRollingPayments,
            extraPrincipalPayment: extraPrincipalPayment
        };

        this.handleAddDebt = this.handleAddDebt.bind(this);
        this.handleAddExtraPrincipalPayment = this.handleAddExtraPrincipalPayment.bind(this);
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

        if (newState.hasOwnProperty("sortColumn") || newState.hasOwnProperty("sortDirection")) {
            debtList = new DebtList(JSON.parse(JSON.stringify(newState.debts ? newState.debts : this.state.debts)));
            debtList.sort(newState.sortColumn, newState.sortDirection);
            newState.debts = debtList.debts;
        }

        if (newState.hasOwnProperty("debts") || newState.hasOwnProperty("extraPrincipalPayment") || newState.hasOwnProperty("enableRollingPayments")) {
            const enableRollingPayments = newState.hasOwnProperty("enableRollingPayments") ? newState.enableRollingPayments : this.state.enableRollingPayments;
            const extraPrincipalPayment = newState.hasOwnProperty("extraPrincipalPayment") ? newState.extraPrincipalPayment : this.state.extraPrincipalPayment;

            if (!debtList) {
                debtList = new DebtList(JSON.parse(JSON.stringify(newState.debts ? newState.debts : this.state.debts)));
            }

            debtList.buildAmortizations(enableRollingPayments, extraPrincipalPayment);
            newState.debts = debtList.debts;
        }
        
        if (newState.hasOwnProperty("debts") || newState.hasOwnProperty("debtFilter")) {
            if (!debtList) {
                debtList = new DebtList(JSON.parse(JSON.stringify(newState.debts ? newState.debts : this.state.debts)));
            }

            const enableRollingPayments = newState.hasOwnProperty("enableRollingPayments") ? newState.enableRollingPayments : this.state.enableRollingPayments;
            const extraPrincipalPayment = newState.hasOwnProperty("extraPrincipalPayment") ? newState.extraPrincipalPayment : this.state.extraPrincipalPayment;
            const debtFilter = newState.hasOwnProperty("debtFilter") ? newState.debtFilter : this.state.debtFilter;
            const amortization = debtList.getAmortization(enableRollingPayments, extraPrincipalPayment, debtFilter);
            newState.amortization = amortization.payments;
            newState.summary = amortization.summary;
        }

        super.setState(newState);
    }

    handleAddDebt(e, debt) {
        let debts = JSON.parse(JSON.stringify(this.state.debts));
        debts.add(debt);
        this.setState({
            debts: debts,
            addingDebt: false
        });
    }

    handleAddExtraPrincipalPayment(e, payment) {
        let debtList = new DebtList(JSON.parse(JSON.stringify(this.state.debts)));
        const debtFilter = this.state.debtFilter;

        debtList.addExtraPrincipalPayment(debtFilter, payment);

        this.setState({
            debts: debtList.debts
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
        let debtList = new DebtList(JSON.parse(JSON.stringify(this.state.debts)));
        debtList.toggleIncludeFlag(data.debtName);
        this.setState({ debts: debtList.debts });
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

        this.setState({
            sortColumn: data.sortColumn,
            sortDirection: sortDirection
        });
    }

    render() {
        return (
            <div>
                <div className="sticky">
                    <div className="heading">
                        <DebtHeading title="Debt Calculator" compact={this.state.debts.length > 0}
                            subHeading="Calculate how long until you are DEBT FREE!" iconName="calculator"
                            summary={this.state.summary} />
                    </div>
                </div>
                <div className="mainContent">
                    <DebtSummary {...this.state.summary}>
                        <div className="container separator">
                            <Accordion panels={[{
                                title: "Debt Details",
                                content: {
                                    key: 'debtDetails',
                                    content: (
                                        <DebtCards debts={this.state.debts} debtFilter={this.state.debtFilter}
                                            sortColumn={this.state.sortColumn} sortDirection={this.state.sortDirection}
                                            onAddDebtClick={this.handleDebtFormShow} onCardClick={this.handleDebtCardClick}
                                            onSortByColumn={this.handleSortByColumn} onIncludedChanged={this.handleIncludedChanged} /> 
                                    )
                                }
                            }]} />
                        </div>
                    </DebtSummary>
                    <Transition animation="swing up" duration={800} visible={this.state.addingDebt}>
                        <Modal open={this.state.addingDebt} onClose={this.handleDebtFormShow}>
                            <Modal.Header>
                                Add a debt
                                <h4>Please fill out the form to include a debt in your debt-free plan!</h4>
                            </Modal.Header>
                            <Modal.Content>
                                <DebtForm key={this.state.debts.length + 1} onAddDebt={this.handleAddDebt} />
                            </Modal.Content>
                        </Modal>
                    </Transition>
                    <Divider horizontal />
                    <Header as="h2" attached="top" inverted content={"Debt-Free Plan for " + (this.state.debtFilter ? this.state.debtFilter : "All")} />
                    <Segment attached>
                        <Segment>
                            <Accordion panels={[ {
                                title: "Debt Free Plans",
                                content: {
                                    key: 'debtFreePlans',
                                    content: (
                                        <PayoffPlanCards debts={this.state.debts} payoffPlanFilter={this.state.payoffPlanFilter}
                                            onCardClick={this.handlePlanCardClick} />
                                    )
                                }
                            } ]} />
                        </Segment>
                        <DebtPayoffSchedule amortization={this.state.amortization} enableEditMode={this.state.debtFilter !== undefined}
                            enableRollingPayments={this.state.enableRollingPayments} extraPrincipalPayment={this.state.extraPrincipalPayment}
                            onAddExtraPrincipalPayment={this.handleAddExtraPrincipalPayment} />
                    </Segment>
                </div>
            </div>
        );
    }
}

function DebtHeading(props) {
    return (
        <div>
            {!props.compact && <DebtTitleHeading {...props} />}
            {props.compact &&
                <React.Fragment>
                    <div className="left">
                        <DebtTitleCompactHeading title={props.title} iconName={props.iconName} />
                    </div>
                {props.summary.remainingBalance ? <DebtTitleInfoHeading {...props} /> : <DebtFreeHeading />}
                </React.Fragment>   
            }
        </div>
    );
}

function DebtTitleHeading(props) {
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

function DebtTitleCompactHeading(props) {
    return (
        <Header as="h3" textAlign="left">
            <Icon name={props.iconName} />
            {props.title}
        </Header>
    );
}

function DebtTitleInfoHeading(props) {
    return (
        <Header as="h1" textAlign="center">
            <span className="focalText"><CurrencyFormatter value={props.summary.remainingBalance} /></span>
            <Header.Subheader>
                {props.summary.remainingLife} {Math.ceil(props.summary.actualDebtLife) === 1 ? "month" : "months"} to go!
            </Header.Subheader>
            <div className="indicator">
                <Progress percent={Math.round((1.0 - (props.summary.remainingBalance / props.summary.totalDebt)) * 100.0)} size="small" color="blue" />
            </div>
        </Header>
    );
}

function DebtFreeHeading(props) {
    return (
        <Header as="h1" textAlign="center">
            <span className="focalText">DEBT FREE!</span>
        </Header>
    );
}

class PayoffPlanCards extends Component {
    render() {
        const {payoffPlanFilter, ...others} = {...this.props};

        return (
            <Card.Group>
                <PayoffPlanCard {...others} payoffPlanFilter={payoffPlanFilter || PayoffPlan.Minimum.name} payoffPlan={PayoffPlan.Minimum}>
                    Standard plan making the basic minimum payments on each until paid.  This method 
                    will take the longest and cost you the most<br /><br /><br /><br />
                </PayoffPlanCard>
                <PayoffPlanCard {...others} payoffPlanFilter={payoffPlanFilter} payoffPlan={PayoffPlan.QuickestWins}>
                    Optimized plan allowing you to focus on the smallest bills first to gain quick
                    wins to help build momentum.  As debts are paid in full, the payments are rolled 
                    into the next debt payment like a snowball rolling down a hill
                </PayoffPlanCard>
                <PayoffPlanCard {...others} payoffPlanFilter={payoffPlanFilter} payoffPlan={PayoffPlan.GreatestSavings}>
                    Maximized plan allowing you to minimize the overall time and cost.  This is not 
                    for the faint of heart as it requires grit and determination to stick to the plan 
                    until the end<br /><br />
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
        const amortization = debtList.getAmortization(this.props.payoffPlan.enableRollingPayments);

        return (
            <Card className="plan" centered raised color={this.props.payoffPlan.name === this.props.payoffPlanFilter ? "blue" : undefined} onClick={this.handleCardClicked}>
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
                                <div className="cardValue">
                                    <div className="value"><CurrencyFormatter value={amortization.summary.actualInterest} /></div>
                                    <div className="label">Interest</div>
                                </div>
                            </Grid.Column>
                            <Grid.Column>
                                <div className="cardValue">
                                    <div className="value">{Math.ceil(amortization.summary.actualDebtLife)}</div>
                                    <div className="label">{Math.ceil(amortization.summary.actualDebtLife) === 1 ? "Month" : "Months"}</div>
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
                    {this.props.children && (<Grid.Row>{this.props.children}</Grid.Row>)}
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

        debt.createdDate = SimpleDate.thisMonth();
        debt.payoffOrder = this.props.key;
        debt.interestRate = debt.interestRate / 100.0;

        if (!debt.minimumPayment) {
            debt.minimumPayment = DebtCalculator.calculateMinimumPayment(debt.balance, debt.interestRate, debt.debtLife);
        } else if (!debt.debtLife) {
            debt.debtLife = DebtCalculator.calculateDebtLife(debt.balance, debt.interestRate, debt.minimumPayment);
        }

        // Required to know expected interest
        debt.interest = DebtCalculator.calculateTotalInterst(debt.balance, debt.interestRate, debt.minimumPayment, debt.debtLife);

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
                                    <div className="cardValue">
                                        <div className="value"><CurrencyFormatter value={this.props.interest} /></div>
                                        <div className="label">Interest</div>
                                    </div>
                                </Grid.Column>
                                <Grid.Column>
                                    <div className="cardValue">
                                        <div className="value"><CurrencyFormatter value={this.props.amortization.summary.actualInterest} /></div>
                                        <div className="label">Interest</div>
                                    </div>
                                </Grid.Column>
                                <Grid.Column>
                                    <div className="cardValue">
                                        <div className="value"><CurrencyFormatter value={this.props.interest - this.props.amortization.summary.actualInterest} /></div>
                                        <div className="label">Savings</div>
                                    </div>
                                </Grid.Column>
                                <Grid.Column>
                                    <div className="cardValue">
                                        <div className="value">{Math.ceil(this.props.amortization.summary.actualDebtLife)}</div>
                                        <div className="label">{Math.ceil(this.props.amortization.summary.actualDebtLife) === 1 ? "Month" : "Months"}</div>
                                    </div>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                        <Progress percent={(1.0 - (this.props.amortization.summary.remainingBalance / this.props.balance)) * 100.0} size="tiny" color="blue" />
                    </Card.Description>
                </Card.Content>
                <Card.Content extra textAlign="center">
                    <Grid columns="three" divided>
                        <Grid.Row>
                            <Grid.Column>
                                <div className="cardValue">
                                    <div className="value"><CurrencyFormatter value={this.props.balance} /></div>
                                    <div className="label">Balance</div>
                                </div>
                            </Grid.Column>
                            <Grid.Column>
                                <div className="cardValue">
                                    <div className="value"><CurrencyFormatter value={this.props.minimumPayment} /></div>
                                    <div className="label">Payment</div>
                                </div>
                            </Grid.Column>
                            <Grid.Column>
                                <div className="cardValue">
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

class DebtPayoffSchedule extends Component {
    constructor(props) {
        super(props);

        this.state = {
            editedPayment: undefined
        }

        this.handleEnableEditMode = this.handleEnableEditMode.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
    }

    handleEnableEditMode(e, data) {
        if (this.props.enableEditMode) {
            this.setState({
                editedPayment: data.paymentDate
            });
        }
    }

    handleEdit(e, payment) {
        this.props.onAddExtraPrincipalPayment(e, payment);

        // TODO:  Prop up payment date and payment
        this.setState({
            editedPayment: undefined
        });
    }

    render() {
        const showextraPrincipalPayment = this.props.enableRollingPayments || (this.props.extraPrincipalPayment > 0.0);
        const currentPaymentDate = SimpleDate.thisMonth();

        return (
            <Table celled striped>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Payment #</Table.HeaderCell>
                        <Table.HeaderCell>Payment Date</Table.HeaderCell>
                        <Table.HeaderCell>Beginning Balance</Table.HeaderCell>
                        <Table.HeaderCell>Interest</Table.HeaderCell>
                        <Table.HeaderCell>Principal</Table.HeaderCell>
                        <Table.HeaderCell>Extra Payment</Table.HeaderCell>
                        <Table.HeaderCell>Payment</Table.HeaderCell>
                        <Table.HeaderCell>Ending Balance</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        this.props.amortization.map((payment) =>
                            <DebtPayment key={payment.paymentNumber} current={payment.paymentDate === currentPaymentDate}
                                editMode={this.state.editedPayment === payment.paymentDate} onEnableEditMode={this.props.enableEditMode && this.handleEnableEditMode}
                                onEdit={this.handleEdit} showextraPrincipalPayment={showextraPrincipalPayment} {...payment} />
                        )
                    }
                </Table.Body>
            </Table>
        );
    }
}

class DebtPayment extends Component {
    constructor(props) {
        super(props);

        this.state = {
            newExtraPrincipalPayment: this.props.extraPrincipalPayment
        }

        this.handlePaymentClick = this.handlePaymentClick.bind(this);
        this.handleSaveClick = this.handleSaveClick.bind(this);
        this.handleCancelClick = this.handleCancelClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handlePaymentClick(e) {
        if (this.props.onEnableEditMode) {
            if (e.target.tagName === 'TD') {
                const editMode = this.props.editMode;

                if (!editMode) {
                    this.props.onEnableEditMode(e, { paymentDate: this.props.paymentDate });
                }
            }
        }
    }

    handleSaveClick(e) {
        const newExtraPrincipalPayment = this.state.newExtraPrincipalPayment;

        if (newExtraPrincipalPayment >= 0) {
            this.props.onEdit(e, { paymentDate: this.props.paymentDate, newExtraPrincipalPayment: newExtraPrincipalPayment });
        } else {
            // TODO:  Throw error
        }
    }

    handleCancelClick(e) {
        this.props.onEdit(e, { paymentDate: this.props.paymentDate, newExtraPrincipalPayment: undefined });
    }

    handleChange(e, data) {
        if (data.type === "number") {
            const newExtraPrincipalPayment = parseFloat(data.value);

            if (newExtraPrincipalPayment >= 0) {
                this.setState({
                    newExtraPrincipalPayment: newExtraPrincipalPayment
                });
            } else {
                // TODO:  Throw error
            }
        }
    }

    render() {
        let totalExtraPrincipalPayment = null;

        if (this.props.editMode) {
            totalExtraPrincipalPayment = <CurrencyInput name="totalPayment" defaultValue={this.props.extraPrincipalPayment} onChange={this.handleChange}>
                <Button color="green" icon onClick={this.handleSaveClick}>
                    <Icon name="check" />
                </Button>
                <Button color="red" icon onClick={this.handleCancelClick}>
                    <Icon name="cancel" />
                </Button>
            </CurrencyInput>;
        } else {
            totalExtraPrincipalPayment = <CurrencyFormatter value={this.props.extraPrincipalPayment} />;
        }

        return (
            <Table.Row className={this.props.current ? "currentPaymentRow" : ""}>
                <Table.Cell>
                    {(this.props.current && (<Label ribbon>Current</Label>)) || this.props.paymentNumber}
                </Table.Cell>
                <Table.Cell><SimpleDateFormatter value={this.props.paymentDate} /></Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.beginningBalance} /></Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.interest} /></Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.principal} /></Table.Cell>
                <Table.Cell onClick={this.handlePaymentClick}>{totalExtraPrincipalPayment}</Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.totalPayment} /></Table.Cell>
                <Table.Cell><CurrencyFormatter value={this.props.endingBalance} /></Table.Cell>
            </Table.Row>
        );
    }
}

function EditableInput(props) {
    return (
        <Input type='text' defaultValue={props.children} action>
            <input />
            <Button color="green" icon>
                <Icon name="check" />    
            </Button>
            <Button color="red" icon>
                <Icon name="cancel" />
            </Button>
        </Input>
    );
}

export default DebtCalculatorApp;