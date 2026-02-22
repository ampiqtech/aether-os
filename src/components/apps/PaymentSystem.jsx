
import React, { useState, useEffect } from 'react'
import { paymentService } from '../../services/paymentService'
import { GestureApp } from '../UIKit'

export const PaymentSystem = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('wallet') // wallet, history, send
    const [cards, setCards] = useState([])
    const [transactions, setTransactions] = useState([])
    const [providers, setProviders] = useState([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    // Form State
    const [amount, setAmount] = useState('')
    const [recipient, setRecipient] = useState('')
    const [selectedCard, setSelectedCard] = useState(null)
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [c, t, p] = await Promise.all([
            paymentService.getCards(),
            paymentService.getTransactions(),
            paymentService.getProviders()
        ])
        setCards(c)
        setTransactions(t)
        setProviders(p)
        if (c.length > 0) setSelectedCard(c[0])
        setLoading(false)
    }

    const handlePayment = async () => {
        if (!amount || !selectedCard) return
        setProcessing(true)
        try {
            await paymentService.processPayment(amount, 'USD', 'stripe') // Defaulting to stripe for demo

            showNotification('success', 'Payment Successful!')
            setAmount('')
            setRecipient('')
            loadData() // Refresh history
        } catch (error) {
            showNotification('error', 'Transaction Failed')
        } finally {
            setProcessing(false)
        }
    }

    const showNotification = (type, msg) => {
        setNotification({ type, msg })
        setTimeout(() => setNotification(null), 3000)
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
    }

    const tabs = ['wallet', 'history', 'send', 'add']

    const cycleTab = (dir) => {
        const idx = tabs.indexOf(activeTab)
        setActiveTab(tabs[(idx + dir + tabs.length) % tabs.length])
    }

    return (
        <GestureApp gestures={{ onSwipeLeft: () => cycleTab(1), onSwipeRight: () => cycleTab(-1) }}>
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-xl text-white overflow-hidden flex flex-col font-sans">
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                        </div>
                        <span className="font-semibold text-lg tracking-wide">Aether Pay</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Navigation */}
                    <div className="w-20 border-r border-white/5 flex flex-col items-center py-6 gap-4">
                        <NavButton icon="wallet" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} label="Wallet" />
                        <NavButton icon="history" active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
                        <NavButton icon="send" active={activeTab === 'send'} onClick={() => setActiveTab('send')} label="Send" />
                        <NavButton icon="add_card" active={activeTab === 'add'} onClick={() => setActiveTab('add')} label="Add" />
                    </div>

                    {/* Tab Content */}
                    <div data-scroll className="flex-1 p-8 overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <span className="material-symbols-outlined animate-spin text-4xl text-cyan-500">sync</span>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* WALLET TAB */}
                                {activeTab === 'wallet' && (
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h2 className="text-sm text-cyan-200/60 uppercase tracking-widest mb-1">Total Balance</h2>
                                                <div className="text-5xl font-light text-white">$12,450.00</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setActiveTab('send')} className="px-6 py-2 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform">Send</button>
                                                <button className="px-6 py-2 bg-white/10 border border-white/10 rounded-full font-medium hover:bg-white/20 transition-colors">Request</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {cards.map(card => (
                                                <div key={card.id} className={`aspect-[1.586/1] rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br ${card.color} shadow-2xl hover:scale-[1.02] transition-transform cursor-pointer group`}>
                                                    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-white/20 transition-colors" />
                                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                                        <div className="flex justify-between items-start">
                                                            <span className="font-mono text-xs opacity-70">Debit</span>
                                                            <span className="material-symbols-outlined text-3xl opacity-90">{card.type === 'visa' ? 'credit_card' : 'payments'}</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-mono tracking-widest mb-1">•••• •••• •••• {card.last4}</div>
                                                            <div className="flex justify-between text-xs font-mono opacity-80 uppercase">
                                                                <span>{card.holder}</span>
                                                                <span>{card.expiry}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Add New Card Placeholder */}
                                            <div onClick={() => setActiveTab('add')} className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group">
                                                <span className="material-symbols-outlined text-4xl text-white/20 group-hover:text-cyan-400 transition-colors">add</span>
                                                <span className="text-sm text-white/40 group-hover:text-cyan-400">Add New Card</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-light mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-cyan-400">insights</span>
                                                Recent Activity
                                            </h3>
                                            <div className="bg-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                                                {transactions.slice(0, 3).map(tx => (
                                                    <TransactionRow key={tx.id} tx={tx} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* HISTORY TAB */}
                                {activeTab === 'history' && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-light mb-6">Transaction History</h2>
                                        <div className="bg-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                                            {transactions.map(tx => (
                                                <TransactionRow key={tx.id} tx={tx} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SEND MONEY TAB */}
                                {activeTab === 'send' && (
                                    <div className="max-w-lg mx-auto bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                                        <h2 className="text-2xl font-light mb-8 text-center">Send Money</h2>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-widest text-cyan-200/50 ml-1">Recipient</label>
                                                <div className="bg-black/20 rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5 focus-within:border-cyan-500/50 transition-colors">
                                                    <span className="material-symbols-outlined text-white/50">person</span>
                                                    <input
                                                        type="text"
                                                        value={recipient}
                                                        onChange={(e) => setRecipient(e.target.value)}
                                                        className="bg-transparent border-none outline-none w-full text-white placeholder-white/20"
                                                        placeholder="Email, username or phone"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-widest text-cyan-200/50 ml-1">Amount (USD)</label>
                                                <div className="bg-black/20 rounded-xl px-4 py-8 flex items-center justify-center gap-1 border border-white/5 focus-within:border-cyan-500/50 transition-colors">
                                                    <span className="text-3xl text-white/50">$</span>
                                                    <input
                                                        type="number"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        className="bg-transparent border-none outline-none w-32 text-4xl text-center text-white placeholder-white/20"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <button
                                                    onClick={handlePayment}
                                                    disabled={processing || !amount || !recipient}
                                                    className={`w-full py-4 rounded-xl font-bold tracking-wide text-black transition-all ${processing || !amount || !recipient ? 'bg-zinc-700 cursor-not-allowed text-white/20' : 'bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]'}`}
                                                >
                                                    {processing ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                                            Processing...
                                                        </span>
                                                    ) : 'Confirm Transaction'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ADD CARD TAB (Placeholder Logic) */}
                                {activeTab === 'add' && (
                                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-4xl text-cyan-400">credit_card</span>
                                        </div>
                                        <h3 className="text-xl text-white">Add Payment Method</h3>
                                        <p className="text-white/50 max-w-sm">Securely link your bank account or credit card to Aether Pay. (Simulation Only)</p>
                                        <button onClick={() => showNotification('success', 'Card Added (Simulated)')} className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all">
                                            Simulate Link Card
                                        </button>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>

                {/* Notification Toast */}
                {notification && (
                    <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 ${notification.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-200' : 'bg-red-500/20 border border-red-500/50 text-red-200'}`}>
                        <span className="material-symbols-outlined">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
                        <span className="font-medium">{notification.msg}</span>
                    </div>
                )}
            </div>
        </GestureApp>
    )
}

const NavButton = ({ icon, active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative ${active ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
        title={label}
    >
        <span className="material-symbols-outlined text-2xl">{icon}</span>
        {active && <div className="absolute left-0 -ml-1 w-1 h-6 bg-cyan-200 rounded-r-full" />}
    </button>
)

const TransactionRow = ({ tx }) => (
    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/50'}`}>
                <span className="material-symbols-outlined text-lg">
                    {tx.merchant === 'Spotify' ? 'music_note' : tx.merchant === 'Netflix' ? 'movie' : tx.merchant === 'Amazon' ? 'shopping_cart' : 'payments'}
                </span>
            </div>
            <div>
                <div className="font-medium text-white">{tx.merchant}</div>
                <div className="text-xs text-white/40 font-mono">{new Date(tx.date).toLocaleDateString()}</div>
            </div>
        </div>
        <div className="font-mono text-right">
            <div className="text-white">-{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}</div>
            <div className="text-xs text-white/40 capitalize">{tx.provider}</div>
        </div>
    </div>
)

export default PaymentSystem
