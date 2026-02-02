export const Browser = ({ onClose }) => {
    return (
        <div className="w-full h-full bg-white rounded-lg flex flex-col overflow-hidden text-black">
            {/* Browser Toolbar */}
            <div className="bg-gray-100 p-2 flex items-center gap-2 border-b border-gray-300">
                <div className="flex gap-1">
                    <div onClick={onClose} className="w-3 h-3 rounded-full bg-red-400 cursor-pointer hover:bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-500 shadow-sm mx-4">
                    https://google.com
                </div>
                <span className="material-symbols-outlined text-gray-400 text-sm">refresh</span>
            </div>

            {/* Browser Content */}
            <div className="flex-1 bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-300 mb-2">Google</h1>
                    <div className="w-96 h-10 border border-gray-200 rounded-full shadow-sm mx-auto"></div>
                </div>
            </div>
        </div>
    )
}
