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
            interest = Math.round((remainingBalance * periodicInterest) * 100.0) / 100.0;
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

    static buildAggregateAmortization(debts, enableSnowball, extraPayment) {
        let totalPayment = extraPayment ? extraPayment : 0.0, maxDebtLife = 0.0;
        let debtData = [];

        for (let i = 0, debtCount = debts.length; i < debtCount; i++) {
            if (debts[i].included) {
                totalPayment += debts[i].minimumPayment;
                maxDebtLife = Math.max(debts[i].debtLife, maxDebtLife);

                debtData.push({
                    periodicInterest: debts[i].interestRate / 12.0,
                    remainingBalance: debts[i].balance,
                    minimumPayment: debts[i].minimumPayment
                });
            }
        }

        let amortization = new Array(Math.ceil(maxDebtLife));
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

                payment.beginningBalance += debtData[i].remainingBalance;
                payment.interest += interest;
                payment.principal += principal;
                debtData[i].remainingBalance -= principal;

                if (debtData[i].remainingBalance <= 0.0) {
                    if (!enableSnowball) {
                        totalPayment -= debtData[i].minimumPayment;
                        partialPayment += (interest + principal);
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

                if (debtData[i].remainingBalance <= 0.0) {
                    if (!enableSnowball) {
                        totalPayment -= debtData[i].minimumPayment;
                    }

                    debtData.splice(i, 1);
                    i--;  // Increasing to be able to access the same debt again
                    debtDataLength--;
                }
            }

            payment.endingBalance = payment.beginningBalance - (payment.principal + payment.extraPayment);

            amortization[payment.paymentNumber - 1] = Object.assign({}, payment);
        }

        if (payment.paymentNumber < maxDebtLife) {
            amortization = amortization.slice(0, payment.paymentNumber);
        }

        return amortization;
    }

    static aggregateAmortizations(debts) {
        let includedDebts = debts.filter((debt) => debt.included).slice();
        let amortization = [];

        if (includedDebts.length > 0) {
            amortization = JSON.parse(JSON.stringify(includedDebts[0].amortization));

            let finalAmortizationLength = amortization.length;
            let debtsLength = includedDebts.length;

            for (let i = 1, j = 0, currentAmortizationLength = 0; i < debtsLength; i++) {

                currentAmortizationLength = includedDebts[i].amortization.length;

                for (j = 0; j < currentAmortizationLength && j < finalAmortizationLength; j++) {
                    amortization[j].paymentNumber = includedDebts[i].amortization[j].paymentNumber;
                    amortization[j].beginningBalance = amortization[j].beginningBalance + includedDebts[i].amortization[j].beginningBalance;
                    amortization[j].interest += includedDebts[i].amortization[j].interest;
                    amortization[j].principal += includedDebts[i].amortization[j].principal;
                    amortization[j].endingBalance += includedDebts[i].amortization[j].endingBalance;
                }

                if (currentAmortizationLength > finalAmortizationLength) {
                    amortization = amortization.concat(JSON.parse(JSON.stringify(includedDebts[i].amortization.slice(j))));
                    finalAmortizationLength = currentAmortizationLength;
                }
            }
        }

        return amortization;
    }
}