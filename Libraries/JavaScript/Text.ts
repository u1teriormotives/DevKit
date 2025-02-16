import { Element } from "./Element"

export default class Text {
    public readonly assignedSlot: Element | null = null;
    public readonly wholeText: Text | null = null;

    private textContent: string;
    constructor(text: string) {
        this.textContent = text;
    }

    get text(): string {
        return this.textContent;
    }

    public splitText(offset: number) {
        const split = [];
        split.push(this.textContent.slice(0, offset));
        split.push(this.textContent.slice(offset));
        this.textContent = split.join("\n");
    }
}
