export class SimpleDate {
    constructor(simpleDate) {
        this.simpleDate = SimpleDate.parseDate(simpleDate);
    }

    addMonths(monthsToAdd) {
        this.simpleDate.year = this.simpleDate.year + Math.trunc(monthsToAdd / 12) + Math.trunc((this.simpleDate.month + (monthsToAdd % 12)) / 12);
        this.simpleDate.month = (this.simpleDate.month + (monthsToAdd % 12)) % 12;

        if (this.simpleDate.month <= 0) {
            this.simpleDate.year--;
            this.simpleDate.month = 12 + this.simpleDate.month;
        }

        return SimpleDate.fromYearMonth(this.simpleDate.year, this.simpleDate.month);
    }

    static fromDate(date) {
        return SimpleDate.fromYearMonth(date.getFullYear(), date.getMonth() + 1);
    }

    static fromYearMonth(year, month) {
        const monthString = month.toString();

        return year.toString() + "-" + ((monthString.length === 1) ? "0" + monthString : monthString);
    }

    static differenceInMonths(date1, date2) {
        let parsedDate1 = SimpleDate.parseDate(date1), parsedDate2 = SimpleDate.parseDate(date2);

        return ((parsedDate2.year - parsedDate1.year) * 12) + (parsedDate2.month - parsedDate1.month);
    }

    static parseDate(simpleDate) {
        return {
            month: parseInt(simpleDate.substring(5), 10),
            year: parseInt(simpleDate.substring(0, 4), 10)
        };
    }

    static thisMonth() {
        return SimpleDate.fromDate(new Date());
    }

    toString() {
        return SimpleDate.fromYearMonth(this.simpleDate.year, this.simpleDate.month);        
    }

    static toMonthYearString(simpleDate) {
        let parsedDate = SimpleDate.parseDate(simpleDate);
        const monthString = parsedDate.month.toString();

        return ((monthString.length === 1) ? "0" + monthString : monthString) + "-" + parsedDate.year.toString();
    }
}