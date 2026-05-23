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
exports.SelectMenuHandler = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const scriptExt = __filename.endsWith(".js") ? ".js" : ".ts";
class SelectMenuHandler {
    constructor(client) {
        this.client = client;
        this.selectMenus = new discord_js_1.Collection();
    }
    async loadSelectMenus() {
        const selectMenuPath = (0, path_1.join)(__dirname, "..", "selectMenus");
        if (!(0, fs_1.existsSync)(selectMenuPath)) {
            console.log("[Bot] SelectMenus directory not found, creating empty directory");
            try {
                (0, fs_1.mkdirSync)(selectMenuPath, { recursive: true });
            }
            catch (error) {
                console.warn("[Bot] Could not create selectMenus directory:", error);
                return this.selectMenus;
            }
        }
        for (const dir of (0, fs_1.readdirSync)(selectMenuPath)) {
            const selectMenus = (0, fs_1.readdirSync)((0, path_1.join)(selectMenuPath, dir)).filter((file) => file.endsWith(scriptExt));
            for (const file of selectMenus) {
                const { selectMenu } = await Promise.resolve(`${(0, path_1.join)(selectMenuPath, dir, file)}`).then(s => __importStar(require(s)));
                if (selectMenu && selectMenu.customId) {
                    this.selectMenus.set(selectMenu.customId, selectMenu);
                    console.log(`Loaded select menu: ${selectMenu.customId}`);
                }
            }
        }
        return this.selectMenus;
    }
    getSelectMenu(customId) {
        // First try exact match
        let selectMenu = this.selectMenus.get(customId);
        // If no exact match, try to find by prefix (for dynamic custom IDs)
        if (!selectMenu) {
            for (const [id, menu] of this.selectMenus) {
                if (customId.startsWith(id)) {
                    selectMenu = menu;
                    break;
                }
            }
        }
        return selectMenu;
    }
}
exports.SelectMenuHandler = SelectMenuHandler;
