export class DebtHandler {
    static calculateMinimumPayment(balance, interestRate, debtLife) {
        let periodicInterest = interestRate / 12.0;

        return (periodicInterest * balance) / (1.0 - ((1 + periodicInterest) ** (-1.0 * debtLife)));
    }

    static calculateDebtLife(balance, interestRate, minimumPayment) {
        let periodicInterest = interestRate / 12.0;

        return (-1.0 * Math.log(1 - ((periodicInterest * balance) / minimumPayment))) / Math.log(1 + periodicInterest);
    }
}