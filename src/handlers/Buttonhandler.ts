import { Collection } from 'discord.js';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Button } from '../interfaces/Button';
import type { Bot } from '../index';
import { scriptExt } from '../utils/scriptExt';

export class ButtonHandler {
    private client: Bot;
    private buttons: Collection<string, Button>;

    constructor(client: Bot) {
        this.client = client;
        this.buttons = new Collection();
    }

    async loadButtons() {
        const buttonPath = join(__dirname, '..', 'buttons');
        
        if (!existsSync(buttonPath)) {
            console.log("[Bot] Buttons directory not found, creating empty directory");
            try {
                mkdirSync(buttonPath, { recursive: true });
            } catch (error) {
                console.warn("[Bot] Could not create buttons directory:", error);
                return this.buttons;
            }
        }
        
        for (const dir of readdirSync(buttonPath)) {
            const buttons = readdirSync(join(buttonPath, dir))
                .filter(file => file.endsWith(scriptExt));
            
            for (const file of buttons) {
                const { button } = await import(join(buttonPath, dir, file));
                if (button && button.customId) {
                    this.buttons.set(button.customId, button);
                    console.log(`Loaded button: ${button.customId}`);
                }
            }
        }

        this.client.buttons = this.buttons;
        return this.buttons;
    }
}