export interface SubtitleCue {
    start: number;
    end: number;
    text: string;
}

export function parseVTT(vttText: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const lines = vttText.split(/\r?\n/);
    
    let currentCue: Partial<SubtitleCue> = {};
    
    const timeRegex = /(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('-->')) {
            const [startStr, endStr] = line.split('-->').map(s => s.trim());
            currentCue.start = parseTime(startStr);
            currentCue.end = parseTime(endStr);
        } else if (line && !line.startsWith('WEBVTT') && !line.match(/^\d+$/)) {
            if (currentCue.start !== undefined) {
                currentCue.text = currentCue.text ? currentCue.text + '\n' + line : line;
            }
        } else if (line === '' && currentCue.start !== undefined) {
            cues.push(currentCue as SubtitleCue);
            currentCue = {};
        }
    }
    
    if (currentCue.start !== undefined) {
        cues.push(currentCue as SubtitleCue);
    }

    return cues;
}

function parseTime(timeStr: string): number {
    const parts = timeStr.split(':');
    let h = 0, m = 0, s = 0;
    
    if (parts.length === 3) {
        h = parseInt(parts[0]);
        m = parseInt(parts[1]);
        s = parseFloat(parts[2]);
    } else {
        m = parseInt(parts[0]);
        s = parseFloat(parts[1]);
    }
    
    return h * 3600 + m * 60 + s;
}
