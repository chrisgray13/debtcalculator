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
}