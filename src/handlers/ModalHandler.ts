import { Client, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Modal } from '../interfaces/Modal';

export class ModalHandler {
    private client: Client;
    private modals: Collection<string, Modal>;

    constructor(client: Client) {
        this.client = client;
        this.modals = new Collection();
    }

    async loadModals() {
        const modalPath = join(__dirname, '..', 'modals');
        
        for (const dir of readdirSync(modalPath)) {
            const modals = readdirSync(join(modalPath, dir)).filter(file => file.endsWith('.ts'));
            
            for (const file of modals) {
                const { modal } = await import(join(modalPath, dir, file));
                this.modals.set(modal.customId, modal);
            }
        }

        return this.modals;
    }

    getModal(customId: string): Modal | undefined {
        return this.modals.get(customId);
    }
} 