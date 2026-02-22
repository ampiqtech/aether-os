import { get, set, del, entries } from 'idb-keyval'

export const FileSystem = {
    // Saves a File/Blob object with metadata
    writeFile: async (file) => {
        // Use timestamp for rough chronological ordering + UUID for uniqueness
        const id = `file_${Date.now()}_${crypto.randomUUID()}`
        const fileData = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified || Date.now(),
            created: Date.now(),
            data: file
        }
        await set(id, fileData)
        return fileData
    },

    readFile: async (id) => {
        return await get(id)
    },

    deleteFile: async (id) => {
        return await del(id)
    },

    listFiles: async () => {
        try {
            const allEntries = await entries()
            return allEntries
                .filter(([key]) => typeof key === 'string' && key.startsWith('file_'))
                .map(([_, value]) => value)
                .sort((a, b) => b.created - a.created)
        } catch (error) {
            console.error("FileSystem Error:", error)
            return []
        }
    }
}
