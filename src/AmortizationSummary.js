export class AmortizationSummary {
    constructor() {
        this.totalDebt = 0.0;

        this.totalPayment = 0.0;

        this.expectedInterest = 0.0;
        this.actualInterest = 0.0;

        this.expectedDebtLife = 0.0;
        this.actualDebtLife = 0.0;

        this.remainingBalance = 0.0;
        this.remainingLife = 0;
        this.remainingDebts = 0;

        this.currentPaymentNumber = 0;
    }

    initializeWithDebt(debt) {
        this.totalDebt = debt.balance;
        this.totalPayment = debt.minimumPayment;
        this.expectedInterest = debt.interest;
        this.expectedDebtLife = Math.ceil(debt.debtLife);
        this.actualDebtLife = this.expectedDebtLife;  // Setting just in case it does not change
    }
}

export class Amortization {
    constructor(enableRollingPayments, extraPrincipalPayment, expectedPayments) {
        this.enableRollingPayments = enableRollingPayments;
        this.extraPrincipalPayment = extraPrincipalPayment;

        this.payments = new Array(expectedPayments ? expectedPayments : 0);
        this.summary = new AmortizationSummary();
    }
}