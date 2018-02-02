export class Debt {
    constructor() {
        this.name = undefined;
        this.createdDate = undefined;
        this.balance = 0.0;
        this.interestRate = 0.0;
        this.minimumPayment = 0.0;
        this.debtLife = 0.0;
        this.actualDebtLife = 0.0;
        this.interest = 0.0;
        this.actualInterest = 0.0;
        this.included = true;
        this.payoffOrder = undefined;
        this.amortization = undefined;
    }
}