
// Simulated Payment Providers
const PROVIDERS = [
    { id: 'stripe', name: 'Stripe', icon: 'credit_card', color: '#635BFF' },
    { id: 'paypal', name: 'PayPal', icon: 'payments', color: '#00457C' },
    { id: 'razorpay', name: 'Razorpay', icon: 'currency_rupee', color: '#3395FF' },
    { id: 'apple_pay', name: 'Apple Pay', icon: 'smartphone', color: '#000000' },
    { id: 'google_pay', name: 'Google Pay', icon: 'android', color: '#4285F4' }
]

// Mock Database
let transactions = [
    { id: 'tx_1', provider: 'stripe', amount: 120.50, currency: 'USD', date: new Date(Date.now() - 86400000).toISOString(), status: 'completed', merchant: 'Amazon' },
    { id: 'tx_2', provider: 'paypal', amount: 45.00, currency: 'USD', date: new Date(Date.now() - 172800000).toISOString(), status: 'completed', merchant: 'Spotify' },
    { id: 'tx_3', provider: 'apple_pay', amount: 9.99, currency: 'USD', date: new Date(Date.now() - 259200000).toISOString(), status: 'completed', merchant: 'Netflix' },
]

let cards = [
    { id: 'card_1', type: 'visa', last4: '4242', expiry: '12/28', holder: 'John Doe', color: 'from-purple-600 to-blue-600' },
    { id: 'card_2', type: 'mastercard', last4: '8899', expiry: '09/26', holder: 'John Doe', color: 'from-orange-500 to-red-600' }
]

export const paymentService = {
    getProviders: async () => {
        await new Promise(resolve => setTimeout(resolve, 800)) // Network delay
        return PROVIDERS
    },

    getTransactions: async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
    },

    getCards: async () => {
        await new Promise(resolve => setTimeout(resolve, 600))
        return cards
    },

    addCard: async (cardDetails) => {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const newCard = {
            id: `card_${Date.now()}`,
            type: 'visa', // Mock detection
            last4: cardDetails.number.slice(-4),
            expiry: cardDetails.expiry,
            holder: cardDetails.holder,
            color: 'from-emerald-500 to-teal-600'
        }
        cards = [...cards, newCard]
        return newCard
    },

    processPayment: async (amount, currency, providerId) => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const provider = PROVIDERS.find(p => p.id === providerId)

        // Simulating success/failure
        if (Math.random() > 0.9) {
            throw new Error('Payment Declined by Provider')
        }

        const newTx = {
            id: `tx_${Date.now()}`,
            provider: providerId,
            amount: parseFloat(amount),
            currency,
            date: new Date().toISOString(),
            status: 'completed',
            merchant: 'Transfer / Payment'
        }
        transactions = [newTx, ...transactions]
        return newTx
    }
}
