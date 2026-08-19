export const getDailyRevenue = (dayStats) =>
    (dayStats?.manualPayments || 0) + (dayStats?.onlinePayments || 0);

export const buildTrendValues = (history = [], todayStats = null, getValue) => {
    const points = [...history].reverse().map(getValue);
    if (todayStats) {
        points.push(getValue(todayStats));
    }
    return points;
};

export const computeDayOverDayDelta = (values) => {
    if (!values || values.length < 2) return null;
    const current = values[values.length - 1];
    const previous = values[values.length - 2];
    if (previous === 0) {
        if (current === 0) return 0;
        return 100;
    }
    return Math.round(((current - previous) / previous) * 100);
};

export const sparklinePoints = (values, width = 80, height = 40, padding = 4) => {
    if (!values?.length) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

    return values
        .map((value, index) => {
            const x = padding + index * stepX;
            const normalized = (value - min) / range;
            const y = height - padding - normalized * (height - padding * 2);
            return `${x},${y}`;
        })
        .join(' ');
};
