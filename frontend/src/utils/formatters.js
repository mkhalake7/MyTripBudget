const CURRENCY_SYMBOLS = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AUD': 'A$',
    'CAD': 'C$',
    'SGD': 'S$',
    'AED': 'د.إ'
};

/**
 * Formats an amount with a currency symbol and optional sign.
 * @param {number} amount - The numeric value to format.
 * @param {string} currencyCode - The ISO currency code (e.g., 'INR', 'USD').
 * @param {boolean} showSign - Whether to show '+' for positive values.
 * @returns {string} - The formatted currency string.
 */
export const formatCurrency = (amount, currencyCode = 'INR', showSign = false) => {
    const symbol = CURRENCY_SYMBOLS[currencyCode] || '$';
    const absoluteAmount = Math.abs(amount).toFixed(2);

    if (amount === 0) {
        const sign = showSign ? '+' : '';
        return `${sign}${symbol}0.00`;
    }

    if (amount > 0) {
        const sign = showSign ? '+' : '';
        return `${sign}${symbol}${absoluteAmount}`;
    }

    return `-${symbol}${absoluteAmount}`;
};

/**
 * Formats a date string into a relative human-readable format.
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} - The relative time string (e.g., '2 hours ago').
 */
export const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
