/**
 * AetherFS v2 — File System Engine
 * Extends the basic idb-keyval store with:
 * - Real OS file system access (File System Access API)
 * - Virtual path namespace (aether://documents, aether://vault, etc.)
 * - AES-GCM encrypted vault
 * - File indexing and search
 */

import { get, set, del, entries } from 'idb-keyval'

// Virtual path prefixes
export const Paths = {
    DOCUMENTS: 'aether://documents',
    VAULT: 'aether://vault',
    APPS: 'aether://apps',
    DOWNLOADS: 'aether://downloads',
    CAMERA: 'aether://camera',
}

class AetherFileSystem {
    constructor() {
        this._dirHandles = new Map()     // virtual path → FileSystemDirectoryHandle
        this._index = new Map()          // filename → metadata
        this._vaultKey = null            // CryptoKey for AES-GCM
        this._watchers = new Map()       // path → Set<callback>
    }

    // ─── Boot ─────────────────────────────────────────────────────────────────

    async init() {
        await this._buildIndex()
        console.info('[AetherFS] File index built:', this._index.size, 'entries')
    }

    // ─── Real OS File Access ──────────────────────────────────────────────────

    /** Opens a real OS directory picker and mounts it to a virtual path */
    async mount(virtualPath = Paths.DOCUMENTS) {
        if (!window.showDirectoryPicker) {
            throw new Error('File System Access API not supported in this browser.')
        }
        try {
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
            this._dirHandles.set(virtualPath, handle)
            await this._indexDirectory(handle, virtualPath)
            console.info(`[AetherFS] Mounted "${handle.name}" → ${virtualPath}`)
            return handle.name
        } catch (err) {
            if (err.name === 'AbortError') return null
            throw err
        }
    }

    /** List files at a virtual path (real directory or idb fallback) */
    async ls(virtualPath = Paths.DOCUMENTS) {
        const handle = this._dirHandles.get(virtualPath)
        if (handle) {
            const files = []
            for await (const [name, entry] of handle.entries()) {
                const kind = entry.kind
                if (kind === 'file') {
                    const file = await entry.getFile()
                    files.push({
                        id: `real_${virtualPath}_${name}`,
                        name,
                        type: file.type || this._inferType(name),
                        size: file.size,
                        lastModified: file.lastModified,
                        path: `${virtualPath}/${name}`,
                        source: 'real',
                        handle: entry,
                    })
                }
            }
            return files.sort((a, b) => b.lastModified - a.lastModified)
        }
        // Fallback to idb
        return this._idbList()
    }

    async stat(virtualPath) {
        const handle = this._dirHandles.get(virtualPath)
        if (handle) {
            let fileCount = 0
            let totalSize = 0
            for await (const [, entry] of handle.entries()) {
                if (entry.kind === 'file') {
                    fileCount++
                    const f = await entry.getFile()
                    totalSize += f.size
                }
            }
            return { path: virtualPath, name: handle.name, fileCount, totalSize, mounted: true }
        }
        const files = await this._idbList()
        return { path: virtualPath, mounted: false, fileCount: files.length }
    }

    // ─── idb Store (existing functionality, enhanced) ─────────────────────────

    async write(file, path = Paths.DOCUMENTS) {
        const id = `file_${Date.now()}_${crypto.randomUUID()}`
        const meta = {
            id, name: file.name, type: file.type,
            size: file.size, lastModified: file.lastModified || Date.now(),
            created: Date.now(), path, data: file,
        }
        await set(id, meta)
        this._index.set(file.name, meta)
        this._notifyWatchers(path)
        return meta
    }

    async read(id) { return get(id) }

    async delete(id) {
        const meta = await get(id)
        await del(id)
        if (meta) {
            this._index.delete(meta.name)
            this._notifyWatchers(meta.path || Paths.DOCUMENTS)
        }
    }

    async list(path) { return this._idbList(path) }

    // ─── Search ───────────────────────────────────────────────────────────────

    search(query) {
        const q = query.toLowerCase()
        const results = []
        for (const [name, meta] of this._index) {
            if (name.toLowerCase().includes(q)) results.push(meta)
        }
        return results
    }

    // ─── Encrypted Vault ──────────────────────────────────────────────────────

    async unlockVault(passphrase) {
        this._vaultKey = await this._deriveKey(passphrase)
        console.info('[AetherFS] Vault unlocked')
    }

    async writeVault(filename, data) {
        if (!this._vaultKey) throw new Error('Vault locked. Call unlockVault() first.')
        const encoded = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data))
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this._vaultKey, encoded)
        const id = `vault_${filename}`
        await set(id, { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) })
    }

    async readVault(filename) {
        if (!this._vaultKey) throw new Error('Vault locked.')
        const stored = await get(`vault_${filename}`)
        if (!stored) return null
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(stored.iv) },
            this._vaultKey,
            new Uint8Array(stored.data)
        )
        return JSON.parse(new TextDecoder().decode(decrypted))
    }

    // ─── Watchers ─────────────────────────────────────────────────────────────

    watch(path, callback) {
        if (!this._watchers.has(path)) this._watchers.set(path, new Set())
        this._watchers.get(path).add(callback)
        return () => this._watchers.get(path)?.delete(callback)
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    async _idbList(path) {
        try {
            const all = await entries()
            return all
                .filter(([k]) => typeof k === 'string' && k.startsWith('file_'))
                .map(([, v]) => v)
                .filter(v => !path || !v.path || v.path === path)
                .sort((a, b) => b.created - a.created)
        } catch { return [] }
    }

    async _buildIndex() {
        const files = await this._idbList()
        for (const f of files) this._index.set(f.name, f)
    }

    async _indexDirectory(handle, virtualPath) {
        for await (const [name, entry] of handle.entries()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile()
                this._index.set(name, { name, type: file.type, size: file.size, path: `${virtualPath}/${name}` })
            }
        }
    }

    _notifyWatchers(path) {
        this._watchers.get(path)?.forEach(cb => cb(path))
    }

    _inferType(name) {
        const ext = name.split('.').pop()?.toLowerCase()
        const map = { mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf', txt: 'text/plain' }
        return map[ext] || 'application/octet-stream'
    }

    async _deriveKey(passphrase) {
        const enc = new TextEncoder()
        const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: enc.encode('aether-vault-salt'), iterations: 100000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        )
    }
}

export const AetherFS = new AetherFileSystem()
