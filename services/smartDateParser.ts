
import * as chrono from 'chrono-node';

export interface DateParseResult {
    date: Date;
    text: string;
    hasTime: boolean;
}

export const parseSmartDate = (text: string): DateParseResult | null => {
    try {
        const results = chrono.parse(text);
        
        if (results.length > 0) {
            const result = results[0];
            const date = result.start.date();
            const hasTime = result.start.isCertain('hour');
            
            return {
                date,
                text: result.text,
                hasTime
            };
        }
        return null;
    } catch (e) {
        console.warn("Smart date parsing failed (dependency might be missing)", e);
        return null;
    }
};
