"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonHandler = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
class ButtonHandler {
    constructor(client) {
        this.client = client;
        this.buttons = new discord_js_1.Collection();
    }
    async loadButtons() {
        const buttonPath = (0, path_1.join)(__dirname, '..', 'buttons');
        if (!(0, fs_1.existsSync)(buttonPath)) {
            console.log("[Bot] Buttons directory not found, creating empty directory");
            try {
                (0, fs_1.mkdirSync)(buttonPath, { recursive: true });
            }
            catch (error) {
                console.warn("[Bot] Could not create buttons directory:", error);
                return this.buttons;
            }
        }
        for (const dir of (0, fs_1.readdirSync)(buttonPath)) {
            const buttons = (0, fs_1.readdirSync)((0, path_1.join)(buttonPath, dir))
                .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
            for (const file of buttons) {
                const { button } = await Promise.resolve(`${(0, path_1.join)(buttonPath, dir, file)}`).then(s => __importStar(require(s)));
                if (button && button.customId) {
                    this.buttons.set(button.customId, button);
                    console.log(`Loaded button: ${button.customId}`);
                }
            }
        }
        return this.buttons;
    }
}
exports.ButtonHandler = ButtonHandler;
