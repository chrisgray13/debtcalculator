import { AmortizationSummary } from './AmortizationSummary.js';
import { Payment } from './Payment.js';
import { SimpleDate } from './SimpleDate.js';
import { SortDirection } from './SortDirection.js';

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
        let latestPaymentDate = "1980-12", earliestPaymentDate = SimpleDate.thisMonth();
        let debtData = [];

        extraPayment = extraPayment ? extraPayment : 0.0;

        this.amortizationSummary = new AmortizationSummary();

        // Step 1:  Identify what debts are included, tag them with additional information, and compile some summary data
        for (let i = 0, debtCount = this.debts.length; i < debtCount; i++) {
            if (this.debts[i].included) {
                this.amortizationSummary.totalDebt += this.debts[i].balance;
                this.amortizationSummary.expectedInterest += this.debts[i].interest;

                this.debts[i].actualInterest = 0.0;
                this.debts[i].actualDebtLife = Math.ceil(this.debts[i].debtLife);
                this.debts[i].newAmortization = new Array(this.debts[i].actualDebtLife);

                earliestPaymentDate = (this.debts[i].createdDate < earliestPaymentDate) ? this.debts[i].createdDate : earliestPaymentDate;

                const lastPaymentDate = (new SimpleDate(this.debts[i].createdDate)).addMonths(this.debts[i].debtLife).toString();
                latestPaymentDate = (lastPaymentDate > latestPaymentDate) ? lastPaymentDate : latestPaymentDate;

                debtData.push({
                    periodicInterest: this.debts[i].interestRate / 12.0,
                    remainingBalance: this.debts[i].balance,
                    minimumPayment: this.debts[i].minimumPayment,
                    createdDate: this.debts[i].createdDate,
                    debtIndex: i
                });
            }
        }

        this.amortizationSummary.totalPayment = 0.0;
        this.amortizationSummary.expectedDebtLife = SimpleDate.differenceInMonths(earliestPaymentDate, latestPaymentDate);
        this.amortizationSummary.actualDebtLife = this.amortizationSummary.expectedDebtLife;
        
        this.aggregateAmortization = new Array(Math.ceil(this.amortizationSummary.expectedDebtLife));
        let paymentNumber = 0, paymentDate = new SimpleDate(earliestPaymentDate);
        
        paymentDate.addMonths(-1);

        // Step 2:  Create payments
        for (let debtDataLength = debtData.length; debtDataLength > 0;) {
            let payment = new Payment();
            payment.paymentNumber = ++paymentNumber;
            payment.paymentDate = paymentDate.addMonths(1).toString();
            payment.debtCount = debtDataLength;

            let totalPayment = extraPayment ? extraPayment : 0.0;

            // Step 2a:  Handling the initial payment without considering snowballs or extra payment(s)
            for (let j = 0; j < debtDataLength; j++) {
                if (debtData[j].createdDate <= paymentDate) {
                    const interest = Math.round((debtData[j].remainingBalance * debtData[j].periodicInterest) * 100.0) / 100.0;
                    const principal = Math.min(debtData[j].minimumPayment - interest, debtData[j].remainingBalance);

                    const debt = this.debts[debtData[j].debtIndex];
                    debt.actualInterest += interest;

                    this.amortizationSummary.actualInterest += interest;

                    const debtPayment = new Payment();
                    debtPayment.paymentNumber = payment.paymentNumber;
                    debtPayment.paymentDate = payment.paymentDate;
                    debtPayment.beginningBalance = debtData[j].remainingBalance;
                    debtPayment.interest = interest;
                    debtPayment.principal = principal;
                    debtPayment.endingBalance = debtData[j].remainingBalance - principal;
                    debtPayment.regularPayment = interest + principal;
                    debtPayment.totalPayment = debtPayment.regularPayment;
                    debtPayment.debtCount = 1;
                    debt.newAmortization[paymentNumber - 1] = debtPayment;

                    payment.beginningBalance += debtData[j].remainingBalance;
                    payment.interest += interest;
                    payment.principal += principal;
                    debtData[j].remainingBalance -= principal;

                    if (debtData[j].remainingBalance <= 0.0) {
                        if (enableRollingPayments) {
                            extraPayment += debtData[j].minimumPayment;
                            totalPayment += debtData[j].minimumPayment - (interest + principal);
                        }

                        if (paymentNumber < debt.debtLife) {
                            debt.newAmortization = debt.newAmortization.slice(0, paymentNumber);
                            debt.actualDebtLife = paymentNumber;
                        }

                        debtData.splice(j, 1);
                        j--;  // Increasing to be able to access the same debt again
                        debtDataLength--;
                    }
                }
            }

            payment.regularPayment = payment.interest + payment.principal;

            // Step 2b:  Looping back through to add any rolling or extra payment(s)
            for (let k = 0; k < debtDataLength && (totalPayment > 0); k++) {
                if (debtData[k].createdDate <= payment.paymentDate) {
                    const locExtraPayment = Math.min(debtData[k].remainingBalance, totalPayment);
                    payment.extraPayment += locExtraPayment;
                    debtData[k].remainingBalance -= locExtraPayment;
                    totalPayment -= locExtraPayment;

                    const debt = this.debts[debtData[k].debtIndex];
                    const debtPayment = debt.newAmortization[paymentNumber - 1];
                    debtPayment.extraPayment = locExtraPayment;
                    debtPayment.endingBalance -= locExtraPayment;
                    debtPayment.totalPayment += locExtraPayment;

                    if (debtData[k].remainingBalance <= 0.0) {
                        if (enableRollingPayments) {
                            extraPayment += debtData[k].minimumPayment;
                        }

                        if (paymentNumber < debt.debtLife) {
                            debt.newAmortization = debt.newAmortization.slice(0, paymentNumber);
                            debt.actualDebtLife = paymentNumber;
                        }

                        debtData.splice(k, 1);
                        k--;  // Increasing to be able to access the same debt again
                        debtDataLength--;
                    }
                }
            }

            payment.totalPayment = payment.regularPayment + payment.extraPayment;
            payment.endingBalance = payment.beginningBalance - (payment.principal + payment.extraPayment);

            if (payment.paymentDate === SimpleDate.thisMonth()) {
                this.amortizationSummary.remainingBalance = payment.beginningBalance;
                this.amortizationSummary.remainingDebts = payment.debtCount;
                this.amortizationSummary.currentPaymentNumber = payment.paymentNumber;
            }

            this.aggregateAmortization[paymentNumber - 1] = payment;
        }

        this.amortizationSummary.remainingLife = this.amortizationSummary.expectedDebtLife - this.amortizationSummary.currentPaymentNumber;

        // Step 3:  Taking care of early payoff
        if (paymentNumber < this.amortizationSummary.expectedDebtLife) {
            this.amortizationSummary.actualDebtLife = paymentNumber;
            this.aggregateAmortization = this.aggregateAmortization.slice(0, paymentNumber);
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