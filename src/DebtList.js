import { Amortization } from './AmortizationSummary.js';
import { Payment } from './Payment.js';
import { SimpleDate } from './SimpleDate.js';
import { SortDirection } from './SortDirection.js';

export class DebtList {
    constructor(debts) {
        this.debts = debts;
        this.amortization = undefined;
    }

    add(debt) {
        this.debts.push(debt);
    }

    addExtraPrincipalPayment(debtFilter, payment) {
        let debt = this.debts.find((debt) => { return debt.name === debtFilter; });
        debt.extraPrincipalPayments[payment.paymentDate] = payment.newExtraPrincipalPayment;
    }

    buildAmortizations(enableRollingPayments, extraPrincipalPayment) {
        let latestPaymentDate = "1980-12", earliestPaymentDate = SimpleDate.thisMonth();
        let debtData = [];

        extraPrincipalPayment = extraPrincipalPayment ? extraPrincipalPayment : 0.0;

        this.amortization = new Amortization(enableRollingPayments, extraPrincipalPayment);
        this.amortization.summary.totalPayment = extraPrincipalPayment;

        // Step 1:  Identify what debts are included, tag them with additional information, and compile some summary data
        for (let i = 0, debtCount = this.debts.length; i < debtCount; i++) {
            if (this.debts[i].included) {
                this.amortization.summary.totalDebt += this.debts[i].balance;
                this.amortization.summary.totalPayment += this.debts[i].minimumPayment;
                this.amortization.summary.expectedInterest += this.debts[i].interest;

                this.debts[i].amortization = new Amortization(enableRollingPayments, extraPrincipalPayment, Math.ceil(this.debts[i].debtLife));
                this.debts[i].amortization.summary.initializeWithDebt(this.debts[i]);

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

        this.amortization.summary.expectedDebtLife = SimpleDate.differenceInMonths(earliestPaymentDate, latestPaymentDate);
        this.amortization.summary.actualDebtLife = this.amortization.summary.expectedDebtLife;
        
        this.amortization.payments = new Array(Math.ceil(this.amortization.summary.expectedDebtLife));
        let paymentNumber = 0, paymentDate = new SimpleDate(earliestPaymentDate);
        
        paymentDate.addMonths(-1);

        // Step 2:  Create payments
        for (let debtDataLength = debtData.length; debtDataLength > 0;) {
            let payment = new Payment();
            payment.paymentNumber = ++paymentNumber;
            payment.paymentDate = paymentDate.addMonths(1).toString();
            payment.debtCount = debtDataLength;

            if (payment.paymentDate === SimpleDate.thisMonth()) {
                for (let l = 0; l < debtDataLength; l++) {
                    this.debts[debtData[l].debtIndex].amortization.summary.remainingBalance = debtData[l].remainingBalance;
                    this.debts[debtData[l].debtIndex].amortization.summary.remainingDebts = 1;
                    this.debts[debtData[l].debtIndex].amortization.summary.currentPaymentNumber = payment.paymentNumber;
                }
            }

            let totalPayment = extraPrincipalPayment ? extraPrincipalPayment : 0.0;

            // Step 2a:  Handling the initial payment without considering snowballs or extra payment(s)
            for (let j = 0; j < debtDataLength; j++) {
                if (debtData[j].createdDate <= paymentDate) {
                    const interest = Math.round((debtData[j].remainingBalance * debtData[j].periodicInterest) * 100.0) / 100.0;
                    const principal = Math.min(debtData[j].minimumPayment - interest, debtData[j].remainingBalance);

                    this.amortization.summary.actualInterest += interest;

                    const debt = this.debts[debtData[j].debtIndex];
                    debt.amortization.summary.actualInterest += interest;

                    const debtPayment = new Payment();
                    debtPayment.paymentNumber = payment.paymentNumber;
                    debtPayment.paymentDate = payment.paymentDate;
                    debtPayment.beginningBalance = debtData[j].remainingBalance;
                    debtPayment.interest = interest;
                    debtPayment.principal = principal;
                    debtPayment.extraPrincipalPayment = debt.extraPrincipalPayments[debtPayment.paymentDate] ? debt.extraPrincipalPayments[debtPayment.paymentDate] : 0.00;
                    debtPayment.endingBalance = debtData[j].remainingBalance - (principal + debtPayment.extraPrincipalPayment);
                    debtPayment.regularPayment = interest + principal;
                    debtPayment.totalPayment = debtPayment.regularPayment + debtPayment.extraPrincipalPayment;
                    debtPayment.debtCount = 1;
                    debt.amortization.payments[paymentNumber - 1] = debtPayment;

                    payment.beginningBalance += debtData[j].remainingBalance;
                    payment.interest += debtPayment.interest;
                    payment.principal += debtPayment.principal;
                    payment.extraPrincipalPayment += debtPayment.extraPrincipalPayment;
                    debtData[j].remainingBalance -= (debtPayment.principal + debtPayment.extraPrincipalPayment);

                    if (debtData[j].remainingBalance <= 0.0) {
                        if (enableRollingPayments) {
                            extraPrincipalPayment += debtData[j].minimumPayment;
                            totalPayment += debtData[j].minimumPayment - (interest + principal);
                        }

                        if (paymentNumber < debt.debtLife) {
                            debt.amortization.payments = debt.amortization.payments.slice(0, paymentNumber);
                            debt.amortization.summary.actualDebtLife = paymentNumber;
                        }

                        debt.amortization.summary.remainingLife =
                            debt.amortization.summary.currentPaymentNumber ? paymentNumber - debt.amortization.summary.currentPaymentNumber : 0;

                        debtData.splice(j, 1);
                        j--;  // Decreasing to be able to access the same debt again
                        debtDataLength--;
                    }
                }
            }

            payment.regularPayment = payment.interest + payment.principal;

            // Step 2b:  Looping back through to add any rolling or extra payment(s)
            for (let k = 0; k < debtDataLength && (totalPayment > 0); k++) {
                if (debtData[k].createdDate <= payment.paymentDate) {
                    const locExtraPrincipalPayment = Math.min(debtData[k].remainingBalance, totalPayment);
                    payment.extraPrincipalPayment += locExtraPrincipalPayment;
                    debtData[k].remainingBalance -= locExtraPrincipalPayment;
                    totalPayment -= locExtraPrincipalPayment;

                    const debt = this.debts[debtData[k].debtIndex];
                    const debtPayment = debt.amortization.payments[paymentNumber - 1];
                    debtPayment.extraPrincipalPayment += locExtraPrincipalPayment;
                    debtPayment.endingBalance -= locExtraPrincipalPayment;
                    debtPayment.totalPayment += locExtraPrincipalPayment;

                    if (debtData[k].remainingBalance <= 0.0) {
                        if (enableRollingPayments) {
                            extraPrincipalPayment += debtData[k].minimumPayment;
                        }

                        if (paymentNumber < debt.debtLife) {
                            debt.amortization.payments = debt.amortization.payments.slice(0, paymentNumber);
                            debt.amortization.summary.actualDebtLife = paymentNumber;
                        }

                        debt.amortization.summary.remainingLife =
                            debt.amortization.summary.currentPaymentNumber ? paymentNumber - debt.amortization.summary.currentPaymentNumber : 0;

                        debtData.splice(k, 1);
                        k--;  // Increasing to be able to access the same debt again
                        debtDataLength--;
                    }
                }
            }

            payment.totalPayment = payment.regularPayment + payment.extraPrincipalPayment;
            payment.endingBalance = payment.beginningBalance - (payment.principal + payment.extraPrincipalPayment);

            if (payment.paymentDate === SimpleDate.thisMonth()) {
                this.amortization.summary.remainingBalance = payment.beginningBalance;
                this.amortization.summary.remainingDebts = payment.debtCount;
                this.amortization.summary.currentPaymentNumber = payment.paymentNumber;
            }

            this.amortization.payments[paymentNumber - 1] = payment;
        }

        // Step 3:  Taking care of early payoff
        if (paymentNumber < this.amortization.summary.expectedDebtLife) {
            this.amortization.summary.actualDebtLife = paymentNumber;
            this.amortization.payments = this.amortization.payments.slice(0, paymentNumber);
        }

        this.amortization.summary.remainingLife = this.amortization.summary.actualDebtLife - this.amortization.summary.currentPaymentNumber;
    }

    getAmortization(enableRollingPayments, extraPrincipalPayment, debtFilter) {
        if (!this.amortization || this.amortization.extraPrincipalPayment !== extraPrincipalPayment || this.amortization.enableRollingPayments !== extraPrincipalPayment) {
            this.buildAmortizations(enableRollingPayments, extraPrincipalPayment);
        }

        if (debtFilter) {
            let debt = this.debts.find((debt) => { return debt.name === debtFilter; });

            return debt.amortization;
        } else {
            return this.amortization;
        }
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