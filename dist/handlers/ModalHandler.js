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
exports.ModalHandler = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
class ModalHandler {
    constructor(client) {
        // Change from Client to Bot
        this.client = client;
        this.modals = new discord_js_1.Collection();
    }
    async loadModals() {
        const modalPath = (0, path_1.join)(__dirname, "..", "modals");
        for (const dir of (0, fs_1.readdirSync)(modalPath)) {
            const modals = (0, fs_1.readdirSync)((0, path_1.join)(modalPath, dir)).filter((file) => file.endsWith(".ts"));
            for (const file of modals) {
                const { modal } = await Promise.resolve(`${(0, path_1.join)(modalPath, dir, file)}`).then(s => __importStar(require(s)));
                this.modals.set(modal.customId, modal);
                console.log(`Loaded modal: ${modal.customId}`);
            }
        }
        // Set the modals on the client
        this.client.modals = this.modals;
        return this.modals;
    }
    getModal(customId) {
        return this.modals.get(customId);
    }
}
exports.ModalHandler = ModalHandler;
