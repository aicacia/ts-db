"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldValue = getFieldValue;
/** Get nested field value from document using dot notation. */
function getFieldValue(doc, field) {
    const parts = field.split(".");
    let value = doc;
    for (const part of parts) {
        if (value === null || value === undefined || typeof value !== "object") {
            return undefined;
        }
        value = value[part];
    }
    return value;
}
//# sourceMappingURL=field.js.map