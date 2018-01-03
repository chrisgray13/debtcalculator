export class DebtCalculator {
    static calculateMinimumPayment(balance, interestRate, debtLife) {
        let periodicInterest = interestRate / 12.0;

        return (periodicInterest * balance) / (1.0 - ((1 + periodicInterest) ** (-1.0 * debtLife)));
    }

    static calculateDebtLife(balance, interestRate, minimumPayment) {
        let periodicInterest = interestRate / 12.0;

        return (-1.0 * Math.log(1 - ((periodicInterest * balance) / minimumPayment))) / Math.log(1 + periodicInterest);
    }

    static buildAmortization(balance, interestRate, minimumPayment, debtLife) {
        let i = 0, paymentNumber = 1;
        let periodicInterest = interestRate / 12.0;
        let remainingBalance = balance;
        let beginningBalance = 0.0, interest = 0.0, principal = 0.0;
        let amortization = new Array(Math.ceil(debtLife));
        let payment = {};

        for (; remainingBalance > 0; i++, paymentNumber++) {
            beginningBalance = remainingBalance;
            interest = remainingBalance * periodicInterest;
            principal = Math.min(minimumPayment - interest, remainingBalance);
            remainingBalance -= principal;

            payment = {
                paymentNumber: paymentNumber,
                beginningBalance: beginningBalance,
                interest: interest,
                principal: principal,
                endingBalance: remainingBalance
            };

            amortization[i] = payment;
        }

        if (paymentNumber < debtLife) {
            amortization = amortization.slice(0, paymentNumber - 1);
        }

        return amortization;
    }
}