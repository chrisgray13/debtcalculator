export const SortDirection = Object.freeze({
    none: 0,
    ascending: 1,
    descending: 2
});

export const PayoffPlan = Object.freeze({
    Minimum: { name: "Minimum", displayText: "Bare Minimum", sortColumn: "payoffOrder", sortDirection: SortDirection.ascending, enableRollingPayments: false },
    QuickestWins: { name: "QuickestWins", displayText: "Quickest Wins", sortColumn: "balance", sortDirection: SortDirection.ascending, enableRollingPayments: true },
    GreatestSavings: { name: "GreatestSavings", displayText: "Greatest Savings", sortColumn: "interestRate", sortDirection: SortDirection.descending, enableRollingPayments: true }
});