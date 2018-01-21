import { SortDirection } from './SortDirection.js';
import { AmortizationSummary } from './AmortizationSummary.js';

export class DebtList {
    constructor(debts) {
        this.debts = debts;
        this.aggregateAmortization = undefined;
        this.amortizationSummary = undefined;
    }

    add(debt) {
        this.debts.push(debt);
    }

    buildAmortizations(enableRollingPayments, extraPayment) {
        let totalPayment = extraPayment ? extraPayment : 0.0, maxDebtLife = 0.0;
        let debtData = [];

        this.amortizationSummary = new AmortizationSummary();

        for (let i = 0, debtCount = this.debts.length; i < debtCount; i++) {
            if (this.debts[i].included) {
                this.amortizationSummary.totalDebt += this.debts[i].balance;
                this.amortizationSummary.expectedInterest += this.debts[i].interest;

                this.debts[i].actualInterest = 0.0;
                this.debts[i].actualDebtLife = Math.ceil(this.debts[i].debtLife);
                this.debts[i].newAmortization = new Array(this.debts[i].actualDebtLife);

                totalPayment += this.debts[i].minimumPayment;
                maxDebtLife = Math.max(this.debts[i].debtLife, maxDebtLife);

                debtData.push({
                    periodicInterest: this.debts[i].interestRate / 12.0,
                    remainingBalance: this.debts[i].balance,
                    minimumPayment: this.debts[i].minimumPayment,
                    debtIndex: i
                });
            }
        }

        this.amortizationSummary.totalPayment = totalPayment;
        this.amortizationSummary.expectedDebtLife = maxDebtLife;
        this.amortizationSummary.actualDebtLife = maxDebtLife;
        
        this.aggregateAmortization = new Array(Math.ceil(maxDebtLife));
        let payment = { paymentNumber: 0 };

        for (let debtDataLength = debtData.length; debtDataLength > 0;) {
            let partialPayment = 0.0;

            payment.paymentNumber++;
            payment.beginningBalance = 0.0;
            payment.interest = 0.0;
            payment.principal = 0.0;
            payment.extraPayment = 0.0;

            // Handling the initial payment without considering snowballs or extra payment(s)
            for (let i = 0; i < debtDataLength; i++) {
                const interest = Math.round((debtData[i].remainingBalance * debtData[i].periodicInterest) * 100.0) / 100.0;
                const principal = Math.min(debtData[i].minimumPayment - interest, debtData[i].remainingBalance);

                const debt = this.debts[debtData[i].debtIndex];
                debt.actualInterest += interest;

                this.amortizationSummary.actualInterest += interest;

                debt.newAmortization[payment.paymentNumber - 1] = {
                    paymentNumber: payment.paymentNumber,
                    beginningBalance: debtData[i].remainingBalance,
                    interest: interest,
                    principal: principal,
                    extraPayment: 0.0,
                    endingBalance: debtData[i].remainingBalance - principal
                };

                payment.beginningBalance += debtData[i].remainingBalance;
                payment.interest += interest;
                payment.principal += principal;
                debtData[i].remainingBalance -= principal;

                if (debtData[i].remainingBalance <= 0.0) {
                    if (!enableRollingPayments) {
                        totalPayment -= debtData[i].minimumPayment;
                        partialPayment += (interest + principal);
                    }

                    if (payment.paymentNumber < debt.debtLife) {
                        debt.newAmortization = debt.newAmortization.slice(0, payment.paymentNumber);
                        debt.actualDebtLife = payment.paymentNumber;
                    }

                    debtData.splice(i, 1);
                    i--;  // Increasing to be able to access the same debt again
                    debtDataLength--;
                }
            }

            payment.regularPayment = payment.interest + payment.principal;

            // Looping back through to add any snowball or extra payment(s)
            partialPayment = totalPayment - (payment.regularPayment - partialPayment);
            for (let i = 0; i < debtDataLength && (partialPayment > 0); i++) {
                const locExtraPayment = Math.min(debtData[i].remainingBalance, partialPayment);
                payment.extraPayment += locExtraPayment;
                debtData[i].remainingBalance -= locExtraPayment;
                partialPayment -= locExtraPayment;

                const debt = this.debts[debtData[i].debtIndex];
                const debtPayment = debt.newAmortization[payment.paymentNumber - 1];
                debtPayment.extraPayment = locExtraPayment;
                debtPayment.endingBalance -= locExtraPayment;

                if (debtData[i].remainingBalance <= 0.0) {
                    if (!enableRollingPayments) {
                        totalPayment -= debtData[i].minimumPayment;
                    }

                    if (payment.paymentNumber < debt.debtLife) {
                        debt.newAmortization = debt.newAmortization.slice(0, payment.paymentNumber);
                        debt.actualDebtLife = payment.paymentNumber;
                    }

                    debtData.splice(i, 1);
                    i--;  // Increasing to be able to access the same debt again
                    debtDataLength--;
                }
            }

            payment.endingBalance = payment.beginningBalance - (payment.principal + payment.extraPayment);

            this.aggregateAmortization[payment.paymentNumber - 1] = Object.assign({}, payment);
        }

        if (payment.paymentNumber < maxDebtLife) {
            this.amortizationSummary.actualDebtLife = payment.paymentNumber;
            this.aggregateAmortization = this.aggregateAmortization.slice(0, payment.paymentNumber);
        }
    }

    getAmortizationSummary(enableRollingPayments, extraPayment) {
        if (!this.aggregateAmortization) {
            this.buildAmortizations(enableRollingPayments, extraPayment);
        }

        return this.amortizationSummary;
    }

    sort(property, direction) {
        this.debts.sort((a, b) => {
            if (direction === SortDirection.descending) {
                return b[property] - a[property];
            } else if (direction === SortDirection.ascending) {
                return a[property] - b[property];
            } else {
                return a["payoffOrder"] - b["payoffOrder"];
            }
        });
    }

    toggleIncludeFlag(debtName) {
        let debt = this.debts.find((debt) => { return debt.name === debtName; });

        debt.included = !debt.included;
    }
}