export class Payment {
    constructor() {
        this.paymentNumber = 0;
        this.paymentDate = undefined;
        this.beginningBalance = 0.0;
        this.interest = 0.0;
        this.principal = 0.0;
        this.endingBalance = 0.0;
        this.regularPayment = 0.0;
        this.extraPrincipalPayment = 0.0;
        this.totalPayment = 0.0;
        this.debtCount = 0;
    }
}